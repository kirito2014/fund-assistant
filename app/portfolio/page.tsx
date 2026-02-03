'use client';

import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";
import { BottomNav } from "@/components/BottomNav";

export default function PortfolioPage() {
  const navItems = [
    { label: "首页", icon: "home", href: "/" },
    { label: "持仓", icon: "wallet", href: "/portfolio", isActive: true },
    { label: "自选", icon: "monitoring", href: "/funds" },
    { label: "我的", icon: "person", href: "/profile" },
  ];

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col max-w-[430px] mx-auto overflow-x-hidden shadow-2xl bg-background-light dark:bg-background-dark font-display text-white">
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between border-b border-white/10">
        <div className="flex w-12 items-center justify-start">
        </div>
        <h1 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          持仓管理
        </h1>
        <div className="flex w-12 items-center justify-end gap-2">
          <button className="text-white/70 hover:text-white transition-colors">
            <Icon name="swap_vert" />
          </button>
          <button className="text-white/70 hover:text-white transition-colors">
            <Icon name="filter_list" />
          </button>
        </div>
      </header>

      <main className="flex-1 pb-24">
        {/* Search Bar */}
        <div className="px-4 py-3">
        <label className="flex flex-col h-11 w-full">
          <div className="flex w-full flex-1 items-stretch rounded-xl h-full bg-[#1e2738]/80 border border-white/5">
            <div className="text-[#92a4c9] flex items-center justify-center pl-4">
              <Icon name="search" className="text-[20px]" />
            </div>
            <input
              className="flex w-full min-w-0 flex-1 border-none bg-transparent focus:outline-0 focus:ring-0 text-white placeholder:text-[#92a4c9] px-4 pl-2 text-sm font-normal"
              placeholder="搜索基金名称或代码"
            />
          </div>
        </label>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 px-4 pb-4 overflow-x-auto no-scrollbar">
        <button className="flex h-8 shrink-0 items-center justify-center gap-x-1 rounded-full bg-primary px-4">
          <span className="text-white text-xs font-medium">全部持仓</span>
          <Icon name="keyboard_arrow_down" className="text-[16px]" />
        </button>
        <button className="flex h-8 shrink-0 items-center justify-center gap-x-1 rounded-full bg-white/10 px-4 border border-white/5">
          <span className="text-white/80 text-xs font-medium">股票型</span>
        </button>
        <button className="flex h-8 shrink-0 items-center justify-center gap-x-1 rounded-full bg-white/10 px-4 border border-white/5">
          <span className="text-white/80 text-xs font-medium">混合型</span>
        </button>
        <button className="flex h-8 shrink-0 items-center justify-center gap-x-1 rounded-full bg-white/10 px-4 border border-white/5">
          <span className="text-white/80 text-xs font-medium">指数型</span>
        </button>
      </div>

      {/* Summary Hero Card */}
      <div className="px-4 mb-6">
        <div className="relative overflow-hidden glass-card rounded-2xl p-6 shadow-2xl">
          {/* Background Gradient Decoration */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 blur-3xl rounded-full"></div>
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-primary/10 blur-2xl rounded-full"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[#92a4c9] text-xs font-medium mb-1 flex items-center gap-1">
                  总资产估值 (元)
                  <Icon name="visibility" className="text-[14px] cursor-pointer" />
                </p>
                <h2 className="text-white text-3xl font-bold font-display tracking-tight">
                  ¥458,290.42
                </h2>
              </div>
              <button className="bg-primary/20 text-primary-light text-primary px-3 py-1.5 rounded-lg text-xs font-bold border border-primary/30">
                交易记录
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div>
                <p className="text-[#92a4c9] text-[10px] mb-0.5 uppercase tracking-wider">
                  昨日收益
                </p>
                <p className="text-gain-red text-lg font-bold font-display">
                  +¥1,240.50
                </p>
                <p className="text-gain-red text-[10px] font-medium">+0.27%</p>
              </div>
              <div>
                <p className="text-[#92a4c9] text-[10px] mb-0.5 uppercase tracking-wider">
                  持有收益
                </p>
                <p className="text-gain-red text-lg font-bold font-display">
                  +¥12,845.00
                </p>
                <p className="text-gain-red text-[10px] font-medium">+2.88%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: 定投核心 */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-white text-lg font-bold flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full"></span>
            核心定投组合
          </h3>
          <span className="text-[#92a4c9] text-xs font-medium">
            盈亏 ¥3,420.21
          </span>
        </div>
        <div className="space-y-3">
          {/* Fund Item 1 */}
          <GlassCard className="rounded-xl p-4 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-white text-sm font-bold truncate max-w-[180px]">
                  易方达蓝筹精选混合
                </h4>
                <span className="text-[#92a4c9] text-[10px] font-medium">
                  005827
                </span>
              </div>
              <div className="flex gap-4">
                <div>
                  <p className="text-[#92a4c9] text-[10px]">持仓金额</p>
                  <p className="text-white text-xs font-bold font-display">
                    ¥45,320.00
                  </p>
                </div>
                <div>
                  <p className="text-[#92a4c9] text-[10px]">估值</p>
                  <p className="text-gain-red text-xs font-bold font-display">
                    +0.85%
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[#92a4c9] text-[10px] mb-0.5">持有收益</p>
              <p className="text-gain-red text-sm font-bold font-display">
                +¥842.11
              </p>
            </div>
          </GlassCard>

          {/* Fund Item 2 */}
          <GlassCard className="rounded-xl p-4 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-white text-sm font-bold truncate max-w-[180px]">
                  中欧医疗健康混合A
                </h4>
                <span className="text-[#92a4c9] text-[10px] font-medium">
                  003095
                </span>
              </div>
              <div className="flex gap-4">
                <div>
                  <p className="text-[#92a4c9] text-[10px]">持仓金额</p>
                  <p className="text-white text-xs font-bold font-display">
                    ¥28,450.50
                  </p>
                </div>
                <div>
                  <p className="text-[#92a4c9] text-[10px]">估值</p>
                  <p className="text-loss-green text-xs font-bold font-display">
                    -1.24%
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[#92a4c9] text-[10px] mb-0.5">持有收益</p>
              <p className="text-loss-green text-sm font-bold font-display">
                -¥152.30
              </p>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Section 2: 指数增强 */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-white text-lg font-bold flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full"></span>
            指数增强系列
          </h3>
          <span className="text-[#92a4c9] text-xs font-medium">
            盈亏 ¥1,105.88
          </span>
        </div>
        <div className="space-y-3">
          {/* Fund Item 3 */}
          <GlassCard className="rounded-xl p-4 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-white text-sm font-bold truncate max-w-[180px]">
                  沪深300增强ETF
                </h4>
                <span className="text-[#92a4c9] text-[10px] font-medium">
                  510300
                </span>
              </div>
              <div className="flex gap-4">
                <div>
                  <p className="text-[#92a4c9] text-[10px]">持仓金额</p>
                  <p className="text-white text-xs font-bold font-display">
                    ¥12,450.00
                  </p>
                </div>
                <div>
                  <p className="text-[#92a4c9] text-[10px]">估值</p>
                  <p className="text-gain-red text-xs font-bold font-display">
                    +1.12%
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[#92a4c9] text-[10px] mb-0.5">持有收益</p>
              <p className="text-gain-red text-sm font-bold font-display">
                +¥432.10
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
      </main>

      <BottomNav items={navItems} />
    </div>
  );
}
