'use client';

import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactECharts from "echarts-for-react"; // 需安装: npm install echarts echarts-for-react
import * as echarts from "echarts";
import axios from "axios";
import { Icon } from "./ui/Icon";

// --- 工具函数 ---
const formatColor = (value: number) => {
  if (value > 0) return "#f56c6c"; // 红
  if (value < 0) return "#4eb61b"; // 绿
  return "#9ca3af"; // 灰
};

// --- 子组件：净值估值 (对应 charts.vue) ---
const RealtimeChart = ({ code }: { code: string }) => {
  const [option, setOption] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<any>({});

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    const url = `https://fundmobapi.eastmoney.com/FundMApi/FundVarietieValuationDetail.ashx?FCODE=${code}&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0&_=${Date.now()}`;
    
    axios.get(url).then(res => {
      const data = res.data;
      if (!data || !data.Datas) {
        setLoading(false);
        return;
      }
      
      const list = data.Datas.map((item: string) => item.split(","));
      const times = list.map((item: string[]) => item[0]);
      // item[2] 是估值数据
      const values = list.map((item: string[]) => parseFloat(item[2]));
      
      const minVal = Math.min(...values);
      const maxVal = Math.max(...values);
      const dwjz = parseFloat(data.Expansion.DWJZ); // 昨收

      // 构建图表配置
      setOption({
        tooltip: {
            trigger: 'axis',
            formatter: (params: any[]) => {
                const p = params[0];
                return `${p.name}<br/>估算净值: ${p.value}`;
            }
        },
        grid: { top: 30, bottom: 30, left: 40, right: 20 },
        xAxis: {
          type: 'category',
          data: times,
          axisLabel: { interval: 30, show: false }, // 简化显示
          axisTick: { show: false },
          axisLine: { lineStyle: { color: '#ffffff30' } }
        },
        yAxis: {
          type: 'value',
          min: 'dataMin',
          max: 'dataMax',
          splitLine: { show: false },
          axisLabel: { color: '#9ca3af', fontSize: 10 }
        },
        series: [{
          name: '估值',
          type: 'line',
          data: values,
          showSymbol: false,
          smooth: true,
          lineStyle: { width: 1.5, color: '#3b82f6' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0)' }
            ])
          }
        }]
      });
      
      setInfo({
          gz: data.Expansion.GZ,
          gszzl: data.Expansion.GSZZL,
          gztime: data.Expansion.GZTIME,
          dwjz: data.Expansion.DWJZ
      });
      setLoading(false);
    }).catch(e => setLoading(false));
  }, [code]);

  if (loading) return <div className="h-[300px] flex items-center justify-center text-slate-500">加载中...</div>;
  if (!option) return <div className="h-[300px] flex items-center justify-center text-slate-500">暂无数据</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end px-2">
        <div>
           <p className="text-slate-400 text-xs">实时估值 ({info.gztime?.split(' ')[1]})</p>
           <p className={`text-2xl font-bold font-display ${parseFloat(info.gszzl) >= 0 ? 'text-red-500' : 'text-green-500'}`}>
             {info.gz} <span className="text-sm">({parseFloat(info.gszzl) > 0 ? '+' : ''}{info.gszzl}%)</span>
           </p>
        </div>
        <div className="text-right">
            <p className="text-slate-400 text-xs">昨日净值</p>
            <p className="text-lg font-bold text-white">{info.dwjz}</p>
        </div>
      </div>
      <div className="h-[300px] w-full">
        <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
      </div>
    </div>
  );
};

// --- 子组件：历史净值 (对应 charts2.vue) ---
const HistoryChart = ({ code }: { code: string }) => {
  const [range, setRange] = useState('y'); // y, 3y, 6y, n, 3n, 5n
  const [option, setOption] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const ranges = [
    { label: '月', val: 'y' },
    { label: '季', val: '3y' },
    { label: '半年', val: '6y' },
    { label: '一年', val: 'n' },
    { label: '三年', val: '3n' },
  ];

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    const url = `https://fundmobapi.eastmoney.com/FundMApi/FundNetDiagram.ashx?FCODE=${code}&RANGE=${range}&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0&_=${Date.now()}`;
    
    axios.get(url).then(res => {
      const data = res.data.Datas;
      if (!data || data.length === 0) {
        setLoading(false);
        return;
      }

      setOption({
        tooltip: {
            trigger: 'axis',
            formatter: (params: any[]) => {
                let res = `<div>${params[0].name}</div>`;
                params.forEach(p => {
                    res += `<div style="color:${p.color}">${p.seriesName}: ${p.value}</div>`;
                });
                return res;
            }
        },
        legend: {
            data: ['单位净值', '累计净值'],
            textStyle: { color: '#9ca3af' },
            bottom: 0
        },
        grid: { top: 20, bottom: 60, left: 40, right: 10 },
        xAxis: {
          type: 'category',
          data: data.map((i: any) => i.PDATE),
          axisLabel: { show: false },
          axisTick: { show: false },
          axisLine: { lineStyle: { color: '#ffffff30' } }
        },
        yAxis: {
          type: 'value',
          scale: true,
          splitLine: { lineStyle: { color: '#ffffff10' } },
          axisLabel: { color: '#9ca3af', fontSize: 10 }
        },
        series: [
          {
            name: '单位净值',
            type: 'line',
            data: data.map((i: any) => parseFloat(i.DWJZ)),
            showSymbol: false,
            itemStyle: { color: '#3b82f6' },
            lineStyle: { width: 1.5 }
          },
          {
            name: '累计净值',
            type: 'line',
            data: data.map((i: any) => parseFloat(i.LJJZ)),
            showSymbol: false,
            itemStyle: { color: '#eab308' },
            lineStyle: { width: 1.5 }
          }
        ]
      });
      setLoading(false);
    }).catch(e => setLoading(false));
  }, [code, range]);

  return (
    <div className="space-y-4">
      <div className="flex bg-slate-800 rounded-lg p-1">
        {ranges.map(r => (
          <button
            key={r.val}
            onClick={() => setRange(r.val)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
              range === r.val ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      
      <div className="h-[300px] w-full relative">
        {loading && <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-10 text-slate-400">加载中...</div>}
        {option && <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />}
      </div>
    </div>
  );
};

// --- 子组件：持仓明细 (对应 positionDetail.vue) ---
const PositionTable = ({ code }: { code: string }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState('');

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    // 获取持仓列表
    const url = `https://fundmobapi.eastmoney.com/FundMApi/FundMNPeriodIncrease.ashx?FCODE=${code}&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0`;
    
    axios.get(url).then(res => {
      const list = res.data.Datas || [];
      setDate(res.data.Expansion);
      
      // 尝试获取实时行情(简易版)
      const secids = list.map((item: any) => {
         // 简易判断市场：6开头是沪市(1)，0/3开头是深市(0)
         const mkt = item.GPDM.startsWith('6') ? '1' : '0';
         return `${mkt}.${item.GPDM}`;
      }).join(',');

      // 使用新浪或东财行情接口补充涨跌幅
      // 这里为保持简单，直接展示API返回的静态数据，如果需要实时需额外调用行情接口
      // positionDetail.vue 原逻辑也尝试调用了行情。
      // 我们这里仅展示持仓占比和名称，实时涨跌幅如需展示需要额外接口支持。
      // 模拟调用东财行情接口 (可能跨域，仅作示例，如果失败则只显示静态)
      axios.get(`https://push2.eastmoney.com/api/qt/ulist/get?secids=${secids}&fields=f12,f14,f3,f2`).then(qRes => {
          const qMap = new Map();
          if (qRes.data?.data?.diff) {
              qRes.data.data.diff.forEach((d: any) => qMap.set(d.f12, d));
          }
          const merged = list.map((item: any) => ({
              ...item,
              realtime: qMap.get(item.GPDM) || {}
          }));
          setData(merged);
          setLoading(false);
      }).catch(() => {
          setData(list); // 降级
          setLoading(false);
      });

    }).catch(() => setLoading(false));
  }, [code]);

  if (loading) return <div className="p-8 text-center text-slate-500">加载中...</div>;

  return (
    <div className="space-y-3">
        <p className="text-xs text-slate-500 text-right">截止日期：{date || '--'}</p>
        <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-sm">
                <thead className="bg-slate-800 text-slate-400">
                    <tr>
                        <th className="p-3 text-left font-medium">股票名称</th>
                        <th className="p-3 text-right font-medium">现价</th>
                        <th className="p-3 text-right font-medium">涨跌幅</th>
                        <th className="p-3 text-right font-medium">占比</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {data.map((item, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="p-3">
                                <div className="text-white font-medium">{item.GPJC}</div>
                                <div className="text-xs text-slate-500">{item.GPDM}</div>
                            </td>
                            <td className="p-3 text-right text-slate-200">
                                {item.realtime?.f2 ? item.realtime.f2 : '--'}
                            </td>
                            <td className="p-3 text-right font-medium" style={{ color: formatColor(item.realtime?.f3 || 0) }}>
                                {item.realtime?.f3 ? `${item.realtime.f3}%` : '--'}
                            </td>
                            <td className="p-3 text-right text-slate-200">
                                {item.JZBL}%
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};

// --- 子组件：基金概况 (对应 fundInfo.vue) ---
const FundInfoOverview = ({ code }: { code: string }) => {
    const [info, setInfo] = useState<any>(null);

    useEffect(() => {
        const url = `https://fundmobapi.eastmoney.com/FundMApi/FundBaseInfo.ashx?FCODE=${code}&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0`;
        axios.get(url).then(res => {
            setInfo(res.data.Datas || {});
        });
    }, [code]);

    if (!info) return <div className="p-8 text-center text-slate-500">加载中...</div>;

    const ranks = [
        { label: '近1月', key: 'SYL_Y', rank: 'RANKM' },
        { label: '近3月', key: 'SYL_3Y', rank: 'RANKQ' },
        { label: '近6月', key: 'SYL_6Y', rank: 'RANKHY' },
        { label: '近1年', key: 'SYL_1N', rank: 'RANKY' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                {ranks.map(r => (
                    <div key={r.key} className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                        <div className="text-xs text-slate-400 mb-1">{r.label} (排名)</div>
                        <div className={`text-lg font-bold font-display ${parseFloat(info[r.key]) >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {info[r.key]}% <span className="text-sm text-slate-500 font-normal">({info[r.rank]})</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-slate-800/30 rounded-xl p-4 space-y-3 border border-slate-700/50">
                <h4 className="font-bold text-white border-b border-slate-700 pb-2">基本信息</h4>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div className="text-slate-400">基金全称</div>
                    <div className="text-right text-slate-200">{info.FNAME}</div>
                    
                    <div className="text-slate-400">成立日期</div>
                    <div className="text-right text-slate-200">{info.ESTABDATE}</div>
                    
                    <div className="text-slate-400">基金规模</div>
                    <div className="text-right text-slate-200">{info.ENDNAV}</div>
                    
                    <div className="text-slate-400">基金经理</div>
                    <div className="text-right text-slate-200 text-primary">{info.MANGER?.map((m:any) => m.MANGERNAME).join(', ')}</div>
                </div>
            </div>
            
            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                 <h4 className="font-bold text-white border-b border-slate-700 pb-2 mb-2">投资目标</h4>
                 <p className="text-xs text-slate-400 leading-relaxed max-h-[100px] overflow-y-auto">
                     {info.INVESTMENTTARGET || '暂无描述'}
                 </p>
            </div>
        </div>
    );
};

// --- 主模态框组件 ---
interface FundDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  fundCode: string;
  fundName: string;
}

export default function FundDetailModal({ isOpen, onClose, fundCode, fundName }: FundDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'realtime' | 'history' | 'position' | 'info'>('realtime');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <div 
        className="glass-card w-full sm:max-w-md h-[85vh] sm:h-[800px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white">{fundName}</h3>
            <p className="text-xs text-slate-500 font-mono">{fundCode}</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <Icon name="close" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 shrink-0">
          {[
            { id: 'realtime', label: '净值估值' },
            { id: 'history', label: '历史净值' },
            { id: 'position', label: '持仓明细' },
            { id: 'info', label: '基金概况' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id ? 'text-primary' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {activeTab === 'realtime' && <RealtimeChart code={fundCode} />}
          {activeTab === 'history' && <HistoryChart code={fundCode} />}
          {activeTab === 'position' && <PositionTable code={fundCode} />}
          {activeTab === 'info' && <FundInfoOverview code={fundCode} />}
        </div>
      </div>
    </div>
  );
}