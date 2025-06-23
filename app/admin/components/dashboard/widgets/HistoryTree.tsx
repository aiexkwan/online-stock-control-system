/**
 * History Tree Widget - 空白歷史樹組件（暫時留空）
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ClockIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WidgetCard } from '../WidgetCard';

export const HistoryTree = React.memo(function HistoryTree({ widget, isEditMode }: WidgetComponentProps) {
  const size = widget.config.size || WidgetSize.MEDIUM;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <WidgetCard size={widget.config.size} widgetType="view_history" isEditMode={isEditMode} className="flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <ClockIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-base font-medium text-slate-200">History Tree</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1">
          {/* 暫時清空內容 */}
        </CardContent>
      </WidgetCard>
    </motion.div>
  );
});