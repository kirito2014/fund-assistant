'use client';

import React from "react";
import { Icon } from "./ui/Icon";

interface AddResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  failures: { code: string; name: string }[];
}

export default function AddResultModal({ isOpen, onClose, failures }: AddResultModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-sm rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-2">
             <Icon name="error" className="text-red-500" />
             <h3 className="text-lg font-bold text-white">部分添加失败</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <Icon name="close" />
          </button>
        </div>

        <div className="p-6 bg-slate-900/30">
          <p className="text-slate-400 text-sm mb-4">以下基金未获取到估值数据，请稍后重试：</p>
          <div className="bg-slate-950/50 rounded-xl border border-slate-800 divide-y divide-slate-800 max-h-[200px] overflow-y-auto">
            {failures.map((item, idx) => (
              <div key={idx} className="p-3 flex justify-between items-center hover:bg-white/5 transition-colors">
                 <span className="text-slate-200 text-sm font-medium truncate max-w-[180px]">{item.name || '未知名称'}</span>
                 <span className="text-slate-500 text-xs font-mono bg-slate-800 px-1.5 py-0.5 rounded">#{item.code}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all active:scale-95"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
}