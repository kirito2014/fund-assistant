'use client';

import React, { useState, useEffect, useRef, useCallback } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";
import { BottomNav } from "@/components/BottomNav";
import AddFundModal from "@/components/AddFundModal";

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
  const [tags, setTags] = useState<string[]>(["全部", "消费", "科技", "医药"]);
  const [activeTag, setActiveTag] = useState("全部");
  const [nameSortType, setNameSortType] = useState<'none' | 'asc' | 'desc'>('none');
  const [changeSortType, setChangeSortType] = useState<'none' | 'asc' | 'desc'>('none');
  const [sortBy, setSortBy] = useState<'name' | 'change'>('change');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 默认基金列表 (保留你原有的默认值)
  const [fundList, setFundList] = useState<string[]>(["001618", "001630", "008887", "005827", "161725"]);

  // 使用 Ref 解决闭包陷阱，确保在回调中能访问最新数据
  const fundsRef = useRef<Fund[]>([]);
  const fundListRef = useRef<string[]>([]);

  // --- 持久化逻辑 ---
  useEffect(() => {
    fundsRef.current = funds;
    if (funds.length > 0) localStorage.setItem('savedFunds', JSON.stringify(funds));
  }, [funds]);

  useEffect(() => {
    fundListRef.current = fundList;
    localStorage.setItem('savedFundList', JSON.stringify(fundList));
  }, [fundList]);

  useEffect(() => {
    localStorage.setItem('savedTags', JSON.stringify(tags));
  }, [tags]);

  // --- 初始化加载 ---
  useEffect(() => {
    const savedTags = localStorage.getItem('savedTags');
    const savedFundList = localStorage.getItem('savedFundList');
    const savedFunds = localStorage.getItem('savedFunds');

    if (savedTags) setTags(JSON.parse(savedTags));
    if (savedFunds) {
      const parsed = JSON.parse(savedFunds);
      setFunds(parsed);
      fundsRef.current = parsed;
    }
    if (savedFundList) {
      const list = JSON.parse(savedFundList);
      setFundList(list);
      fundListRef.current = list;
    }
    
    // 初始化后立即刷新一次
    if (savedFundList) {
       refreshAllFunds(JSON.parse(savedFundList));
    } else {
       refreshAllFunds(fundList);
    }
  }, []);

  // --- 核心逻辑：定义全局 JSONP 回调 (参考 Reference Project) ---
  useEffect(() => {
    // 注册天天基金的回调函数
    window.jsonpgz = (gzData: any) => {
      if (!gzData || !gzData.fundcode) return;
      
      const code = gzData.fundcode;
      
      // 1. 获取到天天基金数据后，立即去获取腾讯财经数据进行比对
      fetchTencentData(code, gzData);
    };

    // 设置定时器每 60 秒刷新一次
    const interval = setInterval(() => {
      refreshAllFunds(fundListRef.current);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // --- 辅助函数：获取腾讯数据并整合 (参考 Reference Project 逻辑) ---
  const fetchTencentData = (code: string, gzData: any) => {
    const script = document.createElement("script");
    script.src = `https://qt.gtimg.cn/q=jj${code}`;
    script.onload = () => {
      // 腾讯数据格式: v_jj005827 = "代码~名称~单位净值~净值日期~..."
      const tencentVar = window[`v_jj${code}`];
      if (tencentVar) {
        const tDataArr = tencentVar.split("~");
        if (tDataArr.length > 5) {
          const tencentDate = tDataArr[3]; // 净值日期
          const tencentNav = tDataArr[1];  // 单位净值
          const tencentChange = tDataArr[5]; // 涨跌幅
          const gzDate = gzData.jzrq; // 天天基金的净值日期

          // 参考项目核心逻辑：如果腾讯的日期 >= 天天基金日期，说明盘后净值已更新，使用腾讯数据覆盖估值
          // 这样能保证收盘后显示的是准确的净值，而不是预估值
          if (tencentDate && (!gzDate || tencentDate >= gzDate)) {
             gzData.gsz = tencentNav;
             gzData.gszzl = tencentChange;
             gzData.hasReplace = true; // 标记已被替换
             gzData.gztime = `净值 ${tencentDate}`; // 更新显示时间为净值日期
          }
        }
      }
      // 更新单个基金状态
      updateFundState(gzData);
      // 清理脚本
      document.body.removeChild(script);
    };
    script.onerror = () => {
        // 如果腾讯接口失败，直接使用天天基金数据
        updateFundState(gzData);
        document.body.removeChild(script);
    };
    document.body.appendChild(script);
  };

  // --- 辅助函数：更新 React 状态 ---
  const updateFundState = (newData: any) => {
    setFunds(prevFunds => {
      // 检查是否已存在，保留原有的标签和星标状态
      const existingIndex = prevFunds.findIndex(f => f.fundcode === newData.fundcode);
      const existingTags = existingIndex > -1 ? prevFunds[existingIndex].tags : ["全部"];
      const existingStar = existingIndex > -1 ? prevFunds[existingIndex].isStarred : false;

      const newFundObj: Fund = {
        fundcode: newData.fundcode,
        name: newData.name,
        // 如果 API 返回为空，给默认值
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
    
    // 遍历创建 Script 标签请求天天基金
    codes.forEach(code => {
      const script = document.createElement("script");
      // 添加时间戳防止缓存
      script.src = `https://fundgz.1234567.com.cn/js/${code}.js?rt=${new Date().getTime()}`;
      script.onload = () => {
         // 请求成功后会执行 window.jsonpgz，逻辑在 useEffect 中
         document.body.removeChild(script);
      };
      script.onerror = () => {
         // 错误处理：可能是新发基金查不到估值，尝试仅查腾讯数据
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

  const handleSaveFund = (newFund: any, tags: string[]) => {
    const code = newFund.fundcode || newFund; // 兼容不同传参
    
    // 更新列表
    if (!fundList.includes(code)) {
      const newList = [...fundList, code];
      setFundList(newList);
      fundListRef.current = newList;
      
      // 预先添加一个占位数据，提升体验
      setFunds(prev => [...prev, {
          fundcode: code,
          name: "加载中...",
          dwjz: "--",
          gsz: "--",
          gszzl: "0.00",
          gztime: "--",
          tags: ["全部", ...tags],
          isStarred: false
      }]);

      // 立即触发一次刷新
      setTimeout(() => refreshAllFunds([code]), 100);
    }
    
    // 更新标签（如果是已有基金更新标签）
    setFunds(prev => prev.map(f => {
        if (f.fundcode === code) {
            // 合并新标签
            const mergedTags = Array.from(new Set([...f.tags, ...tags]));
            return { ...f, tags: mergedTags };
        }
        return f;
    }));

    setIsModalOpen(false);

    // 更新顶部标签栏
    const newTags = tags.filter(tag => !tags.includes(tag));
    if (newTags.length > 0) {
      setTags(prev => [...prev, ...newTags]);
    }
  };

  // --- 渲染逻辑 (保持原有样式) ---
  const processedFunds = (() => {
    let list = [...funds];
    // 过滤
    if (activeTag !== "全部") {
      list = list.filter(f => f.tags.includes(activeTag));
    }
    // 排序
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
    // 当两个排序类型都为 none 时，不应用任何排序，保持原始顺序
    // 星标置顶
    list.sort((a, b) => (b.isStarred ? 1 : 0) - (a.isStarred ? 1 : 0));
    return list;
  })();

  const navItems = [
    { label: "自选", icon: "dashboard", href: "/funds", isActive: true },
    { label: "行情", icon: "query_stats", href: "/market" },
    { label: "资产", icon: "account_balance_wallet", href: "/portfolio" },
    { label: "我的", icon: "person", href: "/profile" },
  ];

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col max-w-[430px] mx-auto overflow-x-hidden shadow-2xl bg-background-light dark:bg-background-dark font-display text-white">
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between border-b border-white/10">
        <div className="flex w-12 items-center justify-start">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors cursor-pointer">
            <Icon name="search" className="text-white" />
          </div>
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
      <div className="px-4 border-b border-white/5">
        <div className="flex items-center justify-between overflow-x-auto no-scrollbar">
          <div className="flex gap-6">
            {tags.map((tab) => (
              <a
                key={tab}
                className={`flex flex-col items-center justify-center border-b-2 pb-3 pt-4 shrink-0 transition-colors ${
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
                  {tab}
                </p>
              </a>
            ))}
          </div>
          <div className="flex items-center gap-4 shrink-0 ml-4">
            <button 
              className={`${nameSortType !== 'none' ? 'text-white' : 'text-slate-500'}`}
              onClick={() => {
                setNameSortType(prev => {
                  if (prev === 'none') {
                    setSortBy('name');
                    return 'asc';
                  }
                  if (prev === 'asc') {
                    setSortBy('name');
                    return 'desc';
                  }
                  return 'none';
                });
                setChangeSortType('none');
              }}
            >
              <Icon name={nameSortType === 'asc' ? "arrow_upward" : nameSortType === 'desc' ? "arrow_downward" : "sort_by_alpha"} className="text-sm cursor-pointer" />
            </button>
            <button 
              className={`${changeSortType !== 'none' ? 'text-white' : 'text-slate-500'}`}
              onClick={() => {
                setChangeSortType(prev => {
                  if (prev === 'none') {
                    setSortBy('change');
                    return 'asc';
                  }
                  if (prev === 'asc') {
                    setSortBy('change');
                    return 'desc';
                  }
                  return 'none';
                });
                setNameSortType('none');
              }}
            >
              <Icon name={changeSortType === 'asc' ? "arrow_upward" : changeSortType === 'desc' ? "arrow_downward" : "sort"} className="text-sm cursor-pointer" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-24 p-4 space-y-3">

        {/* Fund List Items */}
        <div className="space-y-3">
          {processedFunds.length > 0 ? (
            processedFunds.map((fund) => {
              const isUp = parseFloat(fund.gszzl) >= 0;
              // 格式化时间，如果包含日期则只显示时间，否则显示全部
              const displayTime = fund.gztime.includes(" ") ? fund.gztime.split(" ")[1] : fund.gztime;
              
              return (
                <GlassCard
                  key={fund.fundcode}
                  className="rounded-xl p-4 flex items-center justify-between hover:bg-white/[0.05] transition-all group relative overflow-hidden"
                  variant="light"
                >
                   {/* 装饰背景，根据涨跌变化颜色 */}
                   <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full blur-2xl opacity-10 ${isUp ? 'bg-gain-red' : 'bg-loss-green'}`}></div>

                  <div className="flex items-center gap-3 z-10">
                     {/* 星标按钮 */}
                    <button 
                       onClick={(e) => { e.stopPropagation(); handleToggleStar(fund.fundcode); }}
                       className="p-1 -ml-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                      <Icon 
                        name={fund.isStarred ? "star" : "star_outline"} 
                        className={`text-lg ${fund.isStarred ? "text-yellow-400 fill-current" : "text-slate-600"}`} 
                      />
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white text-sm font-bold truncate max-w-[180px]">
                            {fund.name}
                        </h4>
                        <span className="text-[#92a4c9] text-[10px] font-medium">
                            {fund.fundcode}
                        </span>
                      </div>
                      {/* 如果使用了真实净值，显示一个小标记 */}
                      {fund.hasReplace && (
                          <span className="text-[9px] px-1 bg-primary/20 text-primary rounded border border-primary/30">实</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 z-10">
                    <p className={`text-sm font-bold font-mono ${isUp ? "text-gain-red" : "text-loss-green"}`}>
                        {fund.gsz}
                    </p>
                    <p className={`text-xs font-bold font-display ${isUp ? "text-gain-red" : "text-loss-green"}`}>
                      {isUp ? "+" : ""}{fund.gszzl}%
                    </p>
                    <p className="text-[10px] text-slate-600 font-mono scale-90 origin-right">
                        {displayTime}
                    </p>
                  </div>
                </GlassCard>
              );
            })
          ) : (
            // 无数据状态
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

        {/* Add Fund Button Card - 如果有数据也显示底部添加按钮 */}
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

      {/* 添加基金模态框 */}
      <AddFundModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        existingTags={tags.filter(tag => tag !== "全部")}
        onSave={handleSaveFund}
      />
    </div>
  );
}