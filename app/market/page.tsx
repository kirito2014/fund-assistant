'use client';

import React, { useState, useEffect, useRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";
import { BottomNav } from "@/components/BottomNav";
import { IndexDetailModal } from "@/components/IndexDetailModal";
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

// 指数代码映射
const INDEX_CODES = {
  '1.000001': '上证指数',
  '1.000300': '沪深300',
  '0.399001': '深证成指',
  '0.399006': '创业板指',
  '0.399005': '中小板指',
  '1.000688': '科创50'
};

// 国际市场指数代码映射
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
  
  // 模态框状态
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<{
    secid: string;
    code: string;
    name: string;
    price?: number;
    changePercent?: number;
  } | null>(null);
  
  // 处理指数卡片点击
  const handleIndexCardClick = (item: MarketIndex) => {
    // 构建 secid
    let secid = item.code;
    if (item.code.startsWith('sh')) {
      secid = `1.${item.code.slice(2)}`;
    } else if (item.code.startsWith('sz')) {
      secid = `0.${item.code.slice(2)}`;
    } else if (item.code === 'nasdaq') {
      secid = '100.NDX';
    } else if (item.code === 'dowjones') {
      secid = '100.DJIA';
    } else if (item.code === 'sp500') {
      secid = '100.SPX';
    } else if (item.code === 'hangseng') {
      secid = '100.HSI';
    }
    
    setSelectedIndex({
      secid,
      code: item.code,
      name: item.name,
      price: parseFloat(item.val.replace(/,/g, '')),
      changePercent: parseFloat(item.change.replace(/[+%]/g, ''))
    });
    setModalOpen(true);
  };
  
  const navItems = [
    { label: "行情", icon: "dashboard", href: "/market", isActive: true },
    { label: "估值", icon: "analytics", href: "/" },
    { label: "资产", icon: "account_balance_wallet", href: "/portfolio" },
    { label: "我的", icon: "person", href: "/profile" },
  ];

  // ----------------------------------------------------------------
  // 新增功能: 获取估值角标样式 (圆角矩形)
  // ----------------------------------------------------------------
  const getBadgeStyle = (colorKey: string) => {
     const baseStyle = "shrink-0 text-[10px] px-2 py-0.5 rounded-md font-bold transition-colors";
    switch (colorKey) {
      case 'loss-green': // 低估
        return `${baseStyle} bg-emerald-500/10 text-emerald-400`;
      case 'gain-red':   // 高估
        return `${baseStyle} bg-red-500/10 text-red-400`;
      case 'yellow-400': // 正常
      default:
        return `${baseStyle} bg-yellow-500/10 text-yellow-400`;
    }
  };

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
      // 检查缓存
      const cachedData = getCachedData();
      if (cachedData) {
        setMarketIndices(cachedData);
        setCoreIndices(cachedData.slice(0, 4));
        setLoading(false);
        setLastUpdated(new Date());
        return;
      }

      setLoading(true);
      
      const allIndexCodes = { ...INDEX_CODES, ...INTERNATIONAL_INDEX_CODES };
      const secids = Object.keys(allIndexCodes).join(',');
      const url = `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f4,f12,f13,f14&secids=${secids}&_=${Date.now()}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch market data');

      const data: any = await response.json();
      const indices: MarketIndex[] = [];
      
      if (data.data && data.data.diff) {
        const allIndices = data.data.diff.map((item: any) => {
          const code = item.f12;
          const marketCode = item.f13;
          const fullCode = `${marketCode}.${code}`;
          
          const name = allIndexCodes[fullCode as keyof typeof allIndexCodes] || item.f14;
          const price = item.f2;
          const changePercent = item.f3;
          
          const valuation = getMockValuation(fullCode);
          const { level, color } = getValuationLevel(valuation);

          let frontendCode = fullCode;
          if (fullCode.startsWith('1.')) {
            frontendCode = `sh${fullCode.slice(2)}`;
          } else if (fullCode.startsWith('0.')) {
            frontendCode = `sz${fullCode.slice(2)}`;
          } else if (fullCode.startsWith('100.')) {
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
            statusColor: color // 修改：只保存颜色Key (如 'loss-green')，不带 text- 前缀
          };
        });
        
        indices.push(...allIndices);
      }

      saveToCache(indices);
      setMarketIndices(indices);
      setCoreIndices(indices.slice(0, 4));
      setLastUpdated(new Date());
    } catch (error) {
      console.error('获取市场数据失败:', error);
      useMockData();
    } finally {
      setLoading(false);
    }
  };
  
  // 使用模拟数据
  const useMockData = () => {
    // 修改：statusColor 只保留颜色 Key，统一使用 yellow-400 替代 primary
    const mockData: MarketIndex[] = [
      { code: "sh000001", name: "上证指数", val: "3050.12", change: "+0.45%", isUp: true, status: "高估", statusColor: "gain-red" },
      { code: "sz399001", name: "深证成指", val: "10020.45", change: "-0.12%", isUp: false, status: "适中", statusColor: "yellow-400" },
      { code: "sz399006", name: "创业板指", val: "1850.32", change: "+1.20%", isUp: true, status: "极低", statusColor: "loss-green" },
      { code: "sh000300", name: "沪深300", val: "3540.10", change: "+0.30%", isUp: true, status: "适中", statusColor: "yellow-400" },
      { code: "nasdaq", name: "纳斯达克", val: "14823.45", change: "+0.85%", isUp: true, status: "适中", statusColor: "yellow-400" },
      { code: "dowjones", name: "道琼斯", val: "37245.10", change: "+0.32%", isUp: true, status: "高估", statusColor: "gain-red" },
      { code: "sp500", name: "标普500", val: "4856.78", change: "+0.58%", isUp: true, status: "适中", statusColor: "yellow-400" },
      { code: "hangseng", name: "恒生指数", val: "16825.30", change: "-0.65%", isUp: false, status: "极低", statusColor: "loss-green" },
    ];
    setMarketIndices(mockData);
    setCoreIndices(mockData.slice(0, 4));
    setLastUpdated(new Date());
  };
  
  // 刷新数据
  const handleRefresh = async () => {
    localStorage.removeItem(CACHE_KEY);
    // 重置 chartLoading 触发重新加载动画，但不卸载组件
    setChartLoading(true); 
    await fetchMarketData();
  };
  
  useEffect(() => {
    fetchMarketData();
  }, []);

  // 异步加载图表数据
  useEffect(() => {
    const loadChartData = async () => {
      // 确保在数据加载时不处于 loading 状态，避免与 handleRefresh 冲突
      // 这里逻辑简化，因为我们通过 overlay 解决，不需要严格控制 chartLoading 互斥
      if (loading) return; 
      
      setChartLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        // 数据获取逻辑...
      } catch (error) {
        console.error('加载图表数据失败:', error);
      } finally {
        setChartLoading(false);
      }
    };

    if (!loading) {
      loadChartData();
    }
  }, [loading]);
  
  // ECharts 初始化与更新
  useEffect(() => {
    // 只有当 ref 存在且数据就绪时才初始化
    if (volumeChartRef.current) {
      if (!volumeChartInstance.current) {
        volumeChartInstance.current = echarts.init(volumeChartRef.current);
      }
      
      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: function(params: any) {
            return `${params[0].name}<br/>成交额: ${params[0].value} 亿元`;
          },
          backgroundColor: 'rgba(10, 10, 10, 0.8)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          textStyle: { color: '#fff' }
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
          axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.2)' } },
          axisLabel: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 10 }
        },
        yAxis: {
          type: 'value',
          name: '亿元',
          nameTextStyle: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 10 },
          axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.2)' } },
          axisLabel: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 10 },
          splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } }
        },
        series: [
          {
            name: '成交额',
            type: 'line',
            smooth: true,
            data: volumeData,
            lineStyle: { color: '#3b82f6', width: 2 },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
              ])
            },
            symbol: 'circle',
            symbolSize: 4,
            itemStyle: { color: '#3b82f6' }
          }
        ]
      };
      
      volumeChartInstance.current.setOption(option);
      
      const handleResize = () => {
        volumeChartInstance.current?.resize();
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        // 在组件卸载时才 dispose，而不是每次 chartLoading 变化时
        // 实际上由于我们不再条件渲染父 div，这个清理只会在整个页面卸载时触发，这是安全的
        volumeChartInstance.current?.dispose();
        volumeChartInstance.current = null;
      };
    }
  }, [volumeData, timeLabels]);
  
  const displayIndices = isExpanded ? marketIndices : coreIndices;

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col max-w-[430px] mx-auto overflow-x-hidden shadow-2xl bg-background-light dark:bg-background-dark font-display text-white">
      {/* TopAppBar */}
      <header className="sticky top-0 z-50 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between border-b border-white/10">
        <div className="flex w-12 items-center justify-start"></div>
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white text-lg font-bold">市场指数估值</h3>
            <button className="text-primary text-xs font-medium">点击查看详情</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {loading ? (
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
              displayIndices.map((item) => (
                <GlassCard 
                  key={item.code} 
                  className="p-4 rounded-xl flex flex-col gap-2 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => handleIndexCardClick(item)}
                >
                  <div className="flex justify-between items-start">
                    <p className="text-white/70 text-sm font-medium">{item.name}</p>
                    {/* 修改：使用 getBadgeStyle 应用圆角矩形样式 */}
                    <span className={getBadgeStyle(item.statusColor)}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-white text-2xl font-bold">{item.val}</p>
                  <p className={`text-sm font-semibold ${item.isUp ? "text-gain-red" : "text-loss-green"}`}>
                    {item.change}{" "}
                    <Icon name={item.isUp ? "trending_up" : "trending_down"} className="text-xs align-middle" />
                  </p>
                </GlassCard>
              ))
            ) : (
              Array.from({ length: 4 }).map((_, index) => (
                <GlassCard key={index} className="p-4 rounded-xl flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <p className="text-white/70 text-sm font-medium">暂无数据</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-bold bg-slate-700/20 text-slate-400">--</span>
                  </div>
                  <p className="text-white text-2xl font-bold">--</p>
                  <p className="text-sm font-semibold text-slate-400">--</p>
                </GlassCard>
              ))
            )}
          </div>
          
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
            {/* ... 保持原有代码 ... */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white text-lg font-bold">大盘涨跌分布</h3>
              <span className="text-white/40 text-xs">更新于 {clientTime}</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end mb-4">
                <div className="flex flex-col">
                  <span className="text-gain-red text-2xl font-bold tracking-tight">{upCount.toLocaleString()}</span>
                  <span className="text-white/50 text-xs">上涨家数</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-primary text-2xl font-bold tracking-tight">{flatCount.toLocaleString()}</span>
                  <span className="text-white/50 text-xs">平盘家数</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-loss-green text-2xl font-bold tracking-tight">{downCount.toLocaleString()}</span>
                  <span className="text-white/50 text-xs">下跌家数</span>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2 items-end h-32 px-2 mt-4">
                <div className="bg-loss-green/40 rounded-t-sm w-full transition-all" style={{ height: "30%" }}></div>
                <div className="bg-loss-green/60 rounded-t-sm w-full transition-all" style={{ height: "50%" }}></div>
                <div className="bg-loss-green/80 rounded-t-sm w-full transition-all" style={{ height: "70%" }}></div>
                <div className="bg-primary/50 rounded-t-sm w-full transition-all" style={{ height: "20%" }}></div>
                <div className="bg-gain-red/80 rounded-t-sm w-full transition-all" style={{ height: "85%" }}></div>
                <div className="bg-gain-red/60 rounded-t-sm w-full transition-all" style={{ height: "60%" }}></div>
                <div className="bg-gain-red/40 rounded-t-sm w-full transition-all" style={{ height: "40%" }}></div>
              </div>
              <div className="grid grid-cols-7 gap-2 text-[10px] text-white/40 text-center mt-2">
                <span>-5%</span><span>-3%</span><span>-1%</span><span>0%</span><span>+1%</span><span>+3%</span><span>+5%</span>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Volume Chart Section - 修复核心部分 */}
        <section className="mt-4 px-4">
          <GlassCard className="p-5 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white text-lg font-bold">两市合计成交额</h3>
              <span className="text-white/40 text-xs">单位：亿元</span>
            </div>
            
            {/* 修复：使用相对定位的容器，始终渲染图表 div，只用绝对定位遮罩来显示 Loading */}
            <div className="relative w-full h-[300px]">
              {chartLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background-light/10 dark:bg-background-dark/10 backdrop-blur-sm rounded-lg">
                  <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-3"></div>
                  <span className="text-white/60 text-sm">加载图表数据中...</span>
                </div>
              )}
              
              {/* 这个 div 始终存在，不再会被条件移除 */}
              <div ref={volumeChartRef} className="w-full h-full"></div>
            </div>
          </GlassCard>
        </section>

        {/* Capital Flow Section */}
        <section className="mt-6 px-4 mb-4">
          <GlassCard className="p-5 rounded-xl">
            {/* ... 保持原有代码 ... */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white text-lg font-bold">资金流向统计</h3>
              <div className="flex gap-2">
                <span className="text-xs flex items-center gap-1 text-white/60"><span className="size-2 rounded-full bg-primary"></span> 北向</span>
                <span className="text-xs flex items-center gap-1 text-white/60"><span className="size-2 rounded-full bg-gain-red"></span> 净入</span>
                <span className="text-xs flex items-center gap-1 text-white/60"><span className="size-2 rounded-full bg-loss-green"></span> 净出</span>
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/70">主力资金净流入</span>
                  <span className="text-gain-red font-bold">+128.45 亿</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="bg-gain-red h-full rounded-full" style={{ width: "65%" }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/70">北向资金净流入</span>
                  <span className="text-loss-green font-bold">-42.10 亿</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="bg-loss-green/60 h-full rounded-full" style={{ width: "30%" }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/70">市场涨跌比</span>
                  <span className="text-primary font-bold">1.82:1</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: "65%" }}></div>
                </div>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <p className="text-white/40 text-[10px] uppercase font-bold">两市合计成交额</p>
                <p className="text-lg font-bold mt-1">9,240.2亿</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <p className="text-white/40 text-[10px] uppercase font-bold">平均换手率</p>
                <p className="text-lg font-bold mt-1">1.42%</p>
              </div>
            </div>
          </GlassCard>
        </section>
      </main>
      <BottomNav items={navItems} />
      
      {/* 指数详情模态框 */}
      <IndexDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        indexInfo={selectedIndex}
      />
    </div>
  );
}