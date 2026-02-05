'use client';

import React, { useState, useEffect } from "react";
import { Icon } from "./ui/Icon";

export default function TagManagementModal({ isOpen, onClose, existingTags = [], onSave }: any) {
  const [tags, setTags] = useState<any[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState("");

  // 初始化标签列表，过滤掉自选标签
  useEffect(() => {
    if (isOpen) {
      const filteredTags = existingTags.filter((tag: string) => tag !== "全部" && tag !== "自选");
      setTags(filteredTags.map((tag: string) => ({ name: tag, originalName: tag })));
      setNewTagName("");
      setEditingTag(null);
      setEditingTagName("");
    }
  }, [isOpen, existingTags]);

  // 添加新标签
  const handleAddTag = () => {
    if (newTagName.trim() && !tags.some(tag => tag.name === newTagName.trim())) {
      setTags(prev => [...prev, { name: newTagName.trim(), originalName: newTagName.trim() }]);
      setNewTagName("");
    }
  };

  // 开始编辑标签
  const handleStartEdit = (tag: any) => {
    setEditingTag(tag.name);
    setEditingTagName(tag.name);
  };

  // 保存编辑的标签
  const handleSaveEdit = () => {
    if (editingTagName.trim() && editingTagName.trim() !== editingTag) {
      setTags(prev => prev.map(tag => {
        if (tag.name === editingTag) {
          return { ...tag, name: editingTagName.trim() };
        }
        return tag;
      }));
      setEditingTag(null);
      setEditingTagName("");
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingTag(null);
    setEditingTagName("");
  };

  // 删除标签
  const handleDeleteTag = (tagName: string) => {
    setTags(prev => prev.filter(tag => tag.name !== tagName));
  };

  // 保存所有标签变更
  const handleSaveAll = () => {
    const originalTags = tags.map(tag => tag.originalName);
    const updatedTags = tags.map(tag => tag.name);
    onSave(originalTags, updatedTags);
    onClose();
  };

  if (!isOpen) return null;

  const hasCustomTags = tags.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-lg rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-white text-xl font-bold">标签管理</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><Icon name="close" /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* 无自建标签提示 */}
          {!hasCustomTags && (
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 flex flex-col items-center justify-center">
              <Icon name="label" className="text-slate-500 text-4xl mb-3" />
              <p className="text-slate-400 text-sm font-medium mb-4">暂无自建标签，点击下方按钮添加</p>
            </div>
          )}

          {/* 标签列表 */}
          {hasCustomTags && (
            <div className="space-y-4">
              <p className="text-slate-400 text-sm font-medium">自建标签</p>
              <div className="space-y-3">
                {tags.map((tag, index) => (
                  <div key={tag.name} className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                    {editingTag === tag.name ? (
                      <div className="flex items-center gap-3">
                        <input
                          autoFocus
                          className="flex-1 bg-slate-800 border border-primary rounded-lg px-3 py-2 text-white focus:outline-none"
                          value={editingTagName}
                          onChange={(e) => setEditingTagName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={handleSaveEdit}
                            className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-medium"
                          >
                            保存
                          </button>
                          <button 
                            onClick={handleCancelEdit}
                            className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                          <p className="text-white font-medium">{tag.name}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleStartEdit(tag)}
                            className="text-slate-400 hover:text-primary"
                          >
                            <Icon name="edit" className="text-sm" />
                          </button>
                          <button 
                            onClick={() => handleDeleteTag(tag.name)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <Icon name="delete" className="text-sm" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 添加新标签 */}
          <div className="space-y-3">
            <p className="text-slate-400 text-sm font-medium">添加新标签</p>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-primary outline-none"
                placeholder="输入标签名称..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <button 
                onClick={handleAddTag}
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap"
              >
                添加
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-slate-400 font-bold hover:bg-slate-900 rounded-xl transition-colors">取消</button>
          <button 
            onClick={handleSaveAll}
            className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all"
          >
            保存更改
          </button>
        </div>
      </div>
    </div>
  );
}
