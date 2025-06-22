/**
 * Ask Database 小部件
 * 只支援 XLarge (6x6) 尺寸，因為需要顯示完整的對話介面
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { iconColors } from '@/app/utils/dialogStyles';
import AskDatabaseInlineCard from '@/app/components/AskDatabaseInlineCard';

export const AskDatabaseWidget = React.memo(function AskDatabaseWidget({ widget, isEditMode }: WidgetComponentProps) {
  // 獲取實際的 grid 尺寸
  const gridProps = 'gridProps' in widget ? widget.gridProps : null;
  const actualWidth = gridProps?.w || 6;
  const actualHeight = gridProps?.h || 6;
  
  // Ask Database 需要至少 6x6 的空間
  const hasEnoughSpace = actualWidth >= 6 && actualHeight >= 6;

  if (!hasEnoughSpace) {
    return (
      <Card className={`h-full bg-black/30 backdrop-blur-sm border border-purple-500/30 shadow-2xl ${isEditMode ? 'border-dashed border-2 border-purple-500/50' : ''}`}>
        <CardContent className="p-6 h-full flex flex-col justify-center items-center">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mb-3">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-medium text-purple-300 mb-2">Ask Database</h3>
          <p className="text-sm text-slate-400 text-center">
            This widget requires at least 6×6 size to display the chat interface
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Current size: {actualWidth}×{actualHeight}
          </p>
          <p className="text-xs text-slate-500">
            Please resize to at least 6×6
          </p>
        </CardContent>
      </Card>
    );
  }

  // Large size - full chat interface
  return (
    <div className="relative group h-full">
      {/* 卡片背景 */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-2xl blur-xl"></div>
      
      <div className={`relative bg-black/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 shadow-2xl shadow-purple-900/20 hover:border-purple-400/50 transition-all duration-300 h-full ${isEditMode ? 'border-dashed border-2 border-purple-500/50' : ''}`}>
        {/* 卡片內部光效 */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
        
        {/* 頂部邊框光效 */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent opacity-100 rounded-t-2xl"></div>
        
        <div className="relative z-10 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-300 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                {'title' in widget ? widget.title : 'Ask Me Anything'}
              </h2>
            </div>
          </div>
          
          <div className="flex-1">
            {isEditMode ? (
              <div className="h-full flex items-center justify-center bg-black/20 rounded-xl border border-purple-500/20">
                <p className="text-slate-400 text-center">
                  Chat interface disabled in edit mode
                </p>
              </div>
            ) : (
              <AskDatabaseInlineCard />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});