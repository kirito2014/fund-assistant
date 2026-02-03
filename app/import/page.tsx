import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";
import Link from "next/link";

export default function ImportPage() {
  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col max-w-[480px] mx-auto overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between">
        <Link href="/" className="text-white flex size-12 shrink-0 items-center cursor-pointer">
          <Icon name="arrow_back_ios" className="text-slate-900 dark:text-white" />
        </Link>
        <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          批量同步持仓
        </h2>
        <div className="flex w-12 items-center justify-end">
          <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 bg-transparent text-slate-900 dark:text-white gap-2 text-base font-bold leading-normal tracking-[0.015em] min-w-0 p-0">
            <Icon name="help" />
          </button>
        </div>
      </div>

      <div className="px-4">
        {/* Headline Section */}
        <div className="pt-6">
          <h3 className="text-slate-900 dark:text-white tracking-light text-2xl font-bold leading-tight text-center pb-2">
            上传截图，智能识别持仓
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal text-center">
            支持主流券商及基金平台持仓页面截图
          </p>
        </div>

        {/* Upload Zone / Progress Section */}
        <div className="mt-8 mb-6 relative">
          <GlassCard className="rounded-xl overflow-hidden p-6 flex flex-col items-center justify-center min-h-[220px] border-dashed border-2 border-primary/30" variant="light">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Icon name="add_photo_alternate" className="text-primary text-4xl" />
              </div>
              <div className="flex px-4 py-3 justify-center">
                <button className="flex min-w-[140px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-6 bg-primary text-white gap-2 text-base font-bold shadow-lg shadow-primary/20">
                  <Icon name="image" />
                  <span className="truncate">选择持仓截图</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                单次最多可识别 20 只基金
              </p>
            </div>
          </GlassCard>
        </div>

        {/* AI Processing State (Mockup) */}
        <GlassCard className="rounded-xl p-4 mb-6" variant="light">
          <div className="flex flex-col gap-3">
            <div className="flex gap-6 justify-between items-end">
              <div className="flex items-center gap-2">
                <Icon name="psychology" className="text-primary animate-pulse" />
                <p className="text-slate-900 dark:text-white text-base font-medium leading-normal">
                  AI 智能识别中...
                </p>
              </div>
              <p className="text-primary text-sm font-bold leading-normal">78%</p>
            </div>
            <div className="rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: "78%" }}
              ></div>
            </div>
            <p className="text-slate-500 dark:text-[#92a4c9] text-xs font-normal leading-normal">
              正在提取：易方达蓝筹精选 (005827) 的持仓份额
            </p>
          </div>
        </GlassCard>

        {/* Result List */}
        <div className="flex flex-col gap-3 pb-32">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-slate-900 dark:text-white font-bold text-lg">
              识别结果 (3)
            </h4>
            <span className="text-primary text-sm font-medium">全部确认</span>
          </div>

          {/* Fund Item 1 */}
          <GlassCard className="rounded-xl p-4 flex items-center justify-between border-l-4 border-l-primary" variant="light">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-slate-900 dark:text-white font-bold">
                  易方达蓝筹精选混合
                </span>
                <span className="text-xs px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded">
                  005827
                </span>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase">
                    持仓份额
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    1,245.82
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase">
                    现价估值
                  </span>
                  <span className="text-sm font-bold text-emerald-500">
                    2.1480
                  </span>
                </div>
              </div>
            </div>
            <button className="bg-primary h-8 px-4 rounded-lg text-xs font-bold text-white">
              确认
            </button>
          </GlassCard>

          {/* Fund Item 2 */}
          <GlassCard className="rounded-xl p-4 flex items-center justify-between border-l-4 border-l-primary" variant="light">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-slate-900 dark:text-white font-bold">
                  中欧医疗健康混合A
                </span>
                <span className="text-xs px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded">
                  003095
                </span>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase">
                    持仓份额
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    3,500.00
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase">
                    现价估值
                  </span>
                  <span className="text-sm font-bold text-rose-500">
                    1.8420
                  </span>
                </div>
              </div>
            </div>
            <button className="bg-primary h-8 px-4 rounded-lg text-xs font-bold text-white">
              确认
            </button>
          </GlassCard>

          {/* Fund Item 3 (Incomplete) */}
          <GlassCard className="rounded-xl p-4 flex items-center justify-between border-l-4 border-l-amber-500" variant="light">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-amber-500">
                <Icon name="warning" className="text-sm" />
                <span className="text-slate-900 dark:text-white font-bold">
                  华夏见解指数联接
                </span>
                <span className="text-xs px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded">
                  识别不全
                </span>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase">
                    持仓份额
                  </span>
                  <span className="text-sm font-bold text-slate-400">
                    点击完善
                  </span>
                </div>
              </div>
            </div>
            <button className="bg-slate-700 h-8 px-4 rounded-lg text-xs font-bold text-white">
              修改
            </button>
          </GlassCard>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-4 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800">
        <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-xl shadow-primary/30 flex items-center justify-center gap-2">
          <Icon name="sync" />
          <span>确认并批量同步至持仓</span>
        </button>
        <div className="mt-2 text-center">
          <p className="text-[10px] text-slate-500">
            同步后可在“我的资产”中查看实时估值波动
          </p>
        </div>
      </div>
      {/* Spacer for safe area */}
      <div className="h-8"></div>
    </div>
  );
}
