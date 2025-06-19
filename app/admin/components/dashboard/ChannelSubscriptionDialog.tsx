/**
 * Channel 訂閱管理對話框
 * 允許用戶選擇要訂閱的 channels
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ChannelType, CHANNEL_CONFIG } from '@/app/types/channel';
import { cn } from '@/lib/utils';

interface ChannelSubscriptionDialogProps {
  open: boolean;
  onClose: () => void;
  subscribedChannels: ChannelType[];
  onUpdate: (channels: ChannelType[]) => void;
}

export function ChannelSubscriptionDialog({
  open,
  onClose,
  subscribedChannels,
  onUpdate
}: ChannelSubscriptionDialogProps) {
  const [selectedChannels, setSelectedChannels] = useState<Set<ChannelType>>(
    new Set(subscribedChannels)
  );
  
  // 當 prop 改變時更新內部狀態
  useEffect(() => {
    setSelectedChannels(new Set(subscribedChannels));
  }, [subscribedChannels]);
  
  // 切換 channel 選擇
  const handleToggleChannel = (channelId: ChannelType) => {
    const newSet = new Set(selectedChannels);
    if (newSet.has(channelId)) {
      newSet.delete(channelId);
    } else {
      newSet.add(channelId);
    }
    setSelectedChannels(newSet);
  };
  
  // 全選/取消全選
  const handleSelectAll = () => {
    if (selectedChannels.size === Object.keys(CHANNEL_CONFIG).length) {
      setSelectedChannels(new Set());
    } else {
      setSelectedChannels(new Set(Object.keys(CHANNEL_CONFIG) as ChannelType[]));
    }
  };
  
  // 保存更改
  const handleSave = () => {
    onUpdate(Array.from(selectedChannels));
  };
  
  // 取消更改
  const handleCancel = () => {
    setSelectedChannels(new Set(subscribedChannels));
    onClose();
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            管理 Dashboard Channels
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            選擇你想要在 Dashboard 中顯示的 channels
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          {/* 全選按鈕 */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
            <Label htmlFor="select-all" className="text-sm font-medium text-slate-300">
              全選 / 取消全選
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300"
            >
              {selectedChannels.size === Object.keys(CHANNEL_CONFIG).length ? '取消全選' : '全選'}
            </Button>
          </div>
          
          {/* Channel 列表 */}
          <div className="space-y-4">
            {Object.values(CHANNEL_CONFIG).map((channel) => {
              const isSelected = selectedChannels.has(channel.id);
              const widgetCount = channel.widgets.length;
              
              return (
                <div
                  key={channel.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-all duration-200",
                    isSelected 
                      ? "bg-slate-800/60 border-orange-500/50" 
                      : "bg-slate-800/30 border-slate-700/50 opacity-60"
                  )}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-2xl">{channel.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-medium text-white">
                          {channel.nameZh}
                        </h3>
                        <span className="text-sm text-slate-500">
                          {channel.name}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">
                        {channel.description}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        包含 {widgetCount} 個工具
                      </p>
                    </div>
                  </div>
                  
                  <Switch
                    checked={isSelected}
                    onCheckedChange={() => handleToggleChannel(channel.id)}
                    className="data-[state=checked]:bg-orange-500"
                  />
                </div>
              );
            })}
          </div>
        </div>
        
        <DialogFooter className="border-t border-slate-700 pt-4">
          <div className="flex items-center justify-between w-full">
            <p className="text-sm text-slate-400">
              已選擇 {selectedChannels.size} 個 channels
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300"
              >
                取消
              </Button>
              <Button
                onClick={handleSave}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                保存更改
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}