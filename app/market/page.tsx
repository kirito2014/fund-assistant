'use client';

import React, { useState, useEffect, useRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";
import { BottomNav } from "@/components/BottomNav";
import * as echarts from "echarts";

// 市场指数类型定义
interface MarketIndex {
  code: string;
  name: string;
  val: string;
  change: string;
  isUp: boolean;
  status: string;
  statusColor: string;
}

// 扩展市场指数类型，用于API数据
interface ApiMarketIndex {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  valuation: number;
  valuationLevel: string;
  valuationColor: string;
}

// 指数代码映射（使用东方财富的指数代码格式）
const INDEX_CODES = {
  '1.000001': '上证指数',
  '1.000300': '沪深300',
  '0.399001': '深证成指',
  '0.399006': '创业板指',
  '0.399005': '中小板指',
  '1.000688': '科创50'
};

// 国际市场指数代码映射（使用东方财富的国际指数代码）
const INTERNATIONAL_INDEX_CODES = {
  '100.NDX': '纳斯达克',
  '100.DJIA': '道琼斯',
  '100.SPX': '标普500',
  '100.HSI': '恒生指数'
};

// 缓存键
const CACHE_KEY = 'marketIndicesData';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5分钟缓存

export default function MarketPage() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([]);
  const [coreIndices, setCoreIndices] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [clientTime, setClientTime] = useState<string>('');
  const [upCount, setUpCount] = useState(2840);
  const [downCount, setDownCount] = useState(1560);
  const [flatCount, setFlatCount] = useState(320);
  const [isMounted, setIsMounted] = useState(true);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      setIsMounted(false);
    };
  }, []);
  
  // 图表引用
  const volumeChartRef = useRef<HTMLDivElement>(null);
  const volumeChartInstance = useRef<echarts.ECharts | null>(null);
  
  // 两市合计成交额数据（模拟）
  const [volumeData, setVolumeData] = useState<number[]>([
    120, 150, 180, 160, 200, 220, 250, 230, 260, 280, 300, 320, 340, 360, 380, 400
  ]);
  
  // 时间轴标记
  const timeLabels = ['9:30', '10:30', '11:30/13:00', '14:00', '15:00'];

  // 客户端渲染时设置时间
  useEffect(() => {
    setClientTime(lastUpdated.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, [lastUpdated]);
  
  const navItems = [
    { label: "行情", icon: "dashboard", href: "/market", isActive: true },
    { label: "估值", icon: "analytics", href: "/" },
    { label: "资产", icon: "account_balance_wallet", href: "/portfolio" },
    { label: "我的", icon: "person", href: "/profile" },
  ];

  // 获取模拟估值数据
  function getMockValuation(code: string): number {
    const valuations: { [key: string]: number } = {
      '1.000001': 35,
      '1.000300': 25,
      '0.399001': 45,
      '0.399006': 65,
      '0.399005': 50,
      '1.000688': 70,
      '100.NDX': 55,
      '100.DJIA': 75,
      '100.SPX': 60,
      '100.HSI': 25
    };
    return valuations[code] || 50;
  }

  // 获取估值水平
  function getValuationLevel(valuation: number): { level: string; color: string } {
    if (valuation < 20) {
      return { level: '极低估', color: 'loss-green' };
    } else if (valuation < 40) {
      return { level: '低估', color: 'loss-green' };
    } else if (valuation < 60) {
      return { level: '正常', color: 'yellow-400' };
    } else if (valuation < 80) {
      return { level: '高估', color: 'gain-red' };
    } else {
      return { level: '极高估', color: 'gain-red' };
    }
  }

  // 从缓存获取数据
  const getCachedData = (): MarketIndex[] | null => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return data;
        }
      }
    } catch (error) {
      console.error('读取缓存失败:', error);
    }
    return null;
  };

  // 保存数据到缓存
  const saveToCache = (data: MarketIndex[]) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('保存缓存失败:', error);
    }
  };
  
  // 获取市场指数数据
  const fetchMarketData = async () => {
    try {
      // 先尝试从缓存获取数据
      const cachedData = getCachedData();
      if (cachedData && isMounted) {
        setMarketIndices(cachedData);
        setCoreIndices(cachedData.slice(0, 4));
        setLoading(false);
        setLastUpdated(new Date());
        return;
      }

      if (isMounted) {
        setLoading(true);
      }
      
      // 合并所有指数代码
      const allIndexCodes = {
        ...INDEX_CODES,
        ...INTERNATIONAL_INDEX_CODES
      };

      // 构建指数代码字符串
      const secids = Object.keys(allIndexCodes).join(',');

      // 东方财富API URL - 获取基本市场数据
      const url = `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f4,f12,f13,f14&secids=${secids}&_=${Date.now()}`;

      // 获取数据
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }

      const data: any = await response.json();
      
      // 处理数据
      const indices: MarketIndex[] = [];
      
      // 处理所有市场数据
      if (data.data && data.data.diff) {
        const allIndices = data.data.diff.map((item: { f12: string; f13: number; f14: string; f2: number; f4: number; f3: number }) => {
          // 构建完整的指数代码
          const code = item.f12;
          const marketCode = item.f13;
          const fullCode = `${marketCode}.${code}`;
          
          // 获取指数名称
          const name = allIndexCodes[fullCode as keyof typeof allIndexCodes] || item.f14;
          const price = item.f2;
          const change = item.f4;
          const changePercent = item.f3;
          
          // 获取估值数据
          const valuation = getMockValuation(fullCode);
          const { level, color } = getValuationLevel(valuation);

          // 转换为前端使用的代码格式
          let frontendCode = fullCode;
          if (fullCode.startsWith('1.')) {
            frontendCode = `sh${fullCode.slice(2)}`;
          } else if (fullCode.startsWith('0.')) {
            frontendCode = `sz${fullCode.slice(2)}`;
          } else if (fullCode.startsWith('100.')) {
            // 国际指数映射
            const codeMap: { [key: string]: string } = {
              '100.NDX': 'nasdaq',
              '100.DJIA': 'dowjones',
              '100.SPX': 'sp500',
              '100.HSI': 'hangseng'
            };
            frontendCode = codeMap[fullCode] || fullCode;
          }

          return {
            code: frontendCode,
            name,
            val: price.toLocaleString(),
            change: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
            isUp: changePercent >= 0,
            status: level,
            statusColor: `text-${color} bg-${color === 'loss-green' ? 'green' : color === 'gain-red' ? 'red' : 'yellow'}-500/20`
          };
        });
        
        indices.push(...allIndices);
      }

      // 保存到缓存
      saveToCache(indices);
      
      // 设置数据
      if (isMounted) {
        setMarketIndices(indices);
        setCoreIndices(indices.slice(0, 4)); // 优先展示核心指数
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('获取市场数据失败:', error);
      // 错误时使用模拟数据
      if (isMounted) {
        useMockData();
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };
  
  // 使用模拟数据
  const useMockData = () => {
    const mockData: MarketIndex[] = [
      {
        code: "sh000001",
        name: "上证指数",
        val: "3050.12",
        change: "+0.45%",
        isUp: true,
        status: "高估",
        statusColor: "text-gain-red bg-gain-red/20",
      },
      {
        code: "sz399001",
        name: "深证成指",
        val: "10020.45",
        change: "-0.12%",
        isUp: false,
        status: "适中",
        statusColor: "text-primary bg-primary/20",
      },
      {
        code: "sz399006",
        name: "创业板指",
        val: "1850.32",
        change: "+1.20%",
        isUp: true,
        status: "极低",
        statusColor: "text-loss-green bg-loss-green/20",
      },
      {
        code: "sh000300",
        name: "沪深300",
        val: "3540.10",
        change: "+0.30%",
        isUp: true,
        status: "适中",
        statusColor: "text-primary bg-primary/20",
      },
      {
        code: "nasdaq",
        name: "纳斯达克",
        val: "14823.45",
        change: "+0.85%",
        isUp: true,
        status: "适中",
        statusColor: "text-primary bg-primary/20",
      },
      {
        code: "dowjones",
        name: "道琼斯",
        val: "37245.10",
        change: "+0.32%",
        isUp: true,
        status: "高估",
        statusColor: "text-gain-red bg-gain-red/20",
      },
      {
        code: "sp500",
        name: "标普500",
        val: "4856.78",
        change: "+0.58%",
        isUp: true,
        status: "适中",
        statusColor: "text-primary bg-primary/20",
      },
      {
        code: "hangseng",
        name: "恒生指数",
        val: "16825.30",
        change: "-0.65%",
        isUp: false,
        status: "极低",
        statusColor: "text-loss-green bg-loss-green/20",
      },
    ];
    if (isMounted) {
      setMarketIndices(mockData);
      setCoreIndices(mockData.slice(0, 4));
      setLastUpdated(new Date());
    }
  };
  
  // 刷新数据
  const handleRefresh = async () => {
    if (!isMounted) return;
    
    // 清除缓存，强制刷新
    localStorage.removeItem(CACHE_KEY);
    await fetchMarketData();
  };
  
  useEffect(() => {
    // 初始加载数据
    fetchMarketData();
  }, []);

  // 异步加载图表数据
  useEffect(() => {
    // 延迟加载图表数据，优先展示指数数据
    const loadChartData = async () => {
      if (isMounted) {
        setChartLoading(true);
      }
      try {
        // 模拟图表数据加载延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        // 这里可以添加真实的图表数据获取逻辑
      } catch (error) {
        console.error('加载图表数据失败:', error);
      } finally {
        if (isMounted) {
          setChartLoading(false);
        }
      }
    };

    // 指数数据加载完成后再加载图表数据
    if (!loading && isMounted) {
      loadChartData();
    }
  }, [loading, isMounted]);
  
  // 初始化和更新成交量图表
  useEffect(() => {
    if (volumeChartRef.current && isMounted) {
      // 初始化图表
      if (!volumeChartInstance.current) {
        volumeChartInstance.current = echarts.init(volumeChartRef.current);
      }
      
      // 图表配置
      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: function(params: any) {
            return `${params[0].name}<br/>成交额: ${params[0].value} 亿元`;
          },
          backgroundColor: 'rgba(10, 10, 10, 0.8)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          textStyle: {
            color: '#fff'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: timeLabels,
          axisLine: {
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.2)'
            }
          },
          axisLabel: {
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: 10
          }
        },
        yAxis: {
          type: 'value',
          name: '亿元',
          nameTextStyle: {
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: 10
          },
          axisLine: {
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.2)'
            }
          },
          axisLabel: {
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: 10
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        },
        series: [
          {
            name: '成交额',
            type: 'line',
            smooth: true,
            data: volumeData,
            lineStyle: {
              color: '#3b82f6',
              width: 2
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: 'rgba(59, 130, 246, 0.3)'
                },
                {
                  offset: 1,
                  color: 'rgba(59, 130, 246, 0.05)'
                }
              ])
            },
            symbol: 'circle',
            symbolSize: 4,
            itemStyle: {
              color: '#3b82f6'
            }
          }
        ]
      };
      
      // 设置图表选项
      volumeChartInstance.current.setOption(option);
      
      // 响应式处理
      const handleResize = () => {
        if (volumeChartInstance.current && isMounted) {
          volumeChartInstance.current.resize();
        }
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        if (volumeChartInstance.current) {
          volumeChartInstance.current.dispose();
          volumeChartInstance.current = null;
        }
      };
    }
  }, [volumeData, timeLabels, isMounted]);
  
  // 根据展开状态过滤显示的指数
  const displayIndices = isExpanded ? marketIndices : coreIndices;

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col max-w-[430px] mx-auto overflow-x-hidden shadow-2xl bg-background-light dark:bg-background-dark font-display text-white">
      {/* TopAppBar */}
      <header className="sticky top-0 z-50 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between border-b border-white/10">
        <div className="flex w-12 items-center justify-start">
        </div>
        <div className="flex flex-col items-center flex-1">
          <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">
            大盘行情分布
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
      </header>

      <main className="flex-1 pb-24">
        {/* Market Indices Grid */}
        <section className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {loading ? (
              // 加载状态
              Array.from({ length: 4 }).map((_, index) => (
                <GlassCard key={index} className="p-4 rounded-xl flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <p className="text-white/70 text-sm font-medium">加载中...</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-bold bg-slate-700/20 text-slate-400">
                      加载中
                    </span>
                  </div>
                  <p className="text-white text-2xl font-bold">--</p>
                  <p className="text-sm font-semibold text-slate-400">
                    -- <Icon name="trending_up" className="text-xs align-middle" />
                  </p>
                </GlassCard>
              ))
            ) : displayIndices.length > 0 ? (
              // 数据加载完成
              displayIndices.map((item) => (
                <GlassCard key={item.code} className="p-4 rounded-xl flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <p className="text-white/70 text-sm font-medium">{item.name}</p>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${item.statusColor}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-white text-2xl font-bold">{item.val}</p>
                  <p
                    className={`text-sm font-semibold ${
                      item.isUp ? "text-gain-red" : "text-loss-green"
                    }`}
                  >
                    {item.change}{" "}
                    <Icon
                      name={item.isUp ? "trending_up" : "trending_down"}
                      className="text-xs align-middle"
                    />
                  </p>
                </GlassCard>
              ))
            ) : (
              // 无数据状态
              Array.from({ length: 4 }).map((_, index) => (
                <GlassCard key={index} className="p-4 rounded-xl flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <p className="text-white/70 text-sm font-medium">暂无数据</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-bold bg-slate-700/20 text-slate-400">
                      --
                    </span>
                  </div>
                  <p className="text-white text-2xl font-bold">--</p>
                  <p className="text-sm font-semibold text-slate-400">
                    -- <Icon name="trending_up" className="text-xs align-middle" />
                  </p>
                </GlassCard>
              ))
            )}
          </div>
          
          {/* Expand/Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-2 py-3 mt-2 text-sm font-medium text-primary"
          >
            <span>{isExpanded ? "收起" : "展开"}更多市场</span>
            <Icon name={isExpanded ? "expand_less" : "expand_more"} className="text-xs" />
          </button>
        </section>

        {/* Market Distribution Section */}
        <section className="mt-4 px-4">
          <GlassCard className="p-5 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white text-lg font-bold">大盘涨跌分布</h3>
              <span className="text-white/40 text-xs">更新于 {clientTime}</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end mb-4">
                <div className="flex flex-col">
                  <span className="text-gain-red text-2xl font-bold tracking-tight">
                    {upCount.toLocaleString()}
                  </span>
                  <span className="text-white/50 text-xs">上涨家数</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-primary text-2xl font-bold tracking-tight">
                    {flatCount.toLocaleString()}
                  </span>
                  <span className="text-white/50 text-xs">平盘家数</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-loss-green text-2xl font-bold tracking-tight">
                    {downCount.toLocaleString()}
                  </span>
                  <span className="text-white/50 text-xs">下跌家数</span>
                </div>
              </div>
              {/* Simplified Bar Chart */}
              <div className="grid grid-cols-7 gap-2 items-end h-32 px-2 mt-4">
                <div
                  className="bg-loss-green/40 rounded-t-sm w-full transition-all"
                  style={{ height: "30%" }}
                ></div>
                <div
                  className="bg-loss-green/60 rounded-t-sm w-full transition-all"
                  style={{ height: "50%" }}
                ></div>
                <div
                  className="bg-loss-green/80 rounded-t-sm w-full transition-all"
                  style={{ height: "70%" }}
                ></div>
                <div
                  className="bg-primary/50 rounded-t-sm w-full transition-all"
                  style={{ height: "20%" }}
                ></div>
                <div
                  className="bg-gain-red/80 rounded-t-sm w-full transition-all"
                  style={{ height: "85%" }}
                ></div>
                <div
                  className="bg-gain-red/60 rounded-t-sm w-full transition-all"
                  style={{ height: "60%" }}
                ></div>
                <div
                  className="bg-gain-red/40 rounded-t-sm w-full transition-all"
                  style={{ height: "40%" }}
                ></div>
              </div>
              <div className="grid grid-cols-7 gap-2 text-[10px] text-white/40 text-center mt-2">
                <span>-5%</span>
                <span>-3%</span>
                <span>-1%</span>
                <span>0%</span>
                <span>+1%</span>
                <span>+3%</span>
                <span>+5%</span>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Volume Chart Section */}
        <section className="mt-4 px-4">
          <GlassCard className="p-5 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white text-lg font-bold">两市合计成交额</h3>
              <span className="text-white/40 text-xs">单位：亿元</span>
            </div>
            {chartLoading ? (
              <div className="w-full h-[300px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                  <span className="text-white/60 text-sm">加载图表数据中...</span>
                </div>
              </div>
            ) : (
              <div ref={volumeChartRef} style={{ width: '100%', height: '300px' }}></div>
            )}
          </GlassCard>
        </section>

        {/* Capital Flow Section */}
        <section className="mt-6 px-4 mb-4">
          <GlassCard className="p-5 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white text-lg font-bold">资金流向统计</h3>
              <div className="flex gap-2">
                <span className="text-xs flex items-center gap-1 text-white/60">
                  <span className="size-2 rounded-full bg-primary"></span> 北向
                </span>
                <span className="text-xs flex items-center gap-1 text-white/60">
                  <span className="size-2 rounded-full bg-gain-red"></span> 净入
                </span>
                <span className="text-xs flex items-center gap-1 text-white/60">
                  <span className="size-2 rounded-full bg-loss-green"></span> 净出
                </span>
              </div>
            </div>
            <div className="space-y-6">
              {/* Main Capital Flow */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/70">主力资金净流入</span>
                  <span className="text-gain-red font-bold">+128.45 亿</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="bg-gain-red h-full rounded-full"
                    style={{ width: "65%" }}
                  ></div>
                </div>
              </div>
              {/* Northbound Flow */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/70">北向资金净流入</span>
                  <span className="text-loss-green font-bold">-42.10 亿</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="bg-loss-green/60 h-full rounded-full"
                    style={{ width: "30%" }}
                  ></div>
                </div>
              </div>
              {/* Market Breadth */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/70">市场涨跌比</span>
                  <span className="text-primary font-bold">1.82:1</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: "65%" }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <p className="text-white/40 text-[10px] uppercase font-bold">
                  两市合计成交额
                </p>
                <p className="text-lg font-bold mt-1">9,240.2亿</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <p className="text-white/40 text-[10px] uppercase font-bold">
                  平均换手率
                </p>
                <p className="text-lg font-bold mt-1">1.42%</p>
              </div>
            </div>
          </GlassCard>
        </section>
      </main>
      <BottomNav items={navItems} />
    </div>
  );
}
