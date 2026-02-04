'use client';

import React, { useState, useEffect, useRef } from "react";
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

// 指数代码映射
const INDEX_CODES_MAP: Record<string, string> = {
  'sh000001': '1.000001',
  'sh000300': '1.000300',
  'sz399001': '0.399001',
  'sz399006': '0.399006',
  'sz399005': '0.399005',
  'sh000688': '1.000688',
  'sh000905': '1.000905',
  'sh000852': '1.000852',
  'hkHSI': '100.HSI',
  'usSPX': '100.SPX'
};

// 反向映射
const REVERSE_INDEX_CODES_MAP: Record<string, string> = {
  '1.000001': 'sh000001',
  '1.000300': 'sh000300',
  '0.399001': 'sz399001',
  '0.399006': 'sz399006',
  '0.399005': 'sz399005',
  '1.000688': 'sh000688',
  '1.000905': 'sh000905',
  '1.000852': 'sh000852',
  '100.HSI': 'hkHSI',
  '100.SPX': 'usSPX'
};

// 指数名称映射
const INDEX_NAMES_MAP: Record<string, string> = {
  '1.000001': '上证指数',
  '1.000300': '沪深300',
  '0.399001': '深证成指',
  '0.399006': '创业板指',
  '0.399005': '中小板指',
  '1.000688': '科创50',
  '1.000905': '中证500',
  '1.000852': '中证1000',
  '100.HSI': '恒生指数',
  '100.SPX': '标普500'
};

// 缓存键
const HOME_CACHE_KEY = 'homeMarketIndicesData';
const HOME_CACHE_EXPIRY = 5 * 60 * 1000; 

export default function Home() {
  const [marketStatus, setMarketStatus] = useState({
    status: '休市中',
    statusColor: 'gray'
  });
  
  // 新增状态：当天是否为交易日（从API获取结果后存储）
  // null = 未知/加载中, true = 交易日, false = 节假日/非交易日
  const [isTradingDay, setIsTradingDay] = useState<boolean | null>(null);

  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([]);
  const [editSlots, setEditSlots] = useState<(MarketIndex | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [clientTime, setClientTime] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activePlaceholderIndex, setActivePlaceholderIndex] = useState<number | null>(null);
  
  const isMountedRef = useRef(true);

  // ----------------------------------------------------------------
  // 核心逻辑 1: 从 API 获取今日是否为交易日
  // ----------------------------------------------------------------
  const checkTradingDayStatus = async () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    try {
      // 使用 timor.tech 免费节假日 API
      // type: 0=工作日, 1=周末, 2=节日, 3=调休(要上班)
      // 交易日 = (type === 0 || type === 3) 且不是特定的金融休市日(简单逻辑先认为调休即交易)
      // 注意：真实金融API更为复杂，这里演示通用逻辑
      const res = await fetch(`https://timor.tech/api/holiday/info/${dateStr}`, {
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0' } // 部分公共API需要UA
      });
      
      if (res.ok) {
        const data = await res.json();
        // 如果 code 是 0，表示成功
        if (data.code === 0) {
          const type = data.type.type;
          // type 0 (工作日) 或 3 (调休工作日) -> 是交易日
          // type 1 (周末) 或 2 (节日) -> 不是交易日
          const isWorkDay = (type === 0 || type === 3);
          setIsTradingDay(isWorkDay);
          return; 
        }
      }
      throw new Error("API response invalid");
    } catch (error) {
      console.warn("节假日API获取失败，降级为本地周末判断:", error);
      // 降级策略：本地判断周六周日
      const day = now.getDay();
      const isWeekend = (day === 0 || day === 6);
      setIsTradingDay(!isWeekend);
    }
  };

  // ----------------------------------------------------------------
  // 核心逻辑 2: 根据 isTradingDay 和当前时间计算状态
  // ----------------------------------------------------------------
  const calculateRealTimeStatus = (isTradeDay: boolean | null) => {
    // 如果还没获取到交易日信息，默认先按休市处理，或者按本地时间预判
    // 这里为了用户体验，如果 fetch 还没回来，先跑一个本地判断
    let currentIsTradeDay = isTradeDay;
    if (currentIsTradeDay === null) {
      const day = new Date().getDay();
      currentIsTradeDay = (day !== 0 && day !== 6);
    }

    // 如果确定是非交易日
    if (!currentIsTradeDay) {
      return { status: '休市中', statusColor: 'gray' };
    }

    // 是交易日，判断具体时间段
    const now = new Date();
    // 转换为北京时间逻辑（处理本地时间可能不是北京时间的情况）
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const beijingTime = new Date(utc + (3600000 * 8));
    const hour = beijingTime.getHours();
    const minute = beijingTime.getMinutes();
    const timeValue = hour * 100 + minute; // 9:30 -> 930

    // A股交易时段
    if (timeValue >= 930 && timeValue < 1130) {
      return { status: '开市中', statusColor: 'green' };
    } else if (timeValue >= 1130 && timeValue < 1300) {
      return { status: '午间休市', statusColor: 'orange' };
    } else if (timeValue >= 1300 && timeValue < 1500) {
      return { status: '开市中', statusColor: 'green' };
    } else {
      // 9:30 之前或 15:00 之后
      return { status: '休市中', statusColor: 'gray' };
    }
  };

  // 初始化：挂载时检查一次节假日 API
  useEffect(() => {
    checkTradingDayStatus();
  }, []);

  // 定时器：每秒更新交易状态
  useEffect(() => {
    const updateTick = () => {
      // 基于当前的 isTradingDay 状态计算文字
      const newStatus = calculateRealTimeStatus(isTradingDay);
      
      // 避免重复 setState 造成不必要的渲染（简单的 diff）
      setMarketStatus(prev => {
        if (prev.status !== newStatus.status || prev.statusColor !== newStatus.statusColor) {
          return newStatus;
        }
        return prev;
      });
    };

    updateTick();
    const timer = setInterval(updateTick, 1000);
    return () => clearInterval(timer);
  }, [isTradingDay]); // 依赖 isTradingDay，当 API 返回结果后，定时器逻辑会自动更新为准确状态
  
  // 当 lastUpdated 变化时更新 clientTime
  useEffect(() => {
    setClientTime(lastUpdated.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, [lastUpdated]);


  // ----------------------------------------------------------------
  // UI 辅助：估值角标样式 (保持圆角矩形)
  // ----------------------------------------------------------------
  const getBadgeStyle = (colorKey: string) => {
    const baseStyle = "shrink-0 text-[10px] px-2 py-0.5 rounded-md font-bold transition-colors";
    switch (colorKey) {
      case 'loss-green': // 低估
        return `${baseStyle} bg-emerald-500/10 text-emerald-400 `;
      case 'gain-red':   // 高估
        return `${baseStyle} bg-red-500/10 text-red-400`;
      case 'yellow-400': // 正常
      default:
        return `${baseStyle} bg-yellow-500/10 text-yellow-400`;
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 5000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  };

  const fetchMarketStatus = async () => {
     // 此函数主要用于手动刷新时重新检查节假日信息
     await checkTradingDayStatus();
  };

  const getMockValuation = (code: string): number => {
    const valuations: Record<string, number> = {
      '1.000001': 35,
      '1.000300': 25,
      '0.399001': 45,
      '0.399006': 65,
      '0.399005': 50,
      '1.000688': 70,
      '1.000905': 30,
      '1.000852': 50,
      '100.HSI': 20,
      '100.SPX': 80
    };
    return valuations[code] || 50;
  };

  const getValuationLevel = (valuation: number): { level: string; color: string } => {
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
  };

  const getCachedData = (): MarketIndex[] | null => {
    try {
      const cachedData = localStorage.getItem(HOME_CACHE_KEY);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (Date.now() - timestamp < HOME_CACHE_EXPIRY) {
          return data;
        }
      }
    } catch (error) {
      console.error('读取缓存失败:', error);
    }
    return null;
  };

  const saveToCache = (data: MarketIndex[]) => {
    try {
      const cacheData = { data, timestamp: Date.now() };
      localStorage.setItem(HOME_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('保存缓存失败:', error);
    }
  };

  const fetchMarketValuation = async (useCache = true, updateLoadingState = true) => {
    try {
      if (updateLoadingState) setLoading(true);
      
      const savedConfig = localStorage.getItem('marketIndicesConfig');
      let savedCodes: string[] = [];

      if (savedConfig) {
        try {
          savedCodes = JSON.parse(savedConfig);
        } catch (e) {
          savedCodes = ['sh000001', 'sh000300', 'sz399001', 'sz399006'];
        }
      } else {
        savedCodes = ['sh000001', 'sh000300', 'sz399001', 'sz399006'];
      }

      if (useCache) {
        const cachedData = getCachedData();
        if (cachedData && isMountedRef.current) {
          const cachedCodes = cachedData.map(item => item.code);
          const hasAllCodes = savedCodes.every(code => cachedCodes.includes(code));
          if (hasAllCodes) {
            const filteredIndices = cachedData.filter(item => savedCodes.includes(item.code));
            setMarketIndices(filteredIndices);
            setLastUpdated(new Date());
            if (updateLoadingState) setLoading(false);
            return;
          }
        }
      }

      const eastMoneyCodes = savedCodes
        .map(code => INDEX_CODES_MAP[code])
        .filter((code): code is string => Boolean(code));

      if (eastMoneyCodes.length === 0) eastMoneyCodes.push('1.000001');

      const secids = eastMoneyCodes.join(',');
      const url = `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f4,f12,f13,f14&secids=${secids}&_=${Date.now()}`;

      const response = await fetchWithTimeout(url, {}, 8000);
      if (!response.ok) throw new Error('Failed to fetch market data');

      const data: any = await response.json();
      const indices: MarketIndex[] = [];
      
      if (data.data && data.data.diff) {
        const allIndices = data.data.diff.map((item: any) => {
          const code = item.f12;
          const marketCode = item.f13;
          const fullCode = `${marketCode}.${code}`;
          
          const frontendCode = REVERSE_INDEX_CODES_MAP[fullCode] || fullCode;
          const name = INDEX_NAMES_MAP[fullCode] || item.f14;
          const price = item.f2;
          const change = item.f4;
          const changePercent = item.f3;
          
          const valuation = getMockValuation(fullCode);
          const { level, color } = getValuationLevel(valuation);

          return {
            code: frontendCode,
            name,
            price,
            change,
            changePercent,
            valuation,
            valuationLevel: level,
            valuationColor: color
          };
        });
        indices.push(...allIndices);
      }

      saveToCache(indices);

      const filteredIndices = indices.filter(item => savedCodes.includes(item.code));
      if (filteredIndices.length === 0 && indices.length > 0) filteredIndices.push(indices[0]);

      if (isMountedRef.current) {
        setMarketIndices(filteredIndices);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('获取市场指数估值失败:', error);
      if (isMountedRef.current && marketIndices.length === 0) {
        const defaultIndices: MarketIndex[] = [
          { code: 'sh000001', name: '上证指数', price: 3125.25, change: 15.62, changePercent: 0.50, valuation: 35, valuationLevel: '低估', valuationColor: 'loss-green' },
          { code: 'sh000300', name: '沪深300', price: 3852.12, change: 20.05, changePercent: 0.52, valuation: 25, valuationLevel: '低估', valuationColor: 'loss-green' },
          { code: 'sz399001', name: '深证成指', price: 10256.78, change: -52.34, changePercent: -0.51, valuation: 45, valuationLevel: '正常', valuationColor: 'yellow-400' },
          { code: 'sz399006', name: '创业板指', price: 1782.30, change: 21.85, changePercent: 1.24, valuation: 65, valuationLevel: '高估', valuationColor: 'gain-red' }
        ];
        setMarketIndices(defaultIndices);
      }
    } finally {
      if (isMountedRef.current && updateLoadingState) setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    localStorage.removeItem(HOME_CACHE_KEY);
    try {
      await Promise.all([
        fetchMarketStatus(), // 刷新时重新检查交易状态 API
        fetchMarketValuation(false, false) 
      ]);
    } catch (e) {
      console.error("刷新过程中发生错误:", e);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };
  
  const startEditing = () => {
    const slots = [...marketIndices];
    while (slots.length < 4) slots.push(null as any);
    setEditSlots(slots);
    setIsEditing(true);
  };

  const saveChanges = async () => {
    const compactedIndices = editSlots.filter((item): item is MarketIndex => item !== null);
    setMarketIndices(compactedIndices);
    setIsEditing(false);
    const currentCodes = compactedIndices.map(index => index.code);
    localStorage.setItem('marketIndicesConfig', JSON.stringify(currentCodes));
    localStorage.removeItem(HOME_CACHE_KEY);
    await fetchMarketValuation(false, false); 
  };

  const handleDeleteSlot = (index: number) => {
    const activeCount = editSlots.filter(item => item !== null).length;
    if (activeCount <= 1) return;
    const newSlots = [...editSlots];
    newSlots[index] = null;
    setEditSlots(newSlots);
  };

  const openAddModalForSlot = (slotIndex: number) => {
    setActivePlaceholderIndex(slotIndex);
    setShowModal(true);
  };
  
  const ALL_MARKET_INDICES: MarketIndex[] = [
    { code: 'sh000001', name: '上证指数', price: 3125.25, change: 15.62, changePercent: 0.50, valuation: 35, valuationLevel: '低估', valuationColor: 'loss-green' },
    { code: 'sh000300', name: '沪深300', price: 3852.12, change: 20.05, changePercent: 0.52, valuation: 25, valuationLevel: '低估', valuationColor: 'loss-green' },
    { code: 'sz399001', name: '深证成指', price: 10256.78, change: -52.34, changePercent: -0.51, valuation: 45, valuationLevel: '正常', valuationColor: 'yellow-400' },
    { code: 'sz399006', name: '创业板指', price: 1782.30, change: 21.85, changePercent: 1.24, valuation: 65, valuationLevel: '高估', valuationColor: 'gain-red' },
    { code: 'sz399005', name: '中小板指', price: 8521.63, change: -125.36, changePercent: -1.45, valuation: 40, valuationLevel: '正常', valuationColor: 'yellow-400' },
    { code: 'sh000688', name: '科创50', price: 987.45, change: 15.67, changePercent: 1.61, valuation: 55, valuationLevel: '正常', valuationColor: 'yellow-400' },
    { code: 'sh000905', name: '中证500', price: 5621.33, change: -12.44, changePercent: -0.22, valuation: 30, valuationLevel: '低估', valuationColor: 'loss-green' },
    { code: 'sh000852', name: '中证1000', price: 6102.45, change: 45.22, changePercent: 0.75, valuation: 50, valuationLevel: '正常', valuationColor: 'yellow-400' },
    { code: 'hkHSI', name: '恒生指数', price: 17500.20, change: -200.50, changePercent: -1.13, valuation: 20, valuationLevel: '极低', valuationColor: 'loss-green' },
    { code: 'usSPX', name: '标普500', price: 4780.15, change: 10.50, changePercent: 0.22, valuation: 80, valuationLevel: '高估', valuationColor: 'gain-red' },
  ];

  const selectIndexToAdd = (indexCode: string) => {
    if (activePlaceholderIndex === null) return;
    const selectedIndex = ALL_MARKET_INDICES.find((i: MarketIndex) => i.code === indexCode);
    if (selectedIndex) {
      const newSlots = [...editSlots];
      newSlots[activePlaceholderIndex] = selectedIndex;
      setEditSlots(newSlots);
    }
    setShowModal(false);
    setActivePlaceholderIndex(null);
  };

  const getAvailableIndicesForModal = () => {
    const currentActiveCodes = editSlots
      .filter((item): item is MarketIndex => item !== null)
      .map(item => item.code);
    return ALL_MARKET_INDICES.filter((item: MarketIndex) => !currentActiveCodes.includes(item.code));
  };

  useEffect(() => {
    // 初始加载
    fetchMarketValuation(true, true);
  }, []);

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col max-w-[430px] mx-auto overflow-x-hidden shadow-2xl bg-background-light dark:bg-background-dark font-display text-white">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between border-b border-white/10">
        <div className="flex w-12 items-center justify-start"></div>
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
            <Icon name="refresh" className={`${loading ? 'animate-spin' : ''}`} />
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
            <div className="flex items-center gap-2">
              {isEditing ? (
                <button 
                  className="text-primary text-xs font-medium hover:underline"
                  onClick={saveChanges}
                >
                  保存变更
                </button>
              ) : (
                <button 
                  className="text-primary text-xs font-medium hover:underline"
                  onClick={startEditing}
                >
                  编辑卡片
                </button>
              )}
              <Link href="/market" className="text-primary text-xs font-medium hover:underline">查看全部</Link>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {loading ? (
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
            ) : (
              (isEditing ? editSlots : marketIndices).map((indexData, i) => {
                if (indexData === null) {
                  return (
                    <div key={`slot-${i}`} className="relative h-full">
                      <div className="h-full p-4 rounded-xl flex flex-col gap-2 border-2 border-dashed border-white/20 bg-white/5 backdrop-blur-md flex items-center justify-center min-h-[120px]">
                        <button 
                          className="w-12 h-12 rounded-full border-2 border-dashed border-primary/50 bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors z-10"
                          onClick={() => openAddModalForSlot(i)}
                        >
                          <Icon name="add" className="text-xl" />
                        </button>
                        <span className="text-slate-500 text-[10px] mt-2">添加指数</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={indexData.code} className={`relative ${isEditing ? 'animate-pulse-slow' : ''}`}>
                    <GlassCard className={`p-4 rounded-xl flex flex-col gap-2 relative h-full ${isEditing ? 'border-primary/30' : ''}`}>
                      {isEditing && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                          <button 
                            className="w-12 h-12 rounded-full bg-red-500/20 backdrop-blur-md border border-red-500/50 flex items-center justify-center text-red-500 hover:bg-red-500/40 hover:scale-110 transition-all pointer-events-auto shadow-lg shadow-red-900/20"
                            onClick={() => handleDeleteSlot(i)}
                          >
                            <Icon name="close" className="text-xl font-bold" />
                          </button>
                        </div>
                      )}
                      <div className={`flex items-center justify-between ${isEditing ? 'opacity-50 blur-[1px]' : ''}`}>
                        <span className="text-white/70 text-sm font-medium truncate pr-2">{indexData.name}</span>
                        {/* 圆角矩形样式 */}
                        <span className={getBadgeStyle(indexData.valuationColor)}>
                          {indexData.valuationLevel}
                        </span>
                      </div>
                      <div className={`flex flex-col ${isEditing ? 'opacity-50 blur-[1px]' : ''}`}>
                        <span className="text-white text-2xl font-bold">{indexData.price.toLocaleString()}</span>
                        <span className={`text-sm font-semibold text-${indexData.changePercent >= 0 ? 'gain-red' : 'loss-green'}`}>
                          {indexData.changePercent >= 0 ? '+' : ''}{indexData.changePercent.toFixed(2)}% ({indexData.change >= 0 ? '+' : ''}{indexData.change.toFixed(2)}) 
                          <Icon name={indexData.changePercent >= 0 ? 'trending_up' : 'trending_down'} className="text-xs align-middle ml-1" />
                        </span>
                      </div>
                    </GlassCard>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Mood & Profit Large Card */}
        <div className="p-4 pt-8">
          <GlassCard className="p-6 rounded-2xl relative overflow-hidden flex items-center justify-between shadow-2xl">
            <div className="absolute -right-10 -top-10 size-40 bg-primary/20 blur-[60px] rounded-full"></div>
            <div className="flex flex-col gap-1 z-10">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                  今日收益情绪
                </span>
                <span className="text-white font-bold px-2 py-0.5 rounded-full bg-primary/30 text-[10px]">
                  大喜
                </span>
                {/* 交易状态徽章 */}
                <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] border ${
                  marketStatus.statusColor === 'green' 
                    ? 'text-green-400 bg-green-400/20 border-green-400/40' 
                    : marketStatus.statusColor === 'orange'
                    ? 'text-orange-400 bg-orange-400/20 border-orange-400/40'
                    : 'text-gray-400 bg-gray-400/20 border-gray-400/40'
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
            <a className="flex flex-col items-center justify-center border-b-[3px] border-primary text-white pb-3 pt-4" href="#">
              <p className="text-white text-sm font-bold">今日涨幅榜</p>
            </a>
            <a className="flex flex-col items-center justify-center border-b-[3px] border-transparent text-slate-500 pb-3 pt-4" href="#">
              <p className="text-sm font-bold">今日跌幅榜</p>
            </a>
          </div>
        </div>

        {/* Movers List */}
        <div className="px-4 mt-4 space-y-3">
          {
            [
              { rank: "01", name: "天弘中证计算机主题", code: "001630", val: "+4.25%" },
              { rank: "02", name: "华夏半导体芯片ETF", code: "008887", val: "+3.82%" },
              { rank: "03", name: "易方达蓝筹精选", code: "005827", val: "+2.15%" },
            ].map((item, idx) => (
              <GlassCard key={idx} className="flex items-center justify-between p-4 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                    <span className="text-primary font-bold text-xs">{item.rank}</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">{item.name}</p>
                    <p className="text-slate-500 text-[10px]">{item.code} · 场外估值</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gain-red font-bold text-base">{item.val}</p>
                  <p className="text-slate-500 text-[10px]">实时估算</p>
                </div>
              </GlassCard>
            ))
          }
           <GlassCard className="flex items-center justify-between p-4 rounded-xl opacity-80">
              <div className="flex items-center gap-4">
                <div className="size-10 bg-slate-800 rounded-lg flex items-center justify-center">
                  <span className="text-slate-400 font-bold text-xs">04</span>
                </div>
                <div>
                  <p className="text-white text-sm font-bold">招商中证白酒</p>
                  <p className="text-slate-500 text-[10px]">161725 · 场外估值</p>
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
      
      {/* 添加卡片模态框 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl p-5 w-full max-w-[340px] border border-white/10 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white text-lg font-bold">选择市场指数</h4>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <Icon name="close" className="text-lg" />
              </button>
            </div>
            
            <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              {getAvailableIndicesForModal().length > 0 ? (
                getAvailableIndicesForModal().map((index: MarketIndex) => (
                  <div 
                    key={index.code} 
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/30 transition-all cursor-pointer group"
                    onClick={() => selectIndexToAdd(index.code)}
                  >
                    <div>
                      <div className="text-white text-sm font-bold group-hover:text-primary transition-colors">{index.name}</div>
                      <div className="text-slate-400 text-[10px] mt-0.5">{index.code}</div>
                    </div>
                    <div className="text-right">
                      <span className={`block w-fit mb-1 ${getBadgeStyle(index.valuationColor)}`}>
                        {index.valuationLevel}
                      </span>
                      <span className={`text-xs font-medium text-${index.changePercent >= 0 ? 'gain-red' : 'loss-green'}`}>
                         {index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm flex flex-col items-center">
                  <Icon name="check_circle" className="text-3xl mb-2 text-slate-600" />
                  已添加所有可用指数
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
              <button 
                className="w-full py-3 bg-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/20 transition-colors"
                onClick={() => setShowModal(false)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
      
      <BottomNav />
    </div>
  );
}