/**
 * 優化版 Ask Database Widget - 支援 Medium 和 Large 尺寸
 */

'use client';

import React from 'react';
import { WidgetCard } from '../WidgetCard';
import { WidgetComponentProps } from '@/app/types/dashboard';
import AskDatabaseInlineCard from '@/app/components/AskDatabaseInlineCard';

export const EnhancedAskDatabaseWidget = React.memo(function EnhancedAskDatabaseWidget({ widget, isEditMode }: WidgetComponentProps) {

  // Medium 尺寸 - 簡化版

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
});