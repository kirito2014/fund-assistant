import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";
import { BottomNav } from "@/components/BottomNav";
import Link from "next/link";

export default function MarketPage() {
  const navItems = [
    { label: "行情", icon: "dashboard", href: "/market", isActive: true },
    { label: "估值", icon: "analytics", href: "/" },
    { label: "资产", icon: "account_balance_wallet", href: "/portfolio" },
    { label: "我的", icon: "person", href: "/profile" },
  ];

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col max-w-[430px] mx-auto overflow-x-hidden shadow-2xl bg-background-light dark:bg-background-dark font-display text-white">
      {/* TopAppBar */}
      <header className="sticky top-0 z-50 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between border-b border-white/10">
        <Link href="/" className="text-white flex size-12 shrink-0 items-center cursor-pointer">
          <Icon name="chevron_left" />
        </Link>
        <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          大盘行情分布
        </h2>
        <div className="flex w-12 items-center justify-end">
          <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 bg-transparent text-white gap-2 text-base font-bold leading-normal tracking-[0.015em] min-w-0 p-0">
            <Icon name="refresh" />
          </button>
        </div>
      </header>

      <main className="flex-1 pb-24">
        {/* Market Indices Grid */}
        <section className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                name: "上证指数",
                val: "3050.12",
                change: "+0.45%",
                isUp: true,
                status: "高估",
                statusColor: "text-gain-red bg-gain-red/20",
              },
              {
                name: "深证成指",
                val: "10020.45",
                change: "-0.12%",
                isUp: false,
                status: "适中",
                statusColor: "text-primary bg-primary/20",
              },
              {
                name: "创业板指",
                val: "1850.32",
                change: "+1.20%",
                isUp: true,
                status: "极低",
                statusColor: "text-loss-green bg-loss-green/20",
              },
              {
                name: "沪深300",
                val: "3540.10",
                change: "+0.30%",
                isUp: true,
                status: "适中",
                statusColor: "text-primary bg-primary/20",
              },
            ].map((item, i) => (
              <GlassCard key={i} className="p-4 rounded-xl flex flex-col gap-2">
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
            ))}
          </div>
        </section>

        {/* Chart Distribution Section */}
        <section className="mt-4 px-4">
          <GlassCard className="p-5 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white text-lg font-bold">基金涨跌分布</h3>
              <span className="text-white/40 text-xs">更新于 14:30:00</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end mb-2">
                <div className="flex flex-col">
                  <span className="text-gain-red text-2xl font-bold tracking-tight">
                    2,840
                  </span>
                  <span className="text-white/50 text-xs">上涨家数</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-loss-green text-2xl font-bold tracking-tight">
                    1,560
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

        {/* Capital Flow Section */}
        <section className="mt-6 px-4">
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
              </div>
            </div>
            <div className="space-y-6">
              {/* Northbound Flow */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/70">主力资金净流入</span>
                  <span className="text-gain-red font-bold">+128.45 亿</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: "65%" }}
                  ></div>
                </div>
              </div>
              {/* Southbound Flow */}
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
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <p className="text-white/40 text-[10px] uppercase font-bold">
                  成交额
                </p>
                <p className="text-lg font-bold mt-1">9,240.2亿</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <p className="text-white/40 text-[10px] uppercase font-bold">
                  换手率
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
