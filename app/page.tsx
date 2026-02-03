import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";
import { BottomNav } from "@/components/BottomNav";

export default function Home() {
  return (
    <main className="min-h-screen pb-24 relative overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 glass-header">
        <div className="flex items-center p-4 justify-center max-w-md mx-auto">
          <div className="flex flex-col items-center">
            <h2 className="text-white text-lg font-bold leading-tight tracking-tight">
              基金估值助手
            </h2>
            <p className="text-[10px] text-slate-400">最后更新 14:30:05</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {/* Index Valuation Grid Section */}
        <div className="px-4 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-lg font-bold tracking-tight">
              市场指数估值
            </h3>
            <span className="text-primary text-xs font-medium">查看全部</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Card 1 */}
            <GlassCard variant="blue" className="p-4 rounded-xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm font-medium">沪深300</span>
                <span className="bg-green-500/20 text-loss-green text-[10px] px-1.5 py-0.5 rounded">
                  低估
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-white text-xl font-bold">3,852.12</span>
                <span className="text-gain-red text-xs font-medium">+0.52%</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                <div className="bg-gain-red h-full w-[25%]"></div>
              </div>
            </GlassCard>

            {/* Card 2 */}
            <GlassCard variant="blue" className="p-4 rounded-xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm font-medium">中证500</span>
                <span className="bg-yellow-500/20 text-yellow-400 text-[10px] px-1.5 py-0.5 rounded">
                  正常
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-white text-xl font-bold">5,410.45</span>
                <span className="text-loss-green text-xs font-medium">-0.12%</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                <div className="bg-yellow-500 h-full w-[52%]"></div>
              </div>
            </GlassCard>

            {/* Card 3 */}
            <GlassCard variant="blue" className="p-4 rounded-xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm font-medium">创业板指</span>
                <span className="bg-red-500/20 text-gain-red text-[10px] px-1.5 py-0.5 rounded">
                  高估
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-white text-xl font-bold">1,782.30</span>
                <span className="text-gain-red text-xs font-medium">+1.24%</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                <div className="bg-gain-red h-full w-[85%]"></div>
              </div>
            </GlassCard>

            {/* Card 4 */}
            <GlassCard variant="blue" className="p-4 rounded-xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm font-medium">恒生指数</span>
                <span className="bg-green-500/30 text-green-300 text-[10px] px-1.5 py-0.5 rounded">
                  极低估
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-white text-xl font-bold">16,720.5</span>
                <span className="text-loss-green text-xs font-medium">-0.45%</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                <div className="bg-loss-green h-full w-[12%]"></div>
              </div>
            </GlassCard>
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
              </div>
              <p className="text-slate-400 text-sm">今日预计收益</p>
              <div className="flex items-baseline gap-2">
                <h4 className="text-gain-red text-4xl font-bold">1,280.50</h4>
                <span className="text-gain-red font-bold text-lg">+1.82%</span>
              </div>
              <button className="mt-4 flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold w-fit shadow-lg shadow-primary/20">
                <span>收益详情</span>
                <Icon name="chevron_right" className="text-sm" />
              </button>
            </div>
            <div className="z-10 bg-white/5 p-4 rounded-3xl backdrop-blur-md border border-white/10">
              <span aria-label="Happy Emoji" className="text-6xl" role="img">
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
      </div>
      <BottomNav />
    </main>
  );
}
