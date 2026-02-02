import React from "react";
import { Icon } from "./ui/Icon";
import Link from "next/link";

interface NavItem {
  icon: string;
  label: string;
  href: string;
  isActive?: boolean;
}

interface BottomNavProps {
  items: NavItem[];
  className?: string;
}

export function BottomNav({ items, className = "" }: BottomNavProps) {
  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 ios-blur bg-background-dark/90 border-t border-white/5 pb-8 pt-2 ${className}`}
    >
      <div className="flex justify-around items-center px-6">
        {items.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className={`flex flex-col items-center gap-1 transition-colors ${
              item.isActive ? "text-primary" : "text-slate-400 hover:text-white"
            }`}
          >
            <Icon
              name={item.icon}
              className="text-[24px]"
              filled={item.isActive} // Optional: fill icon if active
            />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
