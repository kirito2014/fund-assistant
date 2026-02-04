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

// 指数代码映射（使用东方财富的指数代码格式）
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

// 反向映射，用于从东方财富代码获取前端代码
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
const HOME_CACHE_EXPIRY = 5 * 60 * 1000; // 5分钟缓存

export default function Home() {
  const [marketStatus, setMarketStatus] = useState({
    status: '加载中',
    statusColor: 'orange'
  });
  
  // 真实展示的指数列表
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([]);
  
  // 编辑模式下的槽位状态 (固定长度为4，包含 null 占位符)
  const [editSlots, setEditSlots] = useState<(MarketIndex | null)[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [clientTime, setClientTime] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // 当前正在操作的占位符索引
  const [activePlaceholderIndex, setActivePlaceholderIndex] = useState<number | null>(null);
  
  // 组件挂载状态
  const [isMounted, setIsMounted] = useState(true);

  // 客户端渲染时设置时间
  useEffect(() => {
    setClientTime(lastUpdated.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, [lastUpdated]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      setIsMounted(false);
    };
  }, []);

  // 获取市场状态
  const fetchMarketStatus = async () => {
    try {
      const response = await fetch('/api/market-status');
      if (response.ok && isMounted) {
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

  // 获取模拟估值数据
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

  // 获取估值水平
  const getValuationLevel = (valuation: number): { level: string; color: string } => {
    if (valuation < 20) {
      return { level: '极低', color: 'loss-green' };
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

  // 从缓存获取数据
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

  // 保存数据到缓存
  const saveToCache = (data: MarketIndex[]) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(HOME_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('保存缓存失败:', error);
    }
  };

  // 获取市场指数估值
  const fetchMarketValuation = async () => {
    try {
      setLoading(true);
      
      const savedConfig = localStorage.getItem('marketIndicesConfig');
      let savedCodes: string[] = [];

      if (savedConfig) {
        try {
          savedCodes = JSON.parse(savedConfig);
        } catch (e) {
          console.error('解析保存的配置失败:', e);
          savedCodes = ['sh000001', 'sh000300', 'sz399001', 'sz399006'];
        }
      } else {
        // 默认显示前4个
        savedCodes = ['sh000001', 'sh000300', 'sz399001', 'sz399006'];
      }

      // 尝试从缓存获取数据
      const cachedData = getCachedData();
      if (cachedData && isMounted) {
        // 检查缓存数据是否包含当前所有需要的指数
        const cachedCodes = cachedData.map(item => item.code);
        const hasAllCodes = savedCodes.every(code => cachedCodes.includes(code));
        
        if (hasAllCodes) {
          // 过滤出当前需要的指数
          const filteredIndices = cachedData.filter(item => savedCodes.includes(item.code));
          setMarketIndices(filteredIndices);
          setLastUpdated(new Date());
          setLoading(false);
          return;
        }
      }

      // 构建东方财富API需要的指数代码
      const eastMoneyCodes = savedCodes
        .map(code => INDEX_CODES_MAP[code])
        .filter((code): code is string => Boolean(code));

      if (eastMoneyCodes.length === 0) {
        // 兜底至少显示1个
        eastMoneyCodes.push('1.000001');
      }

      // 构建指数代码字符串
      const secids = eastMoneyCodes.join(',');

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
          
          // 获取前端使用的代码
          const frontendCode = REVERSE_INDEX_CODES_MAP[fullCode] || fullCode;
          
          // 获取指数名称
          const name = INDEX_NAMES_MAP[fullCode] || item.f14;
          const price = item.f2;
          const change = item.f4;
          const changePercent = item.f3;
          
          // 获取估值数据
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

      // 保存到缓存
      saveToCache(indices);

      // 过滤出当前需要的指数
      const filteredIndices = indices.filter(item => savedCodes.includes(item.code));
      
      // 兜底至少显示1个
      if (filteredIndices.length === 0 && indices.length > 0) {
        filteredIndices.push(indices[0]);
      }

      if (isMounted) {
        setMarketIndices(filteredIndices);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('获取市场指数估值失败:', error);
      // 错误时使用默认数据
      const defaultIndices: MarketIndex[] = [
        { code: 'sh000001', name: '上证指数', price: 3125.25, change: 15.62, changePercent: 0.50, valuation: 35, valuationLevel: '低估', valuationColor: 'loss-green' },
        { code: 'sh000300', name: '沪深300', price: 3852.12, change: 20.05, changePercent: 0.52, valuation: 25, valuationLevel: '低估', valuationColor: 'loss-green' },
        { code: 'sz399001', name: '深证成指', price: 10256.78, change: -52.34, changePercent: -0.51, valuation: 45, valuationLevel: '正常', valuationColor: 'yellow-400' },
        { code: 'sz399006', name: '创业板指', price: 1782.30, change: 21.85, changePercent: 1.24, valuation: 65, valuationLevel: '高估', valuationColor: 'gain-red' }
      ];
      if (isMounted) {
        setMarketIndices(defaultIndices);
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    // 清除缓存，强制获取最新数据
    localStorage.removeItem(HOME_CACHE_KEY);
    await Promise.all([
      fetchMarketStatus(),
      fetchMarketValuation()
    ]);
  };
  
  // 开启编辑模式：核心逻辑修改
  const startEditing = () => {
    // 复制当前指数
    const slots = [...marketIndices];
    
    // 自动补全到4个位置（2x2布局）
    // 无论当前是1个、2个还是3个，都补满到4个
    while (slots.length < 4) {
      slots.push(null as any);
    }
    
    setEditSlots(slots);
    setIsEditing(true);
  };

  // 保存变更：核心逻辑修改
  const saveChanges = async () => {
    // 过滤掉 null 占位符，实现自动压缩/移位
    // 例如：[A, null, B, null] -> [A, B]
    // 这样渲染时，A和B自然会占据第一行的两个位置
    const compactedIndices = editSlots.filter((item): item is MarketIndex => item !== null);
    
    setMarketIndices(compactedIndices);
    
    const currentCodes = compactedIndices.map(index => index.code);
    localStorage.setItem('marketIndicesConfig', JSON.stringify(currentCodes));
    
    // 清除缓存，确保下次获取最新数据
    localStorage.removeItem(HOME_CACHE_KEY);
    
    // 重新获取数据，确保显示最新的指数信息
    await fetchMarketValuation();
    
    setIsEditing(false);
  };

  // 在编辑模式下删除卡片
  const handleDeleteSlot = (index: number) => {
    const activeCount = editSlots.filter(item => item !== null).length;
    
    // 最少保留1个
    if (activeCount <= 1) {
      return;
    }

    const newSlots = [...editSlots];
    newSlots[index] = null; // 仅置为空，位置保留
    setEditSlots(newSlots);
  };

  const openAddModalForSlot = (slotIndex: number) => {
    setActivePlaceholderIndex(slotIndex);
    setShowModal(true);
  };
  
  // 预定义的10个完整市场指数数据源
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
          
          {/* 强制 2x2 Grid 布局 */}
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
            ) : (
              // 渲染逻辑
              // 编辑模式：始终渲染 editSlots (长度固定为4)
              // 展示模式：渲染 marketIndices (长度1-4)
              (isEditing ? editSlots : marketIndices).map((indexData, i) => {
                
                // Case 1: 占位符 (仅在编辑模式且 slot 为 null 时)
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

                // Case 2: 实体卡片
                return (
                  <div key={indexData.code} className={`relative ${isEditing ? 'animate-pulse-slow' : ''}`}>
                    <GlassCard className={`p-4 rounded-xl flex flex-col gap-2 relative h-full ${isEditing ? 'border-primary/30' : ''}`}>
                      
                      {/* 编辑模式下的删除按钮 */}
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
                        <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold bg-${indexData.valuationColor === 'loss-green' ? 'green' : indexData.valuationColor === 'gain-red' ? 'red' : 'yellow'}-500/20 text-${indexData.valuationColor}`}>
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
            
            {/* 非编辑模式下，如果数据不足4个，这里不需要做额外填充，
               因为题目要求"保存后未添加卡牌的空白处不显示任何卡片信息"。
               grid布局会自动留白。
            */}
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
                      <span className={`block text-[10px] px-1.5 py-0.5 rounded uppercase font-bold bg-${index.valuationColor === 'loss-green' ? 'green' : index.valuationColor === 'gain-red' ? 'red' : 'yellow'}-500/10 text-${index.valuationColor} mb-1`}>
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