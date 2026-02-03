'use client';

import React from "react";
import { Icon } from "./ui/Icon";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  icon: string;
  label: string;
  href: string;
}

interface BottomNavProps {
  items?: NavItem[];
  className?: string;
}

export function BottomNav({ className = "" }: BottomNavProps) {
  // 获取当前路径
  const pathname = usePathname();

  // 固定导航项：行情、自选、主页、持仓、设置
  const navItems = [
    { label: "行情", icon: "trending_up", href: "/market" },
    { label: "自选", icon: "explore", href: "/funds" },
    { label: "主页", icon: "home", href: "/" },
    { label: "持仓", icon: "inventory", href: "/portfolio" },
    { label: "设置", icon: "settings", href: "/profile" },
  ];

  return (
    <nav
      className={`fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50 mx-0 mb-4 glass-header rounded-full px-12 py-2 shadow-xl ${className}`}
      style={{ 
        maxWidth: '90%',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'linear-gradient(135deg, rgba(16, 22, 34, 0.5) 0%, rgba(16, 22, 34, 0.7) 100%)'
      }}
    >
      <div className="flex items-center justify-around w-full gap-8">
        {/* 所有导航按钮，包括主页 */}
        {navItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className={`flex flex-col items-center gap-1 transition-colors ${
              pathname === item.href ? "text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <Icon
              name={item.icon}
              className={`${pathname === item.href ? "text-[24px]" : "text-[20px]"}`}
              filled={pathname === item.href}
            />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
