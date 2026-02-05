'use client';

import React, { useState, useEffect, useRef, useCallback } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";
import { BottomNav } from "@/components/BottomNav";
import AddFundModal from "@/components/AddFundModal";
import TagManagementModal from "@/components/TagManagementModal";

// --- 类型定义 ---
interface Fund {
  fundcode: string;
  name: string;
  dwjz: string;    // 单位净值 (昨收)
  gsz: string;     // 估算净值 (实时)
  gszzl: string;   // 估算涨跌幅
  gztime: string;  // 估值时间
  isStarred?: boolean; // 特别关注
  tags: string[];      // 标签分组
  hasReplace?: boolean; // 是否已使用真实净值替换估值 (盘后模式)
}

// 扩展 Window 接口以支持 JSONP 回调和腾讯全局变量
declare global {
  interface Window {
    jsonpgz: (data: any) => void;
    [key: string]: any;
  }
}

export default function FundsPage() {
  // --- 状态管理 ---
  const [funds, setFunds] = useState<Fund[]>([]);
  const [tags, setTags] = useState<string[]>(["全部", "自选"]);
  const [activeTag, setActiveTag] = useState("全部");
  const [nameSortType, setNameSortType] = useState<'none' | 'asc' | 'desc'>('none');
  const [changeSortType, setChangeSortType] = useState<'none' | 'asc' | 'desc'>('none');
  const [sortBy, setSortBy] = useState<'name' | 'change'>('change');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  // 默认基金列表
  const [fundList, setFundList] = useState<string[]>(["001618", "001630", "008887", "005827", "161725"]);

  // 使用 Ref 解决闭包陷阱
  const fundsRef = useRef<Fund[]>([]);
  const fundListRef = useRef<string[]>([]);

  // 关键修复：添加初始化标志，防止默认空数据覆盖 LocalStorage 中的旧数据
  const [isInitialized, setIsInitialized] = useState(false);

  // --- 持久化逻辑 (修复版：仅在初始化完成后保存) ---
  useEffect(() => {
    if (!isInitialized) return; // 如果还没加载完，不要保存
    fundsRef.current = funds;
    if (funds.length > 0) localStorage.setItem('savedFunds', JSON.stringify(funds));
  }, [funds, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return; // 如果还没加载完，不要保存
    fundListRef.current = fundList;
    localStorage.setItem('savedFundList', JSON.stringify(fundList));
  }, [fundList, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return; // 如果还没加载完，不要保存
    localStorage.setItem('savedTags', JSON.stringify(tags));
  }, [tags, isInitialized]);

  // --- 初始化加载 (升级版：结构缓存优先 + 初始化锁) ---
  useEffect(() => {
    const savedTags = localStorage.getItem('savedTags');
    const savedFundList = localStorage.getItem('savedFundList');
    const savedFunds = localStorage.getItem('savedFunds');

    // 1. 恢复标签结构
    if (savedTags) {
      try {
        setTags(JSON.parse(savedTags));
      } catch (e) {
        console.error("Failed to parse savedTags", e);
      }
    }
    
    // 2. 恢复基金列表代码
    if (savedFundList) {
      try {
        const list = JSON.parse(savedFundList);
        setFundList(list);
        fundListRef.current = list;
      } catch (e) { console.error(e); }
    }

    let codesToRefresh: string[] = [];

    // 3. 数据分离加载策略
    if (savedFunds) {
       try {
         const parsedFunds: Fund[] = JSON.parse(savedFunds);
         setFunds(parsedFunds);
         codesToRefresh = parsedFunds.map(f => f.fundcode);
       } catch (e) { console.error(e); }
    } else if (savedFundList) {
       codesToRefresh = JSON.parse(savedFundList);
    } else {
       codesToRefresh = fundList;
    }
    
    // 标记初始化完成，允许后续的 Save 操作
    setIsInitialized(true);

    // 4. 立即触发网络刷新
    setTimeout(() => {
        refreshAllFunds(codesToRefresh);
    }, 0);

  }, []);

  // --- 核心逻辑：定义全局 JSONP 回调 ---
  useEffect(() => {
    window.jsonpgz = (gzData: any) => {
      if (!gzData || !gzData.fundcode) return;
      const code = gzData.fundcode;
      fetchTencentData(code, gzData);
    };

    const interval = setInterval(() => {
      if (autoRefresh) {
        refreshAllFunds(fundListRef.current);
      }
    }, 600000);

    return () => clearInterval(interval);
  }, []);

  // --- 辅助函数：获取腾讯数据并整合 ---
  const fetchTencentData = (code: string, gzData: any) => {
    const script = document.createElement("script");
    script.src = `https://qt.gtimg.cn/q=jj${code}`;
    script.onload = () => {
      const tencentVar = window[`v_jj${code}`];
      if (tencentVar) {
        const tDataArr = tencentVar.split("~");
        if (tDataArr.length > 5) {
          const tencentDate = tDataArr[3]; 
          const tencentNav = tDataArr[1];  
          const tencentChange = tDataArr[5]; 
          const gzDate = gzData.jzrq; 

          if (tencentDate && (!gzDate || tencentDate >= gzDate)) {
             gzData.gsz = tencentNav;
             gzData.gszzl = tencentChange;
             gzData.hasReplace = true; 
             gzData.gztime = `净值 ${tencentDate}`; 
          }
        }
      }
      updateFundState(gzData);
      document.body.removeChild(script);
    };
    script.onerror = () => {
        updateFundState(gzData);
        if(document.body.contains(script)) document.body.removeChild(script);
    };
    document.body.appendChild(script);
  };

  // --- 辅助函数：更新 React 状态 ---
  const updateFundState = (newData: any) => {
    setFunds(prevFunds => {
      const existingIndex = prevFunds.findIndex(f => f.fundcode === newData.fundcode);
      const existingTags = existingIndex > -1 ? prevFunds[existingIndex].tags : ["全部"];
      const existingStar = existingIndex > -1 ? prevFunds[existingIndex].isStarred : false;

      const newFundObj: Fund = {
        fundcode: newData.fundcode,
        name: newData.name,
        dwjz: newData.dwjz || "--", 
        gsz: newData.gsz || newData.dwjz || "--",
        gszzl: newData.gszzl || "0.00",
        gztime: newData.gztime || newData.jzrq || "--",
        tags: existingTags,
        isStarred: existingStar,
        hasReplace: newData.hasReplace
      };

      if (existingIndex > -1) {
        const newArr = [...prevFunds];
        newArr[existingIndex] = newFundObj;
        return newArr;
      } else {
        return [...prevFunds, newFundObj];
      }
    });
  };

  // --- 核心函数：触发所有基金的刷新 ---
  const refreshAllFunds = (codes: string[]) => {
    if (!codes || codes.length === 0) return;
    
    codes.forEach(code => {
      const script = document.createElement("script");
      script.src = `https://fundgz.1234567.com.cn/js/${code}.js?rt=${new Date().getTime()}`;
      script.onload = () => { document.body.removeChild(script); };
      script.onerror = () => {
         fetchTencentData(code, { fundcode: code, name: "加载中...", jzrq: "" });
         if(document.body.contains(script)) document.body.removeChild(script);
      };
      document.body.appendChild(script);
    });
  };

  // --- 交互处理 ---
  const handleToggleStar = (code: string) => {
    setFunds(prev => prev.map(f => 
      f.fundcode === code ? { ...f, isStarred: !f.isStarred } : f
    ));
  };

  // 关键修复：重命名参数 selectedTags 避免与 state tags 冲突
  const handleSaveFund = (newFund: any, selectedTags: string[] = ["全部"]) => {
    const code = newFund.fundcode || newFund; 
    const isTagAdd = typeof newFund === 'string';
    
    if (!isTagAdd && !fundList.includes(code)) {
      const newList = [...fundList, code];
      setFundList(newList);
      fundListRef.current = newList;
      
      setFunds(prev => [...prev, {
          fundcode: code,
          name: "加载中...",
          dwjz: "--",
          gsz: "--",
          gszzl: "0.00",
          gztime: "--",
          tags: ["全部", ...selectedTags],
          isStarred: false
      }]);

      setTimeout(() => refreshAllFunds([code]), 100);
    }
    
    // 更新基金自身的标签
    setFunds(prev => prev.map(f => {
        if (f.fundcode === code) {
            if (isTagAdd) {
                const updatedTags = [...f.tags];
                selectedTags.forEach(tag => {
                    if (!updatedTags.includes(tag)) updatedTags.push(tag);
                });
                return { ...f, tags: updatedTags };
            } else {
                const mergedTags = Array.from(new Set([...f.tags, ...selectedTags]));
                return { ...f, tags: mergedTags };
            }
        }
        return f;
    }));

    setIsModalOpen(false);

    // 更新顶部标签栏 (修复变量作用域问题)
    if (!isTagAdd) {
      setTags(prevTags => {
        // 在这里，prevTags 是当前的状态，selectedTags 是用户新选的
        const newTagsToAdd = selectedTags.filter(tag => !prevTags.includes(tag));
        if (newTagsToAdd.length > 0) {
          return [...prevTags, ...newTagsToAdd];
        }
        return prevTags;
      });
    }
  };

  const handleSaveTags = (originalTags: string[], updatedTags: string[]) => {
    const deletedTags = originalTags.filter(tag => !updatedTags.includes(tag));
    const renamedTags = updatedTags.map((newName, index) => {
      const oldName = originalTags[index];
      if (newName !== oldName) {
        return { oldName, newName };
      }
      return null;
    }).filter((item): item is { oldName: string; newName: string } => item !== null);
    
    setFunds(prev => prev.map(fund => {
      let updatedFundTags = [...fund.tags];
      deletedTags.forEach(tag => {
        updatedFundTags = updatedFundTags.filter(t => t !== tag);
      });
      renamedTags.forEach(({ oldName, newName }) => {
        updatedFundTags = updatedFundTags.map(t => t === oldName ? newName : t);
      });
      return { ...fund, tags: updatedFundTags };
    }));
    
    setTags(prev => {
      const baseTags = prev.filter(t => t === "全部" || t === "自选");
      const customTags = updatedTags.filter(t => t !== "全部" && t !== "自选");
      return [...baseTags, ...customTags.filter(t => !baseTags.includes(t as any))];
    });
  };

  // --- 渲染逻辑 ---
  const processedFunds = (() => {
    let list = [...funds];
    if (activeTag !== "全部") {
      list = list.filter(f => f.tags.includes(activeTag));
    }
    if (sortBy === 'name' && nameSortType !== 'none') {
      list.sort((a, b) => {
        const nameA = a.name.localeCompare(b.name);
        return nameSortType === 'asc' ? nameA : -nameA;
      });
    } else if (sortBy === 'change' && changeSortType !== 'none') {
      list.sort((a, b) => {
        const valA = parseFloat(a.gszzl);
        const valB = parseFloat(b.gszzl);
        return changeSortType === 'asc' ? valA - valB : valB - valA;
      });
    }
    list.sort((a, b) => (b.isStarred ? 1 : 0) - (a.isStarred ? 1 : 0));
    return list;
  })();

  const navItems = [
    { label: "自选", icon: "dashboard", href: "/funds", isActive: true },
    { label: "行情", icon: "query_stats", href: "/market" },
    { label: "资产", icon: "account_balance_wallet", href: "/portfolio" },
    { label: "我的", icon: "person", href: "/profile" },
  ];

  const scrollableTags = tags.filter(t => t !== "全部");

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col max-w-[430px] mx-auto overflow-x-hidden shadow-2xl bg-background-light dark:bg-background-dark font-display text-white">
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between border-b border-white/10">
        <div className="flex w-12 items-center justify-start">
          <button 
            className={`flex size-10 shrink-0 items-center justify-center rounded-full transition-colors ${autoRefresh ? 'bg-primary/20' : 'hover:bg-white/10'}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Icon name="sync" className={`text-white ${autoRefresh ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          自选基金
        </h2>
        <div className="flex w-12 items-center justify-end">
          <button 
            className="flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-full hover:bg-white/10 transition-colors text-white"
            onClick={() => setIsModalOpen(true)}
          >
            <Icon name="add" />
          </button>
        </div>
      </header>
      
      {/* Tabs */}
      <div className="relative z-40 w-full flex items-center h-[52px] border-b border-white/5 bg-background-light dark:bg-background-dark">
        {/* Fixed Left: All */}
        <div className="relative z-20 h-full flex items-center justify-center px-4 bg-background-light dark:bg-background-dark shadow-[4px_0_12px_rgba(0,0,0,0.1)]">
           <a
              className={`flex flex-col items-center justify-center h-full border-b-2 transition-colors ${
                activeTag === "全部"
                  ? "border-primary text-white"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTag("全部");
              }}
            >
              <p className={`text-sm ${activeTag === "全部" ? "font-bold" : "font-medium"}`}>
                全部 ({funds.length})
              </p>
            </a>
        </div>

        {/* Scrollable Middle */}
        <div className="flex-1 h-full relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background-light dark:from-background-dark to-transparent z-10 pointer-events-none" />
            <div className="h-full overflow-x-auto no-scrollbar flex items-center pl-2 pr-2 gap-6">
                {scrollableTags.map((tab) => {
                  const count = funds.filter(fund => fund.tags.includes(tab)).length;
                  return (
                    <a
                      key={tab}
                      className={`flex flex-col items-center justify-center h-full border-b-2 shrink-0 transition-colors px-1 whitespace-nowrap ${
                        tab === activeTag
                          ? "border-primary text-white"
                          : "border-transparent text-slate-400 hover:text-white"
                      }`}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTag(tab);
                      }}
                    >
                      <p className={`text-sm ${tab === activeTag ? "font-bold" : "font-medium"}`}>
                        {tab} ({count})
                      </p>
                    </a>
                  );
                })}
                <div className="w-2 shrink-0"></div>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background-light dark:from-background-dark to-transparent z-10 pointer-events-none" />
        </div>

        {/* Fixed Right: Tools */}
        <div className="relative z-20 h-full flex items-center gap-2 pl-2 pr-4 bg-background-light dark:bg-background-dark shadow-[-4px_0_12px_rgba(0,0,0,0.1)]">
            <button 
              className="text-slate-500 hover:text-white flex items-center justify-center size-8 rounded-full hover:bg-white/5 transition-colors"
              onClick={() => setIsTagModalOpen(true)}
            >
              <Icon name="label" className="text-sm" />
            </button>
            <div className="flex flex-col gap-0.5">
                <button 
                className={`${nameSortType !== 'none' ? 'text-primary' : 'text-slate-500'} flex items-center justify-center size-4 hover:text-white`}
                onClick={() => {
                    setNameSortType(prev => {
                    if (prev === 'none') { setSortBy('name'); return 'asc'; }
                    if (prev === 'asc') { setSortBy('name'); return 'desc'; }
                    return 'none';
                    });
                    setChangeSortType('none');
                }}
                >
                <Icon name={nameSortType === 'asc' ? "arrow_drop_up" : nameSortType === 'desc' ? "arrow_drop_down" : "sort_by_alpha"} className="text-[10px]" />
                </button>
                <button 
                className={`${changeSortType !== 'none' ? 'text-primary' : 'text-slate-500'} flex items-center justify-center size-4 hover:text-white`}
                onClick={() => {
                    setChangeSortType(prev => {
                    if (prev === 'none') { setSortBy('change'); return 'asc'; }
                    if (prev === 'asc') { setSortBy('change'); return 'desc'; }
                    return 'none';
                    });
                    setNameSortType('none');
                }}
                >
                <Icon name={changeSortType === 'asc' ? "arrow_drop_up" : changeSortType === 'desc' ? "arrow_drop_down" : "sort"} className="text-[10px]" />
                </button>
            </div>
        </div>
      </div>

      <main className="flex-1 pb-24 p-4 space-y-3">
        <div className="space-y-3">
          {processedFunds.length > 0 ? (
            processedFunds.map((fund) => {
              const isUp = parseFloat(fund.gszzl) >= 0;
              const displayTime = fund.gztime.includes(" ") ? fund.gztime.split(" ")[1] : fund.gztime;
              
              const FundCard = ({ fund, isUp, displayTime }: { fund: Fund, isUp: boolean, displayTime: string }) => {
                const [swipeOffset, setSwipeOffset] = useState(0);
                const [isSwiping, setIsSwiping] = useState(false);
                const [touchStartX, setTouchStartX] = useState(0);
                
                const handleTouchStart = (e: React.TouchEvent) => {
                  setIsSwiping(true);
                  setTouchStartX(e.touches[0].clientX);
                };
                
                const handleTouchMove = (e: React.TouchEvent) => {
                  if (!isSwiping) return;
                  const currentX = e.touches[0].clientX;
                  const diffX = currentX - touchStartX;
                  const newOffset = Math.max(-160, Math.min(160, diffX));
                  setSwipeOffset(newOffset);
                };
                
                const handleTouchEnd = (e: React.TouchEvent) => {
                  setIsSwiping(false);
                  if (swipeOffset < -80) {
                    setSwipeOffset(-160); 
                  } else if (swipeOffset > 80) {
                    setFunds(prev => prev.map(f => {
                      if (f.fundcode === fund.fundcode) {
                        const has自选Tag = f.tags.includes("自选");
                        return { ...f, tags: has自选Tag ? f.tags : [...f.tags, "自选"] };
                      }
                      return f;
                    }));
                    setSwipeOffset(0);
                  } else {
                    setSwipeOffset(0);
                  }
                };
                
                return (
                  <div 
                    className="relative overflow-hidden"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <GlassCard
                      className="rounded-xl p-4 flex items-center justify-between hover:bg-white/[0.05] transition-all group relative z-10 bg-background-light dark:bg-background-dark"
                      style={{ transform: `translateX(${swipeOffset}px)`, transition: 'transform 0.2s ease-in-out' }}
                      variant="light"
                    >
                       <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full blur-xl opacity-10 ${isUp ? 'bg-gain-red' : 'bg-loss-green'} pointer-events-none`}></div>

                      <div className="flex items-center gap-3 z-10">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white text-sm font-bold truncate max-w-[180px]">
                                {fund.name}
                            </h4>
                            <p className="text-[#92a4c9] text-[10px] font-medium">
                                {fund.fundcode}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="text-sm font-bold font-display text-white flex items-center">
                                {fund.gsz}
                            </p>
                            <p className="text-[10px] text-slate-600 font-mono flex items-center">
                                更新: {displayTime}
                            </p>
                            {fund.hasReplace && (
                                <p className="text-[9px] px-1 bg-primary/20 text-primary rounded border border-primary/30 flex items-center">实</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 z-10">
                        <p className={`text-sm font-bold font-display ${isUp ? "text-gain-red" : "text-loss-green"}`}>
                          {isUp ? "+" : ""}{fund.gszzl}%
                        </p>
                      </div>
                    </GlassCard>
                    <div className="absolute top-0 right-0 bottom-0 flex items-center gap-2 p-4 z-0 rounded-xl bg-background-light dark:bg-background-dark">
                      {activeTag !== "全部" && fund.tags.includes(activeTag) ? (
                        <button 
                          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold"
                          onClick={() => {
                            setFunds(prev => prev.map(f => {
                              if (f.fundcode === fund.fundcode) {
                                return { ...f, tags: f.tags.filter(tag => tag !== activeTag) };
                              }
                              return f;
                            }));
                            setSwipeOffset(0);
                          }}
                        >
                          移除
                        </button>
                      ) : (
                        <button 
                          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold"
                          onClick={() => setSwipeOffset(0)}
                        >
                          操作
                        </button>
                      )}
                      <button 
                        className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold"
                        onClick={() => {
                          const newFundList = fundList.filter(code => code !== fund.fundcode);
                          setFundList(newFundList);
                          fundListRef.current = newFundList;
                          setFunds(prev => prev.filter(f => f.fundcode !== fund.fundcode));
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                );
              };
              
              return <FundCard key={fund.fundcode} fund={fund} isUp={isUp} displayTime={displayTime} />;
            })
          ) : (
            <button 
              className="w-full relative overflow-hidden glass-card rounded-xl p-6 border-dashed border-primary/40 flex flex-col items-center justify-center gap-2 group hover:bg-primary/5 transition-all"
              onClick={() => setIsModalOpen(true)}
            >
              <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Icon name="add_circle" className="text-3xl" />
              </div>
              <p className="text-primary font-bold">添加自选基金</p>
            </button>
          )}
        </div>

        {processedFunds.length > 0 && (
          <button 
            className="w-full relative overflow-hidden glass-card rounded-xl p-4 border-dashed border-white/10 flex flex-row items-center justify-center gap-2 group hover:bg-white/5 transition-all mt-4"
            onClick={() => setIsModalOpen(true)}
          >
            <Icon name="add_circle" className="text-xl text-slate-400 group-hover:text-white" />
            <p className="text-slate-400 text-sm group-hover:text-white">添加更多基金</p>
          </button>
        )}
      </main>

      <BottomNav items={navItems} />

      <AddFundModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveFund}
        existingFunds={funds}
        activeTag={activeTag}
      />

      <TagManagementModal 
        isOpen={isTagModalOpen} 
        onClose={() => setIsTagModalOpen(false)} 
        existingTags={tags}
        onSave={handleSaveTags}
      />
    </div>
  );
}