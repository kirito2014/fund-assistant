'use client';

import React, { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";
import { BottomNav } from "@/components/BottomNav";
import AddFundModal from "@/components/AddFundModal";

// 定义基金数据结构，参考 App.vue 的数据模型
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
  const [fundList, setFundList] = useState<string[]>(["001618", "001630", "008887", "005827", "161725"]);
  const [isModalOpen, setIsModalOpen] = useState(false); // 控制添加基金模态框的显示
  
  // 从localStorage加载数据
  useEffect(() => {
    const savedTags = localStorage.getItem('savedTags');
    const savedFundList = localStorage.getItem('savedFundList');
    
    if (savedTags) {
      setTags(JSON.parse(savedTags));
    }
    
    if (savedFundList) {
      setFundList(JSON.parse(savedFundList));
    } else {
      // 如果localStorage中没有数据，使用默认值并调用getData()
      getData();
    }
  }, []);
  
  // 保存数据到localStorage
  useEffect(() => {
    localStorage.setItem('savedFunds', JSON.stringify(funds));
  }, [funds]);
  
  useEffect(() => {
    localStorage.setItem('savedTags', JSON.stringify(tags));
  }, [tags]);
  
  useEffect(() => {
    localStorage.setItem('savedFundList', JSON.stringify(fundList));
  }, [fundList]);

  const navItems = [
    { label: "自选", icon: "dashboard", href: "/funds", isActive: true },
    { label: "行情", icon: "query_stats", href: "/market" },
    { label: "资产", icon: "account_balance_wallet", href: "/portfolio" },
    { label: "我的", icon: "person", href: "/profile" },
  ];

  // 获取基金数据，参考 App.vue 中的实现
  const getData = async () => {
    try {
      setLoading(true);
      let fundlist = fundList.join(",");
      // 生成随机userId，参考App.vue中的实现
      const userId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        var r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
      
      let url = 
        `https://fundmobapi.eastmoney.com/FundMNewApi/FundMNFInfo?pageIndex=1&pageSize=200&plat=Android&appType=ttjj&product=EFund&Version=1&deviceid=${userId}&Fcodes=${fundlist}`;
      
      const response = await fetch(url);
      const res = await response.json();
      
      if (res.Datas) {
            let dataList: Fund[] = [];
            
            res.Datas.forEach((val: any) => {
              // 查找现有基金数据，保留标签信息
              const existingFund = funds.find(f => f.fundcode === val.FCODE);
              const fundTags = existingFund ? existingFund.tags : ["全部"];
              
              let data: Fund = {
                fundcode: val.FCODE,
                name: val.SHORTNAME,
                dwjz: isNaN(val.NAV) ? "--" : val.NAV.toString(),
                gsz: isNaN(val.GSZ) ? "--" : val.GSZ.toString(),
                gszzl: isNaN(val.GSZZL) ? "0" : val.GSZZL.toString(),
                gztime: val.GZTIME,
                tags: fundTags, // 保留现有标签或使用默认标签
              };
              
              // 处理单位净值替换估算净值的情况
              if (val.PDATE != "--" && val.PDATE == val.GZTIME.substr(0, 10)) {
                data.gsz = val.NAV.toString();
                data.gszzl = isNaN(val.NAVCHGRT) ? "0" : val.NAVCHGRT.toString();
                data.hasReplace = true;
              }
              
              dataList.push(data);
            });
            
            setFunds(dataList);
          }
    } catch (error) {
      console.error('获取基金数据失败:', error);
      // 使用模拟数据作为备份
      useMockData();
    } finally {
      setLoading(false);
    }
  };
  
  // 使用模拟数据
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
        fundcode: "001630",
        name: "天弘中证计算机主题",
        dwjz: "0.8765",
        gsz: "0.9120",
        gszzl: "4.05",
        gztime: "2026-02-05 15:00",
        tags: ["全部", "科技"],
      },
      {
        fundcode: "008887",
        name: "华夏半导体芯片ETF",
        dwjz: "1.3420",
        gsz: "1.3930",
        gszzl: "3.80",
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
      {
        fundcode: "161725",
        name: "招商中证白酒指数A",
        dwjz: "1.1240",
        gsz: "1.1140",
        gszzl: "-0.89",
        gztime: "2026-02-05 15:00",
        tags: ["全部", "消费"],
      },
    ];
    setFunds(mockData);
  };

  // 初始加载数据
  useEffect(() => {
    getData();
  }, [fundList]);

  // 1. 基金去重与过滤逻辑
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
          {loading ? (
            // 加载状态
            Array.from({ length: 5 }).map((_, index) => (
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
            // 无数据状态 - 使用添加基金按钮卡片进行占位
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

        {/* Add Fund Button Card - 只在有数据时显示 */}
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
          // 更新fundList，添加新基金代码
          const updatedFundList = [...fundList, newFund.fundcode];
          setFundList(updatedFundList);
          
          // 更新funds数组，添加带有正确标签的新基金数据
          const updatedFunds = [...funds, {
            ...newFund,
            tags: ["全部", ...fundTags]
          }];
          setFunds(updatedFunds);
          
          // 关闭模态框
          setIsModalOpen(false);
          
          // 更新标签列表，添加新创建的标签
          const newTags = fundTags.filter(tag => !tags.includes(tag));
          if (newTags.length > 0) {
            setTags(prev => [...prev, ...newTags]);
          }
        }}
      />
    </div>
  );
}
