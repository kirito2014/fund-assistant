'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";
import { BottomNav } from "@/components/BottomNav";

// 市场指数类型定义
interface MarketIndex {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  valuation: number;
  valuationLevel: string;
  valuationColor: string;
}

export default function Home() {
  const [marketStatus, setMarketStatus] = useState({
    status: '加载中',
    statusColor: 'orange'
  });
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [clientTime, setClientTime] = useState<string>('');

  // 客户端渲染时设置时间
  useEffect(() => {
    setClientTime(lastUpdated.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, [lastUpdated]);

  // 获取市场状态
  const fetchMarketStatus = async () => {
    try {
      const response = await fetch('/api/market-status');
      if (response.ok) {
        const data = await response.json();
        setMarketStatus({
          status: data.status,
          statusColor: data.statusColor
        });
      }
    } catch (error) {
      console.error('获取市场状态失败:', error);
    }
  };

  // 获取市场指数估值
  const fetchMarketValuation = async () => {
    try {
      setLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch('/api/market-valuation', {
        signal: controller.signal,
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setMarketIndices(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('获取市场指数估值失败:', error);
      // 使用模拟数据作为备份
      useMockData();
    } finally {
      setLoading(false);
    }
  };
  
  // 使用模拟数据
  const useMockData = () => {
    const mockData = [
      {
        code: 'sh000001',
        name: '上证指数',
        price: 3125.25,
        change: 15.62,
        changePercent: 0.50,
        valuation: 35,
        valuationLevel: '低估',
        valuationColor: 'loss-green'
      },
      {
        code: 'sh000300',
        name: '沪深300',
        price: 3852.12,
        change: 20.05,
        changePercent: 0.52,
        valuation: 25,
        valuationLevel: '低估',
        valuationColor: 'loss-green'
      },
      {
        code: 'sz399001',
        name: '深证成指',
        price: 10256.78,
        change: -52.34,
        changePercent: -0.51,
        valuation: 45,
        valuationLevel: '正常',
        valuationColor: 'yellow-400'
      },
      {
        code: 'sz399006',
        name: '创业板指',
        price: 1782.30,
        change: 21.85,
        changePercent: 1.24,
        valuation: 65,
        valuationLevel: '高估',
        valuationColor: 'gain-red'
      }
    ];
    setMarketIndices(mockData);
    setLastUpdated(new Date());
  };

  // 刷新数据
  const handleRefresh = async () => {
    await Promise.all([
      fetchMarketStatus(),
      fetchMarketValuation()
    ]);
  };

  useEffect(() => {
    // 初始加载
    fetchMarketStatus();
    fetchMarketValuation();
  }, []);

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col max-w-[430px] mx-auto overflow-x-hidden shadow-2xl bg-background-light dark:bg-background-dark font-display text-white">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between border-b border-white/10">
        <div className="flex w-12 items-center justify-start">
        </div>
        <div className="flex flex-col items-center flex-1">
          <h2 className="text-white text-lg font-bold leading-tight tracking-tight">
            基金估值助手
          </h2>
          <p className="text-[10px] text-slate-400">
            最后更新 {clientTime}
          </p>
        </div>
        <div className="flex w-12 items-center justify-end">
          <button 
            className="flex items-center justify-center text-white hover:opacity-80 transition-opacity"
            onClick={handleRefresh}
            disabled={loading}
          >
            <Icon 
              name="refresh" 
              className={`${loading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      <main className="flex-1 pb-24">
        {/* Index Valuation Grid Section */}
        <div className="px-4 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-lg font-bold tracking-tight">
              市场指数估值
            </h3>
            <Link href="/market" className="text-primary text-xs font-medium hover:underline">查看全部</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {loading ? (
              // 加载状态
              Array.from({ length: 4 }).map((_, index) => (
                <GlassCard key={index} className="p-4 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm font-medium">加载中...</span>
                    <span className="bg-slate-700/20 text-slate-400 text-[10px] px-1.5 py-0.5 rounded">
                      加载中
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white text-xl font-bold">--</span>
                    <span className="text-slate-400 text-xs font-medium">--</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                    <div className="bg-slate-600 h-full w-0 animate-pulse"></div>
                  </div>
                </GlassCard>
              ))
            ) : marketIndices.length > 0 ? (
              // 数据加载完成
              marketIndices.slice(0, 4).map((index) => (
                <GlassCard key={index.code} className="p-4 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70 text-sm font-medium">{index.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold bg-${index.valuationColor === 'loss-green' ? 'green' : index.valuationColor === 'gain-red' ? 'red' : 'yellow'}-500/20 text-${index.valuationColor}`}>
                      {index.valuationLevel}
                    </span>
                  </div>
                  <span className="text-white text-2xl font-bold">{index.price.toLocaleString()}</span>
                  <span className={`text-sm font-semibold text-${index.changePercent >= 0 ? 'gain-red' : 'loss-green'}`}>
                    {index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}% ({index.change >= 0 ? '+' : ''}{index.change.toFixed(2)}) 
                    <Icon name={index.changePercent >= 0 ? 'trending_up' : 'trending_down'} className="text-xs align-middle" />
                  </span>
                </GlassCard>
              ))
            ) : (
              // 无数据状态
              Array.from({ length: 4 }).map((_, index) => (
                <GlassCard key={index} className="p-4 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm font-medium">暂无数据</span>
                    <span className="bg-slate-700/20 text-slate-400 text-[10px] px-1.5 py-0.5 rounded">
                      --
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white text-xl font-bold">--</span>
                    <span className="text-slate-400 text-xs font-medium">--</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                    <div className="bg-slate-600 h-full w-0"></div>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </div>

        {/* Mood & Profit Large Card */}
        <div className="p-4 pt-8">
          <GlassCard className="p-6 rounded-2xl relative overflow-hidden flex items-center justify-between shadow-2xl">
            {/* Decorative Glow */}
            <div className="absolute -right-10 -top-10 size-40 bg-primary/20 blur-[60px] rounded-full"></div>
            <div className="flex flex-col gap-1 z-10">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                  今日收益情绪
                </span>
                <span className="text-white font-bold px-2 py-0.5 rounded-full bg-primary/30 text-[10px]">
                  大喜
                </span>
                <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] border ${
                  marketStatus.statusColor === 'green' 
                    ? 'text-green-400 bg-green-400/20 border-green-400/40' 
                    : marketStatus.statusColor === 'red'
                    ? 'text-red-400 bg-red-400/20 border-red-400/40'
                    : 'text-orange-400 bg-orange-400/20 border-orange-400/40'
                }`}>
                  {marketStatus.status}
                </span>
              </div>
              <p className="text-slate-400 text-sm">今日预计收益</p>
              <div className="flex items-baseline gap-2">
                <h4 className="text-gain-red text-4xl font-bold">1,280.50</h4>
                <span className="text-gain-red font-bold text-lg">+1.82%</span>
              </div>
              <Link href="/portfolio" className="mt-4 flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold w-fit shadow-lg shadow-primary/20">
                <span>收益详情</span>
                <Icon name="chevron_right" className="text-sm" />
              </Link>
            </div>
            <div className="z-10 bg-white/5 p-3 rounded-3xl backdrop-blur-md border border-white/10 max-w-[100px] max-h-[100px] flex items-center justify-center">
              <span aria-label="Happy Emoji" className="text-5xl" role="img">
                😊
              </span>
            </div>
          </GlassCard>
        </div>

        {/* Tabs Section */}
        <div className="mt-6">
          <div className="flex border-b border-slate-800 px-4 gap-8">
            <a
              className="flex flex-col items-center justify-center border-b-[3px] border-primary text-white pb-3 pt-4"
              href="#"
            >
              <p className="text-white text-sm font-bold">今日涨幅榜</p>
            </a>
            <a
              className="flex flex-col items-center justify-center border-b-[3px] border-transparent text-slate-500 pb-3 pt-4"
              href="#"
            >
              <p className="text-sm font-bold">今日跌幅榜</p>
            </a>
          </div>
        </div>

        {/* Movers List */}
        <div className="px-4 mt-4 space-y-3">
          {
            [
              {
                rank: "01",
                name: "天弘中证计算机主题",
                code: "001630",
                val: "+4.25%",
              },
              {
                rank: "02",
                name: "华夏半导体芯片ETF",
                code: "008887",
                val: "+3.82%",
              },
              {
                rank: "03",
                name: "易方达蓝筹精选",
                code: "005827",
                val: "+2.15%",
              },
            ].map((item, idx) => (
              <GlassCard key={idx} className="flex items-center justify-between p-4 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                    <span className="text-primary font-bold text-xs">{item.rank}</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">{item.name}</p>
                    <p className="text-slate-500 text-[10px]">
                      {item.code} · 场外估值
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gain-red font-bold text-base">{item.val}</p>
                  <p className="text-slate-500 text-[10px]">实时估算</p>
                </div>
              </GlassCard>
            ))
          }
          
           {/* Placeholder item 4 */}
           <GlassCard className="flex items-center justify-between p-4 rounded-xl opacity-80">
              <div className="flex items-center gap-4">
                <div className="size-10 bg-slate-800 rounded-lg flex items-center justify-center">
                  <span className="text-slate-400 font-bold text-xs">04</span>
                </div>
                <div>
                  <p className="text-white text-sm font-bold">招商中证白酒</p>
                  <p className="text-slate-500 text-[10px]">
                    161725 · 场外估值
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gain-red font-bold text-base">+1.98%</p>
              </div>
            </GlassCard>

          <button className="w-full py-3 text-slate-400 text-sm font-medium">
            查看完整 Top 10 榜单
          </button>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
