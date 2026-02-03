import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";
import { BottomNav } from "@/components/BottomNav";

export default function FundsPage() {
  const navItems = [
    { label: "自选", icon: "dashboard", href: "/funds", isActive: true },
    { label: "行情", icon: "query_stats", href: "/market" },
    { label: "资产", icon: "account_balance_wallet", href: "/portfolio" },
    { label: "我的", icon: "person", href: "/profile" },
  ];

  const funds = [
    {
      name: "易方达蓝筹精选混合",
      code: "005827",
      value: "2.4580",
      change: "+1.25%",
      isUp: true,
      icon: "trending_up",
    },
    {
      name: "招商中证白酒指数A",
      code: "161725",
      value: "1.1240",
      change: "-0.84%",
      isUp: false,
      icon: "trending_down",
    },
    {
      name: "华夏见精选混合",
      code: "000011",
      value: "3.0562",
      change: "+0.56%",
      isUp: true,
      icon: "trending_up",
    },
    {
      name: "中欧医疗健康混合C",
      code: "003096",
      value: "1.8940",
      change: "+2.11%",
      isUp: true,
      icon: "monitoring",
    },
    {
      name: "纳斯达克100指数ETF",
      code: "513100",
      value: "0.8920",
      change: "-0.12%",
      isUp: false,
      icon: "trending_down",
    },
  ];

  return (
    <div className="min-h-screen pb-32 bg-mesh text-white">
      {/* Top App Bar */}
      <div className="sticky top-0 glass-header border-b border-white/5">
        <div className="flex items-center p-4 pb-2 justify-between max-w-md mx-auto">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors cursor-pointer">
            <Icon name="search" className="text-white" />
          </div>
          <h2 className="text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center">
            自选基金
          </h2>
          <div className="flex w-10 items-center justify-end">
            <button className="flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-full hover:bg-white/10 transition-colors text-white">
              <Icon name="add" />
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="px-4 max-w-md mx-auto">
          <div className="flex gap-6 overflow-x-auto no-scrollbar">
            {["全部", "指数", "行业", "QDII", "混合型"].map((tab, i) => (
              <a
                key={tab}
                className={`flex flex-col items-center justify-center border-b-2 pb-3 pt-4 shrink-0 transition-colors ${
                  i === 0
                    ? "border-primary text-white"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
                href="#"
              >
                <p className={`text-sm ${i === 0 ? "font-bold" : "font-medium"}`}>
                  {tab}
                </p>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-4 space-y-3">
        {/* Market Summary Card */}
        <GlassCard className="rounded-xl p-4 flex justify-between items-center mb-6" variant="light">
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase mb-1">
              今日预估收益
            </p>
            <h3 className="text-2xl font-bold text-gain-red">+1,248.50</h3>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-xs font-medium uppercase mb-1">
              总持有资产
            </p>
            <p className="text-lg font-bold">¥182,450.00</p>
          </div>
        </GlassCard>

        {/* Section Header */}
        <div className="flex items-center justify-between px-1 py-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            基金列表 (5)
          </span>
          <Icon name="sort" className="text-slate-500 text-sm cursor-pointer" />
        </div>

        {/* Fund List Items */}
        <div className="space-y-3">
          {funds.map((fund, idx) => (
            <GlassCard
              key={idx}
              className="rounded-xl p-4 flex items-center justify-between hover:bg-white/[0.05] transition-all"
              variant="light"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex items-center justify-center rounded-lg shrink-0 size-12 ${
                    fund.isUp
                      ? "bg-gain-red/10 text-gain-red"
                      : "bg-loss-green/10 text-loss-green"
                  }`}
                >
                  <Icon name={fund.icon} />
                </div>
                <div className="flex flex-col">
                  <p className="text-white text-base font-semibold line-clamp-1">
                    {fund.name}
                  </p>
                  <p className="text-slate-400 text-sm font-medium font-mono tracking-tight">
                    {fund.code}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <p className="text-white text-sm font-bold">{fund.value}</p>
                <div
                  className={`px-3 py-1 rounded-lg text-sm font-bold min-w-[70px] text-center ${
                    fund.isUp
                      ? "bg-gain-red/20 text-gain-red"
                      : "bg-loss-green/20 text-loss-green"
                  }`}
                >
                  {fund.change}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Add Fund Button Card */}
        <button className="w-full relative overflow-hidden glass-card rounded-xl p-6 border-dashed border-primary/40 flex flex-col items-center justify-center gap-2 group hover:bg-primary/5 transition-all">
          <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <Icon name="add_circle" className="text-3xl" />
          </div>
          <p className="text-primary font-bold">添加自选基金</p>
          <p className="text-slate-500 text-xs">实时追踪更多基金估值</p>
        </button>
      </main>

      <BottomNav items={navItems} />

      {/* Floating Background Blur Elements */}
      <div className="fixed top-20 right-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      <div className="fixed bottom-20 left-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
    </div>
  );
}
