import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";
import Link from "next/link";

export default function ProfilePage() {
  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col max-w-md mx-auto overflow-x-hidden pb-10 bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white">
      {/* TopAppBar */}
      <div className="sticky top-0 z-50 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between">
        <Link href="/" className="text-slate-900 dark:text-white flex size-12 shrink-0 items-center justify-start cursor-pointer">
          <Icon name="arrow_back_ios" />
        </Link>
        <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          个人中心
        </h2>
        <div className="flex w-12 items-center justify-end">
          <button className="flex size-10 items-center justify-center rounded-full bg-glass-blue text-primary">
            <Icon name="notifications" />
          </button>
        </div>
      </div>

      {/* ProfileHeader */}
      <div className="flex p-4 mt-2">
        <GlassCard className="flex w-full flex-col gap-6 p-6 rounded-xl relative overflow-hidden">
          {/* Background Decoration Glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 blur-3xl rounded-full"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-20 w-20 ring-4 ring-primary/20"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCBqr_qqXwPw4HWruyPHsCyGQyzJ6sGFMv5bAYdmWJMllKMAMTjxFDMFr1CIaj9gKTNvTV_R2fw-3G4lyz-vppK08bhPOT5c7thYwwn2QHjafytSrEsOzuw9Q5m627yeGVnwihl0N4C-_gqordx-DeJ_D0frtOeeEEyB3wgfOz2qU47zx1mnzX7KdtsBEe8nBziY3UOALVzZaPVG4LMtXwMl58xiNRZFDCTiDsYYXSmWN85soyugjJ0rzodPqMkucJyfW8wD_qvCi8")',
              }}
            ></div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <p className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">
                  陈智明
                </p>
                <span className="bg-primary text-[10px] px-2 py-0.5 rounded-full text-white font-bold uppercase tracking-wider">
                  Pro
                </span>
              </div>
              <p className="text-slate-400 text-sm font-normal mt-1">
                基金估值助手专业版
              </p>
              <p className="text-slate-500 text-xs font-normal">UID: 8829341</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex-1 flex cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold tracking-[0.015em] shadow-[0_0_20px_rgba(19,91,236,0.2)]">
              <span>编辑资料</span>
            </button>
            <button className="flex-1 flex cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-white/5 border border-white/10 text-white text-sm font-bold">
              <span>账户安全</span>
            </button>
          </div>
        </GlassCard>
      </div>

      {/* Data Sync Section */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-slate-900 dark:text-white text-lg font-bold">
            数据云同步
          </h3>
          <span className="text-primary text-xs font-medium">已连接</span>
        </div>
        <GlassCard className="rounded-xl p-4 mb-4">
          <div className="flex items-stretch justify-between gap-4">
            <div className="flex flex-[2_2_0px] flex-col justify-between py-1">
              <div className="flex flex-col gap-1">
                <p className="text-white text-base font-bold leading-tight">
                  云端同步状态
                </p>
                <p className="text-slate-400 text-sm font-normal">
                  上次同步: 2023-11-20 09:15
                </p>
              </div>
              <button className="mt-4 flex items-center justify-center rounded-lg h-9 px-4 bg-primary text-white gap-2 text-sm font-bold w-fit shadow-lg shadow-primary/20">
                <Icon name="sync" className="text-[18px]" />
                <span className="truncate">立即同步</span>
              </button>
            </div>
            <div className="w-32 bg-center bg-no-repeat aspect-square bg-cover rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <Icon name="cloud_done" className="text-primary text-5xl" />
            </div>
          </div>
        </GlassCard>
        <div className="space-y-1">
          <div className="flex items-center gap-4 bg-white/5 dark:bg-white/5 px-4 h-14 rounded-lg border border-white/5">
            <div className="text-primary flex items-center justify-center rounded-lg bg-primary/20 shrink-0 size-10">
              <Icon name="upload_file" />
            </div>
            <p className="text-slate-900 dark:text-white text-sm font-medium flex-1">
              上传估值数据至云端
            </p>
            <Icon name="chevron_right" className="text-slate-500 text-sm" />
          </div>
          <div className="flex items-center gap-4 bg-white/5 dark:bg-white/5 px-4 h-14 rounded-lg border border-white/5">
            <div className="text-primary flex items-center justify-center rounded-lg bg-primary/20 shrink-0 size-10">
              <Icon name="download_for_offline" />
            </div>
            <p className="text-slate-900 dark:text-white text-sm font-medium flex-1">
              从云端下载备份
            </p>
            <Icon name="chevron_right" className="text-slate-500 text-sm" />
          </div>
        </div>
      </div>

      {/* AI Configuration Section */}
      <div className="px-4 py-4">
        <h3 className="text-slate-900 dark:text-white text-lg font-bold mb-3 px-1">
          AI 模型配置
        </h3>
        <GlassCard className="rounded-xl overflow-hidden divide-y divide-white/5">
          {/* ListItem with Toggle */}
          <div className="flex items-center gap-4 px-4 h-16 justify-between">
            <div className="flex items-center gap-4">
              <div className="text-white flex items-center justify-center rounded-lg bg-primary/30 shrink-0 size-10">
                <Icon name="psychology" />
              </div>
              <div>
                <p className="text-white text-sm font-medium leading-tight">
                  高精度估值模式
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  提高模型采样频率，增强预测准确性
                </p>
              </div>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
              <div className="w-11 h-6 bg-primary rounded-full ring-2 ring-primary/20"></div>
              <div className="absolute left-6 top-1 bg-white w-4 h-4 rounded-full transition shadow-md"></div>
            </div>
          </div>
          {/* ListItem with Select */}
          <div className="flex items-center gap-4 px-4 h-16 justify-between">
            <div className="flex items-center gap-4">
              <div className="text-white flex items-center justify-center rounded-lg bg-primary/30 shrink-0 size-10">
                <Icon name="analytics" />
              </div>
              <p className="text-white text-sm font-medium">估值逻辑偏好</p>
            </div>
            <div className="flex items-center gap-1 text-primary text-sm font-bold">
              <span>价值导向</span>
              <Icon name="expand_more" className="text-[16px]" />
            </div>
          </div>
          {/* ListItem with Toggle */}
          <div className="flex items-center gap-4 px-4 h-16 justify-between">
            <div className="flex items-center gap-4">
              <div className="text-white flex items-center justify-center rounded-lg bg-primary/30 shrink-0 size-10">
                <Icon name="bolt" />
              </div>
              <p className="text-white text-sm font-medium">实时预测开关</p>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
              <div className="w-11 h-6 bg-slate-700 rounded-full"></div>
              <div className="absolute left-1 top-1 bg-slate-400 w-4 h-4 rounded-full transition shadow-md"></div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* General App Preferences */}
      <div className="px-4 py-4">
        <h3 className="text-slate-900 dark:text-white text-lg font-bold mb-3 px-1">
          通用设置
        </h3>
        <GlassCard className="rounded-xl overflow-hidden divide-y divide-white/5">
          {[
            { icon: "notifications_active", label: "消息通知", val: null },
            { icon: "language", label: "多语言 (Language)", val: "简体中文" },
            { icon: "shield", label: "隐私政策", val: null },
            {
              icon: "delete_sweep",
              label: "清除缓存",
              val: "128 MB",
              iconClass: "text-red-400/80",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-4 h-14 justify-between group cursor-pointer hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <Icon
                  name={item.icon}
                  className={item.iconClass || "text-slate-400"}
                />
                <p className="text-white text-sm font-medium">{item.label}</p>
              </div>
              {item.val ? (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs">{item.val}</span>
                  {item.val === "简体中文" && (
                    <Icon
                      name="chevron_right"
                      className="text-slate-500 text-[20px]"
                    />
                  )}
                </div>
              ) : (
                <Icon
                  name="chevron_right"
                  className="text-slate-500 text-[20px]"
                />
              )}
            </div>
          ))}
        </GlassCard>
      </div>

      {/* Logout Button */}
      <div className="px-4 py-6">
        <button className="w-full flex items-center justify-center rounded-xl h-14 bg-red-500/10 border border-red-500/20 text-red-500 text-base font-bold transition hover:bg-red-500/20">
          退出登录
        </button>
        <p className="text-center text-slate-600 text-[10px] mt-4 uppercase tracking-[0.2em]">
          FundValuation Assistant v2.4.0
        </p>
      </div>
    </div>
  );
}
