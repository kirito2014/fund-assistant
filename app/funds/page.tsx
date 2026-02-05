'use client';

import React, { useState, useEffect, useRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";
import { BottomNav } from "@/components/BottomNav";
import AddFundModal from "@/components/AddFundModal";

// 定义基金数据结构
interface Fund {
  fundcode: string;
  name: string;
  dwjz: string;    // 单位净值
  gsz: string;     // 估算净值
  gszzl: string;   // 估算涨跌幅
  gztime: string;
  isStarred?: boolean; // 特别关注
  tags: string[];      // 标签分组
  hasReplace?: boolean; // 是否使用单位净值替换估算净值
}

export default function FundsPage() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [tags, setTags] = useState<string[]>(["全部", "消费", "科技", "医药"]);
  const [activeTag, setActiveTag] = useState("全部");
  const [loading, setLoading] = useState(true);
  // 默认基金列表
  const [fundList, setFundList] = useState<string[]>(["001618", "001630", "008887", "005827", "161725"]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 使用 Ref 追踪最新的 funds 状态，用于在 getData 中正确保留标签
  const fundsRef = useRef<Fund[]>([]);

  // 监听 funds 变化，同步更新 ref
  useEffect(() => {
    fundsRef.current = funds;
    // 数据变化时保存到 localStorage
    if (funds.length > 0) {
      localStorage.setItem('savedFunds', JSON.stringify(funds));
    }
  }, [funds]);
  
  // 初始化：从 localStorage 加载所有数据
  useEffect(() => {
    const savedTags = localStorage.getItem('savedTags');
    const savedFundList = localStorage.getItem('savedFundList');
    const savedFunds = localStorage.getItem('savedFunds');
    
    if (savedTags) {
      setTags(JSON.parse(savedTags));
    }
    
    // 优先加载保存的完整基金数据（包含标签）
    if (savedFunds) {
      const parsedFunds = JSON.parse(savedFunds);
      setFunds(parsedFunds);
      fundsRef.current = parsedFunds; 
    }

    // 加载保存的基金代码列表
    if (savedFundList) {
      setFundList(JSON.parse(savedFundList));
    }
    
    // 触发一次数据更新
    getData();
  }, []); // 仅组件挂载时执行一次
  
  // 监听状态变化并持久化
  useEffect(() => {
    localStorage.setItem('savedTags', JSON.stringify(tags));
  }, [tags]);
  
  useEffect(() => {
    localStorage.setItem('savedFundList', JSON.stringify(fundList));
    // 列表变化时，重新获取数据
    if (fundList.length > 0) {
      getData();
    }
  }, [fundList]);

  const navItems = [
    { label: "自选", icon: "dashboard", href: "/funds", isActive: true },
    { label: "行情", icon: "query_stats", href: "/market" },
    { label: "资产", icon: "account_balance_wallet", href: "/portfolio" },
    { label: "我的", icon: "person", href: "/profile" },
  ];

  // 获取基金数据
  // 获取基金数据
  const getData = async () => {
    if (fundList.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const codes = fundList.join(",");
      // 保持 deviceId 逻辑不变...
      const userId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        var r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
      
      const apiUrl = `/api/fund?deviceid=${userId}&Fcodes=${codes}`;
      
      const response = await fetch(apiUrl);
      const res = await response.json();
      
      // 【修改点】增加对错误信息的判断
      if (res && res.Datas) {
        const dataList: Fund[] = res.Datas.map((val: any) => {
           // ... 保持原有的 map 逻辑 ...
           const existingFund = fundsRef.current.find(f => f.fundcode === val.FCODE);
           const fundTags = existingFund && existingFund.tags.length > 0 ? existingFund.tags : ["全部"];
           const isStarred = existingFund ? existingFund.isStarred : false;

           let data: Fund = {
            fundcode: val.FCODE,
            name: val.SHORTNAME,
            dwjz: val.NAV == null || isNaN(val.NAV) ? "--" : val.NAV.toString(),
            gsz: val.GSZ == null || isNaN(val.GSZ) ? "--" : val.GSZ.toString(),
            gszzl: val.GSZZL == null || isNaN(val.GSZZL) ? "0.00" : val.GSZZL.toString(),
            gztime: val.GZTIME || "--",
            tags: fundTags,
            isStarred: isStarred
          };
          
          if (val.PDATE !== "--" && val.GZTIME && val.PDATE === val.GZTIME.substr(0, 10)) {
            data.gsz = val.NAV ? val.NAV.toString() : data.gsz;
            data.gszzl = val.NAVCHGRT ? val.NAVCHGRT.toString() : "0.00";
            data.hasReplace = true;
          }
          return data;
        });
        
        setFunds(dataList);
      } else {
        // 如果 API 返回了错误信息（如“网络繁忙”），打印日志但不清空列表
        console.warn("API未返回有效数据:", res);
        if (res.Message) {
            console.error("API Error Message:", res.Message);
        }
      }
    } catch (error) {
      console.error('获取基金数据失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 使用模拟数据 (仅在 API 失败且无本地数据时调用)
  const useMockData = () => {
    const mockData: Fund[] = [
      {
        fundcode: "001618",
        name: "嘉实新兴产业股票",
        dwjz: "1.2540",
        gsz: "1.2680",
        gszzl: "1.12",
        gztime: "2026-02-05 15:00",
        tags: ["全部", "科技"],
      },
      {
        fundcode: "005827",
        name: "易方达蓝筹精选混合",
        dwjz: "2.4580",
        gsz: "2.4890",
        gszzl: "1.26",
        gztime: "2026-02-05 15:00",
        tags: ["全部", "消费"],
      },
    ];
    // 合并现有标签逻辑
    const mergedMock = mockData.map(mock => {
        const exist = fundsRef.current.find(f => f.fundcode === mock.fundcode);
        return exist ? { ...mock, tags: exist.tags, isStarred: exist.isStarred } : mock;
    });
    setFunds(mergedMock);
  };

  // 1. 基金过滤逻辑
  const filteredFunds = funds.filter(f => f.tags.includes(activeTag) || activeTag === "全部");

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
        <div className="flex gap-6 overflow-x-auto no-scrollbar">
          {tags.map((tab, i) => (
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
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-24 p-4 space-y-3">
        {/* Section Header */}
        <div className="flex items-center justify-between px-1 py-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            基金列表 ({filteredFunds.length})
          </span>
          <Icon name="sort" className="text-slate-500 text-sm cursor-pointer" />
        </div>

        {/* Fund List Items */}
        <div className="space-y-3">
          {loading && funds.length === 0 ? (
            // 加载状态 (仅当初次加载且无缓存时显示)
            Array.from({ length: 3 }).map((_, index) => (
              <GlassCard
                key={index}
                className="rounded-xl p-4 flex items-center justify-between"
                variant="light"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center rounded-lg shrink-0 size-12 bg-slate-700/50">
                    <Icon name="trending_up" className="text-slate-400" />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-slate-400 text-base font-semibold">加载中...</p>
                    <p className="text-slate-500 text-sm font-medium font-mono">----</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-slate-400 text-sm font-bold">--.--</p>
                  <div className="px-3 py-1 rounded-lg text-sm font-bold min-w-[70px] text-center bg-slate-700/50 text-slate-400">
                    --.--%
                  </div>
                </div>
              </GlassCard>
            ))
          ) : filteredFunds.length > 0 ? (
            // 数据加载完成
            filteredFunds.map((fund) => {
              const isUp = parseFloat(fund.gszzl) >= 0;
              return (
                <GlassCard
                  key={fund.fundcode}
                  className="rounded-xl p-4 flex items-center justify-between hover:bg-white/[0.05] transition-all"
                  variant="light"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center rounded-lg shrink-0 size-12 bg-slate-800/50">
                      <Icon name={isUp ? "trending_up" : "trending_down"} className={isUp ? "text-gain-red" : "text-loss-green"} />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-white text-base font-semibold line-clamp-1">
                        {fund.name}
                      </p>
                      <p className="text-slate-400 text-sm font-medium font-mono tracking-tight">
                        {fund.fundcode}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-white text-sm font-bold">{fund.gsz}</p>
                    <div className={`px-3 py-1 rounded-lg text-sm font-bold min-w-[70px] text-center ${
                      isUp
                        ? "bg-gain-red/20 text-gain-red"
                        : "bg-loss-green/20 text-loss-green"
                    }`}>
                      {isUp ? "+" : ""}{fund.gszzl}%
                    </div>
                  </div>
                </GlassCard>
              );
            })
          ) : (
            // 无数据状态
            <div className="space-y-3">
              <button 
                className="w-full relative overflow-hidden glass-card rounded-xl p-6 border-dashed border-primary/40 flex flex-col items-center justify-center gap-2 group hover:bg-primary/5 transition-all"
                onClick={() => setIsModalOpen(true)}
              >
                <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Icon name="add_circle" className="text-3xl" />
                </div>
                <p className="text-primary font-bold">添加自选基金</p>
                <p className="text-slate-500 text-xs">实时追踪更多基金估值</p>
              </button>
            </div>
          )}
        </div>

        {/* Add Fund Button Card - 底部补充按钮 */}
        {filteredFunds.length > 0 && (
          <button 
            className="w-full relative overflow-hidden glass-card rounded-xl p-6 border-dashed border-primary/40 flex flex-col items-center justify-center gap-2 group hover:bg-primary/5 transition-all"
            onClick={() => setIsModalOpen(true)}
          >
            <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Icon name="add_circle" className="text-3xl" />
            </div>
            <p className="text-primary font-bold">添加自选基金</p>
            <p className="text-slate-500 text-xs">实时追踪更多基金估值</p>
          </button>
        )}
      </main>

      <BottomNav items={navItems} />

      {/* 添加基金模态框 */}
      <AddFundModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        existingTags={tags.filter(tag => tag !== "全部")}
        onSave={(newFund: Fund, fundTags: string[]) => {
          // 检查基金代码是否已经存在，避免重复添加
          if (!fundList.includes(newFund.fundcode)) {
            const updatedFundList = [...fundList, newFund.fundcode];
            setFundList(updatedFundList);
          }
          
          // 检查基金是否已经存在，避免重复添加
          if (!funds.some(f => f.fundcode === newFund.fundcode)) {
            const updatedFunds = [...funds, {
              ...newFund,
              tags: ["全部", ...fundTags]
            }];
            setFunds(updatedFunds);
            fundsRef.current = updatedFunds; // 立即更新 Ref
          }
          
          setIsModalOpen(false);
          
          const newTags = fundTags.filter(tag => !tags.includes(tag));
          if (newTags.length > 0) {
            setTags(prev => [...prev, ...newTags]);
          }
        }}
      />
    </div>
  );
}