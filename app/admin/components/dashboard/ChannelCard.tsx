/**
 * Channel 卡片組件
 * 顯示 channel 摘要信息，支援展開查看詳細 widgets
 */

'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Channel, ChannelType, getChannelWidgets, getWidgetDisplayMode, WIDGET_DISPLAY_CONFIG } from '@/app/types/channel';
import { WidgetType } from '@/app/types/dashboard';
import { WidgetRegistry } from './WidgetRegistry';
import { cn } from '@/lib/utils';

interface ChannelCardProps {
  channel: Channel;
  isSubscribed: boolean;
  isExpanded?: boolean;
  onToggleExpanded?: (channelId: ChannelType) => void;
  onToggleSubscribe?: (channelId: ChannelType) => void;
  widgetData?: Record<WidgetType, any>;  // Widget 數據
  isLoading?: boolean;
}

export function ChannelCard({
  channel,
  isSubscribed,
  isExpanded = false,
  onToggleExpanded,
  onToggleSubscribe,
  widgetData = {} as Record<WidgetType, any>,
  isLoading = false
}: ChannelCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // 獲取 channel 的主要指標
  const getChannelSummary = useCallback(() => {
    const widgets = getChannelWidgets(channel.id);
    let summary = '';
    
    // 根據不同 channel 顯示不同的摘要
    switch (channel.id) {
      case ChannelType.PRODUCTION_MONITORING:
        const outputData = widgetData[WidgetType.OUTPUT_STATS];
        if (outputData) {
          summary = `今日生產: ${outputData.todayCount || 0} 件`;
        }
        break;
        
      case ChannelType.WAREHOUSE_MONITORING:
        const transferData = widgetData[WidgetType.BOOKED_OUT_STATS];
        if (transferData) {
          summary = `今日轉移: ${transferData.todayCount || 0} 次`;
        }
        break;
        
      case ChannelType.INVENTORY_MONITORING:
        const inventoryData = widgetData[WidgetType.PRODUCT_MIX_CHART];
        if (inventoryData) {
          summary = `庫存使用率: ${inventoryData.utilizationRate || 0}%`;
        }
        break;
        
      case ChannelType.SYSTEM_TOOLS:
        const activityData = widgetData[WidgetType.RECENT_ACTIVITY];
        if (activityData) {
          summary = `${activityData.activeUsers || 0} 位活躍用戶`;
        }
        break;
        
      default:
        summary = `${widgets.length} 個工具`;
    }
    
    return summary;
  }, [channel, widgetData]);
  
  // 渲染 widget 網格
  const renderWidgetGrid = () => {
    const widgets = getChannelWidgets(channel.id);
    
    return (
      <div className="widget-grid mt-4">
        {widgets.map((widgetType) => {
          const registryItem = WidgetRegistry.get(widgetType);
          if (!registryItem) return null;
          
          const displayConfig = WIDGET_DISPLAY_CONFIG[widgetType];
          const WidgetComponent = registryItem.component;
          
          // 創建 widget 配置
          const widget = {
            id: `${channel.id}-${widgetType}`,
            type: widgetType,
            gridProps: { x: 0, y: 0, w: 3, h: 3 }, // 默認值
            config: {
              ...registryItem.defaultConfig,
              isCompact: !isExpanded // 在 channel 卡片中使用 compact 模式
            }
          };
          
          // 根據顯示模式設置樣式
          const cardClassName = cn(
            "widget-card bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 transition-all duration-300",
            {
              'widget-square': displayConfig.displayMode === 'square',
              'widget-wide': displayConfig.displayMode === 'wide',
              'widget-tall': displayConfig.displayMode === 'tall',
              'hover:bg-slate-700/40 hover:border-slate-600/50': !isLoading
            }
          );
          
          return (
            <motion.div
              key={widgetType}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cardClassName}
            >
              <WidgetComponent widget={widget} isEditMode={false} />
            </motion.div>
          );
        })}
      </div>
    );
  };
  
  return (
    <motion.div
      className={cn(
        "bg-slate-800/60 backdrop-blur-xl border rounded-2xl transition-all duration-300",
        isSubscribed ? "border-orange-500/50" : "border-slate-700/50",
        isHovered && "shadow-lg shadow-orange-500/10"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      layout
    >
      {/* Channel Header */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          {/* 左側：圖標、名稱和摘要 */}
          <div className="flex items-center gap-4 flex-1">
            <div className="text-3xl">{channel.icon}</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                {channel.nameZh}
                <span className="text-sm text-slate-400 font-normal">
                  {channel.name}
                </span>
              </h3>
              <p className="text-sm text-slate-400 mt-1">{channel.description}</p>
              {isSubscribed && !isExpanded && (
                <p className="text-sm text-orange-400 mt-2">
                  {isLoading ? '載入中...' : getChannelSummary()}
                </p>
              )}
            </div>
          </div>
          
          {/* 右側：訂閱和展開按鈕 */}
          <div className="flex items-center gap-2 ml-4">
            {/* 訂閱按鈕 */}
            <button
              onClick={() => onToggleSubscribe?.(channel.id)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                isSubscribed
                  ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                  : "bg-slate-700/50 text-slate-400 hover:bg-slate-600/50"
              )}
            >
              {isSubscribed ? '已訂閱' : '訂閱'}
            </button>
            
            {/* 展開按鈕（只在訂閱時顯示） */}
            {isSubscribed && (
              <button
                onClick={() => onToggleExpanded?.(channel.id)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-300"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="w-5 h-5" />
                ) : (
                  <ChevronRightIcon className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Expanded Content */}
      <AnimatePresence>
        {isSubscribed && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6">
              <div className="border-t border-slate-700/50 pt-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  </div>
                ) : (
                  renderWidgetGrid()
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}