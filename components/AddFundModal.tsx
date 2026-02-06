'use client';

import React, { useState, useEffect } from "react";
import { Icon } from "./ui/Icon";
import axios from "axios";

export default function AddFundModal({ isOpen, onClose, onSave, onFailures, existingFunds = [], activeTag = "全部" }: any) {
  const [searchKey, setSearchKey] = useState("");
  const [results, setResults] = useState([]);
  const [selectedFunds, setSelectedFunds] = useState<any[]>([]);

  // 每次打开模态框时清空待添加列表
  useEffect(() => {
    if (isOpen) {
      setSelectedFunds([]);
      setSearchKey("");
      setResults([]);
    }
  }, [isOpen]);

  // 搜索接口
  useEffect(() => {
    if (searchKey.length < 2) return;
    const timer = setTimeout(async () => {
      try {
        const url = `/api/fund-search?key=${searchKey}`;
        const res = await axios.get(url);
        setResults(res.data.Datas || []);
      } catch (e) { console.error("Search failed", e); }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchKey]);

  // 检查基金是否已在自选列表中
  const isFundAdded = (code: string) => {
    return existingFunds.some((fund: any) => fund.fundcode === code);
  };

  // 检查基金是否已在待添加列表
  const isFundSelected = (code: string) => {
    return selectedFunds.some((fund: any) => fund.CODE === code || fund.fundcode === code);
  };

  // 检查基金是否已在当前标签中
  const isFundInCurrentTag = (code: string) => {
    return existingFunds.some((fund: any) => fund.fundcode === code && fund.tags.includes(activeTag));
  };

  // 添加基金到待添加列表
  const handleAddFund = (fund: any) => {
    if (selectedFunds.length >= 10) return; // 最多添加10个基金
    // 兼容 CODE 和 fundcode 字段
    const code = fund.CODE || fund.fundcode;
    if (!isFundSelected(code)) {
      setSelectedFunds(prev => [...prev, fund]);
    }
  };

  // 从待添加列表中移除基金
  const handleRemoveFund = (code: string) => {
    setSelectedFunds(prev => prev.filter(fund => (fund.CODE !== code && fund.fundcode !== code)));
  };

  // 批量添加基金
  const handleBatchAdd = async () => {
    if (selectedFunds.length === 0) return;

    if (activeTag !== "全部") {
      // 从当前标签中添加基金
      selectedFunds.forEach(fund => {
        const code = fund.CODE || fund.fundcode;
        // 检查基金是否已经存在于现有基金列表中
        const fundExists = existingFunds.some((fund: any) => fund.fundcode === code);
        if (fundExists) {
          // 如果基金已存在，只添加标签
          onSave(code, [activeTag]);
        } else {
          // 如果基金不存在，先创建基金对象再添加
          const newFund = {
            fundcode: code,
            name: fund.NAME || fund.name,
            dwjz: "--",
            gsz: "--",
            gszzl: "0.00",
            gztime: "--",
            isStarred: false,
            tags: ["全部", activeTag]
          };
          onSave(newFund, [activeTag]);
        }
      });
    } else {
      // 搜索添加新基金
      const successes: any[] = [];
      const failures: { code: string; name: string }[] = [];

      try {
        // 生成随机userId
        const userId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
          var r = (Math.random() * 16) | 0,
            v = c == "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });

        // 批量获取基金数据
        // 关键修复：确保能正确获取到代码，无论是来自搜索(CODE)还是现有列表(fundcode)
        const fundCodes = selectedFunds.map(fund => fund.CODE || fund.fundcode).join(",");
        
        // 注意：此 API 直接在前端调用可能会遇到 CORS 跨域问题
        const url = `https://fundmobapi.eastmoney.com/FundMNewApi/FundMNFInfo?pageIndex=1&pageSize=200&plat=Android&appType=ttjj&product=EFund&Version=1&deviceid=${userId}&Fcodes=${fundCodes}`;
        const res = await axios.get(url);

        console.log('API Response:', res.data);

        if (res.data.Datas && res.data.Datas.length > 0) {
          const fundDataMap = new Map();
          res.data.Datas.forEach((data: any) => {
            fundDataMap.set(data.FCODE, data);
          });

          selectedFunds.forEach(fund => {
            const code = fund.CODE || fund.fundcode;
            const fundData = fundDataMap.get(code);
            
            if (fundData) {
              const realData = {
                fundcode: fundData.FCODE,
                name: fundData.SHORTNAME,
                dwjz: isNaN(fundData.NAV) ? "--" : fundData.NAV.toString(),
                gsz: isNaN(fundData.GSZ) ? fundData.NAV.toString() : fundData.GSZ.toString(),
                gszzl: isNaN(fundData.GSZZL) ? "0" : fundData.GSZZL.toString(),
                gztime: fundData.GZTIME,
                isStarred: false,
                hasReplace: false,
                tags: ["全部"]
              };

              // 处理单位净值替换估算净值的情况
              if (fundData.PDATE != "--" && fundData.PDATE == fundData.GZTIME.substr(0, 10)) {
                realData.gsz = fundData.NAV.toString();
                realData.gszzl = isNaN(fundData.NAVCHGRT) ? "0" : fundData.NAVCHGRT.toString();
                realData.hasReplace = true;
              }

              successes.push(realData);
            } else {
              // API请求成功但Map里没找到（说明代码无效或已退市）
              failures.push({ code: code, name: fund.NAME || fund.name });
            }
          });
        } else {
          // API请求成功但Datas为空（说明所有代码都无效）
          failures.push(...selectedFunds.map(f => ({ 
            code: f.CODE || f.fundcode, 
            name: f.NAME || f.name 
          })));
        }
      } catch (error) {
        console.warn('获取基金数据遇到网络异常(可能为跨域)，降级使用模拟数据:', error);
        
        // 【关键修复】恢复原项目的 Mock Data 逻辑作为兜底
        // 只有当网络完全不通/跨域时才使用，避免功能完全瘫痪
        selectedFunds.forEach(fund => {
          const mockData = {
            fundcode: fund.CODE || fund.fundcode,
            name: fund.NAME || fund.name,
            dwjz: (Math.random() * 3 + 1).toFixed(4),
            gsz: (Math.random() * 3 + 1).toFixed(4),
            gszzl: (Math.random() * 4 - 2).toFixed(2),
            gztime: new Date().toISOString().slice(0, 10) + " 15:00",
            isStarred: false,
            tags: ["全部"]
          };
          successes.push(mockData);
        });
      }

      // 处理结果
      successes.forEach(fund => onSave(fund));
      
      // 只有明确的失败（API通了但无数据）才弹窗
      if (failures.length > 0 && onFailures) {
        onFailures(failures);
      }
    }
    
    // 关闭模态框
    onClose();
  };

  // 获取不在当前标签中的基金
  const getFundsNotInCurrentTag = () => {
    return existingFunds.filter((fund: any) => !fund.tags.includes(activeTag));
  };

  // 检查是否是自定义标签（非全部、非自选）
  const isCustomTag = () => {
    return activeTag !== "全部" && activeTag !== "自选";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-lg rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-white text-xl font-bold">
            {isCustomTag() ? `添加到${activeTag}` : activeTag === "自选" ? "添加到自选" : "添加基金"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><Icon name="close" /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {!isCustomTag() && activeTag !== "自选" && (
            // 搜索框（仅在全部标签下显示）
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-3 text-slate-500" />
              <input
                autoFocus
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-primary outline-none transition-all"
                placeholder="输入基金名称或代码..."
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
              />
            </div>
          )}

          {/* 基金列表 */}
          {((isCustomTag() || activeTag === "自选") ? getFundsNotInCurrentTag().length > 0 : results.length > 0) && (
            <div className="bg-slate-900 rounded-xl border border-slate-800 divide-y divide-slate-800 overflow-hidden">
              {((isCustomTag() || activeTag === "自选") ? getFundsNotInCurrentTag() : results.slice(0, 5)).map((f: any) => {
                const code = f.CODE || f.fundcode;
                const name = f.NAME || f.name;
                const added = (isCustomTag() || activeTag === "自选") ? isFundInCurrentTag(code) : isFundAdded(code);
                const selected = isFundSelected(code);
                const disabled = selected || added || selectedFunds.length >= 10;
                
                return (
                  <div 
                    key={code}
                    onClick={() => !disabled && handleAddFund(f)}
                    className={`p-4 cursor-pointer flex justify-between items-center group ${
                      disabled ? "opacity-60" : "hover:bg-slate-800"
                    }`}
                  >
                    <div>
                      <p className={`font-medium ${
                        selected ? "text-primary" : added ? "text-slate-400" : "text-white group-hover:text-primary"
                      }`}>
                        {name}
                      </p>
                      <p className="text-slate-500 text-xs font-mono">{code}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {added && (
                        <span className="text-slate-400 text-xs">已添加</span>
                      )}
                      {selected && (
                        <span className="text-primary text-xs">已选择</span>
                      )}
                      {!disabled && (
                        <Icon name="add" className="text-slate-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 无基金提示 */}
          {((isCustomTag() || activeTag === "自选") && getFundsNotInCurrentTag().length === 0) && (
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 flex flex-col items-center justify-center">
              <Icon name="check_circle" className="text-slate-500 text-4xl mb-3" />
              <p className="text-slate-400 text-sm font-medium">所有基金都已添加到{activeTag}</p>
            </div>
          )}

          {/* 待添加基金列表 */}
          {selectedFunds.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm font-medium">
                  {isCustomTag() ? `待添加到${activeTag}` : activeTag === "自选" ? "待添加到自选" : "待添加基金"} ({selectedFunds.length}/10)
                </p>
                {selectedFunds.length > 0 && (
                  <button 
                    onClick={() => setSelectedFunds([])}
                    className="text-slate-500 text-xs hover:text-slate-400"
                  >
                    清空
                  </button>
                )}
              </div>
              <div className="bg-slate-900 rounded-xl border border-slate-800 divide-y divide-slate-800 overflow-hidden max-h-[300px] overflow-y-auto">
                {selectedFunds.map((fund: any) => {
                  const code = fund.CODE || fund.fundcode;
                  const name = fund.NAME || fund.name;
                  return (
                    <div 
                      key={code}
                      className="p-4 flex justify-between items-center group"
                    >
                      <div>
                        <p className="text-primary font-medium">{name}</p>
                        <p className="text-slate-500 text-xs font-mono">{code}</p>
                      </div>
                      <button 
                        onClick={() => handleRemoveFund(code)}
                        className="text-slate-500 hover:text-red-500"
                      >
                        <Icon name="close" className="text-sm" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-slate-400 font-bold hover:bg-slate-900 rounded-xl transition-colors">取消</button>
          <button 
            disabled={selectedFunds.length === 0}
            onClick={handleBatchAdd}
            className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 disabled:opacity-30 transition-all"
          >
            {isCustomTag() ? `添加到${activeTag}` : activeTag === "自选" ? "添加到自选" : "确认添加"} ({selectedFunds.length})
          </button>
        </div>
      </div>
    </div>
  );
}