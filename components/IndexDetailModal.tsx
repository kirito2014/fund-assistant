'use client';

import React, { useState, useEffect, useRef } from "react";
import * as echarts from "echarts";
import { Icon } from "@/components/ui/Icon"; // 假设你已有的 Icon 组件

// 定义 props 接口
export interface IndexDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  // 传入的基础信息，包含 secid (如 1.000001) 和基本展示信息
  indexInfo: {
    secid: string; // 必须: 东方财富API需要的ID
    code: string;  // 显示代码
    name: string;  // 显示名称
    price?: number;
    changePercent?: number;
  } | null;
}

export function IndexDetailModal({ isOpen, onClose, indexInfo }: IndexDetailModalProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [dataError, setDataError] = useState(false);

  // ----------------------------------------------------------------
  // 辅助函数：生成时间轴 (移植自 Vue 逻辑)
  // ----------------------------------------------------------------
  const generateTimeData = (marketType: 'hs' | 'hk' | 'us') => {
    const timeArr: string[] = [];
    
    const addTimeStr = (time: string, num: number) => {
      let [hourStr, minStr] = time.split(':');
      let hour = parseInt(hourStr);
      let mins = parseInt(minStr);
      
      const totalMins = hour * 60 + mins + num;
      const newHour = Math.floor(totalMins / 60);
      const newMins = totalMins % 60;
      
      return `${newHour.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
    };

    const getNextTime = (startTime: string, endTime: string, offset: number) => {
      let current = startTime;
      while (current !== endTime) {
        current = addTimeStr(current, offset);
        timeArr.push(current);
      }
    };

    if (marketType === 'hs') {
      timeArr.push('09:30');
      getNextTime('09:30', '11:30', 1);
      getNextTime('13:00', '15:00', 1);
    } else if (marketType === 'hk') {
      timeArr.push('09:30');
      getNextTime('09:30', '12:00', 1);
      getNextTime('13:00', '16:00', 1);
    }
    // 这里暂略美股复杂时间段，默认走 A 股逻辑
    return timeArr;
  };

  // ----------------------------------------------------------------
  // 数据获取
  // ----------------------------------------------------------------
  const fetchDetailData = async () => {
    if (!indexInfo) return;
    setLoading(true);
    setDataError(false);

    try {
      // 东方财富分时数据接口
      const url = `https://push2.eastmoney.com/api/qt/stock/trends2/get?secid=${indexInfo.secid}&fields1=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13&fields2=f51,f53,f56,f58&iscr=0&iscca=0&ndays=1&forcect=1`;
      
      const res = await fetch(url);
      const json = await res.json();
      
      if (!json?.data?.trends) {
        throw new Error("No data available");
      }

      const prePrice = json.data.prePrice; // 昨日收盘价
      const trends = json.data.trends;
      
      // 解析数据: "时间,价格,成交量,..."
      const dataList = trends.map((item: string) => item.split(','));
      
      // 简单判断市场类型
      let marketType: 'hs' | 'hk' = 'hs';
      if (indexInfo.secid.startsWith('100.')) marketType = 'hk'; 
      
      const timeData = generateTimeData(marketType);
      const prices = dataList.map((item: any) => parseFloat(item[1]));
      const volumes = dataList.map((item: any) => parseFloat(item[2]));

      renderChart(timeData, prices, volumes, prePrice);

    } catch (e) {
      console.error("加载分时数据失败", e);
      setDataError(true);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // ECharts 渲染逻辑
  // ----------------------------------------------------------------
  const renderChart = (timeData: string[], prices: number[], volumes: number[], prePrice: number) => {
    if (!chartRef.current) return;
    
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // 核心算法：计算 Y 轴范围，确保【昨日收盘价】位于 Y 轴正中心
    // 这样 0% 的涨跌幅线就会在图表中间，红绿分明
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const maxDiff = Math.max(Math.abs(maxPrice - prePrice), Math.abs(minPrice - prePrice));
    
    // 留 2% 的上下余量，避免最高点顶到边框
    const limit = maxDiff * 1.02;
    const yMax = prePrice + limit;
    const yMin = prePrice - limit;
    
    // 计算对应的涨跌幅百分比范围
    const percentMax = (limit / prePrice) * 100;

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      animation: true,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', label: { backgroundColor: '#333' } },
        backgroundColor: 'rgba(20, 20, 20, 0.9)',
        borderColor: '#444',
        borderWidth: 1,
        textStyle: { color: '#eee', fontSize: 12 },
        formatter: (params: any) => {
          const p = params[0];
          if (!p) return '';
          const idx = p.dataIndex;
          const currPrice = prices[idx];
          const currVol = volumes[idx];
          const change = ((currPrice - prePrice) / prePrice * 100).toFixed(2);
          const color = currPrice >= prePrice ? '#ef4444' : '#10b981'; // Tailwind red-500 / emerald-500
          
          return `
            <div style="font-weight:bold;margin-bottom:4px;color:#aaa;">${p.name}</div>
            <div style="display:flex;justify-content:space-between;gap:10px;">
              <span>价格:</span> <span style="color:${color};font-weight:bold;">${currPrice.toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;gap:10px;">
              <span>涨幅:</span> <span style="color:${color};font-weight:bold;">${Number(change) > 0 ? '+' : ''}${change}%</span>
            </div>
            <div style="display:flex;justify-content:space-between;gap:10px;">
              <span>成交:</span> <span>${(currVol / 10000).toFixed(0)}万</span>
            </div>
          `;
        }
      },
      // 两个网格：上部分时图(55%)，下部成交量(20%)
      grid: [
        { left: 50, right: 50, top: 30, height: '55%' }, 
        { left: 50, right: 50, top: '70%', height: '20%' } 
      ],
      xAxis: [
        {
          type: 'category',
          data: timeData,
          axisLine: { lineStyle: { color: '#444' } },
          axisLabel: { color: '#888', interval: 'auto' }, 
          boundaryGap: false
        },
        {
          type: 'category',
          gridIndex: 1,
          data: timeData,
          axisLine: { show: false },
          axisLabel: { show: false },
          axisTick: { show: false },
          boundaryGap: false
        }
      ],
      yAxis: [
        // 左轴：价格
        {
          type: 'value',
          min: yMin,
          max: yMax,
          interval: (yMax - yMin) / 4, // 均分4份
          axisLabel: {
            color: (val: any) => {
              const numVal = Number(val);
              return numVal > prePrice ? '#ef4444' : numVal < prePrice ? '#10b981' : '#fff';
            },
            formatter: (val: number) => val.toFixed(2)
          },
          splitLine: { lineStyle: { color: '#333', type: 'dashed' } },
          axisLine: { show: false }
        },
        // 右轴：百分比 (与左轴严格对应)
        {
          type: 'value',
          min: -percentMax,
          max: percentMax,
          interval: (percentMax * 2) / 4,
          axisLabel: {
            color: (val: any) => {
              const numVal = Number(val);
              return numVal > 0 ? '#ef4444' : numVal < 0 ? '#10b981' : '#fff';
            },
            formatter: (val: number) => val.toFixed(2) + '%'
          },
          splitLine: { show: false },
          axisLine: { show: false }
        },
        // 下轴：成交量
        {
          type: 'value',
          gridIndex: 1,
          splitLine: { show: false },
          axisLabel: { show: false },
          axisTick: { show: false }
        }
      ],
      series: [
        {
          name: 'Price',
          type: 'line',
          data: prices,
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 1.5, color: '#fff' }, 
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(255, 255, 255, 0.2)' },
              { offset: 1, color: 'rgba(255, 255, 255, 0)' }
            ])
          },
          // 昨收价基准线
          markLine: {
            symbol: 'none',
            silent: true,
            data: [{ yAxis: prePrice }],
            lineStyle: { color: '#fbbf24', type: 'dashed', width: 1, opacity: 0.8 }, 
            label: { show: false }
          }
        },
        {
          name: 'Volume',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 2,
          data: volumes,
          itemStyle: {
            // 根据每分钟涨跌判断柱子颜色
            color: (params: any) => {
              const i = params.dataIndex;
              if (i === 0) return '#fff';
              return prices[i] >= prices[i-1] ? '#ef4444' : '#10b981';
            }
          }
        }
      ]
    };

    chartInstance.current.setOption(option);
  };

  // ----------------------------------------------------------------
  // 生命周期管理
  // ----------------------------------------------------------------
  useEffect(() => {
    if (isOpen && indexInfo) {
      fetchDetailData();
    } else {
      // 关闭时重置状态
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
      setIsLandscape(false);
    }
  }, [isOpen, indexInfo]);

  // 处理横屏时的重绘
  useEffect(() => {
    // 稍微延迟等待 CSS transition 完成
    const timer = setTimeout(() => {
      chartInstance.current?.resize();
    }, 350); 
    return () => clearTimeout(timer);
  }, [isLandscape]);

  if (!isOpen || !indexInfo) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {/* 主容器：
        竖屏：默认卡片样式
        横屏：fixed 定位 + 居中 + 旋转90度 + 宽高互换
      */}
      <div 
        className={`
          relative bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-in-out
          ${isLandscape 
            ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vh] h-[90vw] rotate-90' 
            : 'w-full max-w-[400px] h-[500px]'
          }
        `}
      >
        {/* Header Section */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {indexInfo.name}
              <span className="text-xs font-normal text-white/50 px-1.5 py-0.5 border border-white/10 rounded font-mono">
                {indexInfo.code}
              </span>
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xl font-bold font-mono ${
                (indexInfo.changePercent || 0) >= 0 ? 'text-gain-red' : 'text-loss-green'
              }`}>
                {indexInfo.price?.toLocaleString()}
              </span>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                (indexInfo.changePercent || 0) >= 0 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
              }`}>
                {(indexInfo.changePercent || 0) >= 0 ? '+' : ''}{(indexInfo.changePercent || 0).toFixed(2)}%
              </span>
            </div>
          </div>
          
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <Icon name="close" className="text-lg" />
          </button>
        </div>

        {/* Chart Content Area */}
        <div className="relative w-full h-full flex-1 bg-gradient-to-b from-transparent to-black/30">
           {/* Chart Container */}
           <div ref={chartRef} className="w-full h-[calc(100%-80px)] mt-2" />

           {/* Loading State */}
           {loading && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1e1e1e]/80 z-20 backdrop-blur-sm">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-2"></div>
                <span className="text-white/50 text-xs">加载分时数据...</span>
             </div>
           )}
           
           {/* Error State */}
           {dataError && !loading && (
             <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-white/50 text-sm">
                <Icon name="error_outline" className="text-3xl mb-2 text-white/20" />
                <span>暂无分时数据</span>
             </div>
           )}
        </div>

        {/* Rotate Button (Floating Action Button) */}
        <button 
          onClick={() => setIsLandscape(!isLandscape)}
          className="absolute bottom-5 right-5 w-10 h-10 rounded-full bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 flex items-center justify-center shadow-lg backdrop-blur-md transition-all z-30 group"
          title={isLandscape ? "切换竖屏" : "切换横屏"}
        >
          <Icon 
            name={isLandscape ? "screen_lock_portrait" : "screen_lock_landscape"} 
            className="text-xl group-hover:scale-110 transition-transform" 
          />
        </button>
      </div>
    </div>
  );
}