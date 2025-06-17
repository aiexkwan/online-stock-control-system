/**
 * Finished Product Widget
 * 支援三種尺寸：
 * - Small (2x2): 只顯示選定時間範圍的finished product總板數
 * - Medium (4x4): 顯示選定時間範圍頭5的product code及各自總板數
 * - Large (6x6): 顯示選定時間範圍頭5的product code、總板數及總qty
 */

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CubeIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import FinishedProduct from '@/app/components/PrintHistory';

export function FinishedProductWidget({ widget, isEditMode }: WidgetComponentProps) {
  const size = widget.config.size || WidgetSize.SMALL;

  // All sizes render the same component with different display modes
  return (
    <div className={`h-full relative group ${isEditMode ? 'border-2 border-dashed border-green-500/50 rounded-2xl' : ''}`}>
      {/* Card background */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-green-900/30 rounded-3xl blur-xl"></div>
      
      <div className={`relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl shadow-green-900/20 hover:border-green-500/30 transition-all duration-300 h-full ${
        size === WidgetSize.SMALL ? 'p-4' : 'p-6'
      }`}>
        {/* Card inner glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
        
        {/* Top border glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-3xl"></div>
        
        <div className="relative z-10 h-full overflow-auto">
          <FinishedProduct widgetSize={size} />
        </div>
      </div>
    </div>
  );
}