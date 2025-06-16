/**
 * 優化版 Ask Database Widget - 支援 Medium 和 Large 尺寸
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import AskDatabaseInlineCard from '@/app/components/AskDatabaseInlineCard';

export function EnhancedAskDatabaseWidget({ widget, isEditMode }: WidgetComponentProps) {
  const size = widget.config.size || WidgetSize.LARGE;

  // Medium 尺寸 - 簡化版
  if (size === WidgetSize.MEDIUM) {
    return (
      <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl overflow-hidden p-0 ${isEditMode ? 'border-dashed border-2 border-blue-500/50' : ''}`}>
        <div className="h-full overflow-hidden">
          <style jsx global>{`
            .ask-database-widget-medium .p-4 { padding: 0.75rem !important; }
            .ask-database-widget-medium h3 { font-size: 0.875rem !important; }
            .ask-database-widget-medium .text-sm { font-size: 0.75rem !important; }
            .ask-database-widget-medium textarea { min-height: 60px !important; }
            .ask-database-widget-medium button { padding: 0.375rem 0.75rem !important; font-size: 0.75rem !important; }
          `}</style>
          <div className="ask-database-widget-medium h-full">
            <AskDatabaseInlineCard />
          </div>
        </div>
      </Card>
    );
  }

  // Large 尺寸 - 完整版
  return (
    <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl overflow-hidden p-0 ${isEditMode ? 'border-dashed border-2 border-blue-500/50' : ''}`}>
      <div className="h-full overflow-hidden">
        <AskDatabaseInlineCard />
      </div>
    </Card>
  );
}