/**
 * 優化版 Ask Database Widget - 支援 Medium 和 Large 尺寸
 */

'use client';

import React from 'react';
import { WidgetCard } from '@/app/components/dashboard/WidgetCard';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import AskDatabaseInlineCard from '@/app/components/AskDatabaseInlineCard';

export function EnhancedAskDatabaseWidget({ widget, isEditMode }: WidgetComponentProps) {
  const size = widget.config.size || WidgetSize.LARGE;

  // Medium 尺寸 - 簡化版
  if (size === WidgetSize.MEDIUM) {
    return (
      <WidgetCard widgetType="ASK_DATABASE" isEditMode={isEditMode} className="overflow-hidden p-0">
        <div className="h-full overflow-hidden">
          <style jsx global>{`
            .ask-database-widget-medium .p-4 { padding: 0.75rem !important; }
            .ask-database-widget-medium h3 { font-size: 0.875rem !important; }
            .ask-database-widget-medium .text-sm { font-size: 0.75rem !important; }
            .ask-database-widget-medium textarea { min-height: 60px !important; }
            .ask-database-widget-medium button { padding: 0.375rem 0.75rem !important; font-size: 0.75rem !important; }
            
            /* Override text colors for data display */
            .ask-database-widget-medium table td { color: rgb(196 181 253) !important; }
            .ask-database-widget-medium table th { color: rgb(216 180 254) !important; }
            .ask-database-widget-medium .prose { color: rgb(216 180 254) !important; }
            .ask-database-widget-medium .prose strong { color: rgb(196 181 253) !important; }
            .ask-database-widget-medium .prose code { color: rgb(233 213 255) !important; }
          `}</style>
          <div className="ask-database-widget-medium h-full">
            <AskDatabaseInlineCard />
          </div>
        </div>
      </WidgetCard>
    );
  }

  // Large 尺寸 - 完整版
  return (
    <WidgetCard widgetType="ASK_DATABASE" isEditMode={isEditMode} className="overflow-hidden p-0">
      <div className="h-full overflow-hidden">
        <style jsx global>{`
          /* Override text colors for data display in large size */
          .ask-database-widget-large table td { color: rgb(196 181 253) !important; }
          .ask-database-widget-large table th { color: rgb(216 180 254) !important; }
          .ask-database-widget-large .prose { color: rgb(216 180 254) !important; }
          .ask-database-widget-large .prose strong { color: rgb(196 181 253) !important; }
          .ask-database-widget-large .prose code { color: rgb(233 213 255) !important; }
        `}</style>
        <div className="ask-database-widget-large h-full">
          <AskDatabaseInlineCard />
        </div>
      </div>
    </WidgetCard>
  );
}