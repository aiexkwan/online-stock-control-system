/**
 * Mockup ACO Order Progress Widget - Static version for layout design
 */

'use client';

import React from 'react';
import { CardContent, CardHeader } from '@/components/ui/card';
import { WidgetCard } from '../WidgetCard';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { WidgetStyles } from '@/app/utils/widgetStyles';

export function MockupAcoOrderProgressWidget({ widget, isEditMode }: WidgetComponentProps) {
  const size = widget.config.size || WidgetSize.SMALL;

  if (size === WidgetSize.SMALL) {
    return (
      <WidgetCard size={widget.config.size} widgetType={widget.type as keyof typeof WidgetStyles.borders} isEditMode={isEditMode}>
        <CardContent className="p-2 h-full flex flex-col justify-center items-center">
          <h3 className="text-xs text-slate-400 mb-1">ACO Orders</h3>
          <div className="text-2xl font-bold text-orange-400">12</div>
          <p className="text-xs text-slate-500 mt-1">Incomplete</p>
        </CardContent>
      </WidgetCard>
    );
  }

  if (size === WidgetSize.MEDIUM) {
    return (
      <WidgetCard size={widget.config.size} widgetType={widget.type as keyof typeof WidgetStyles.borders} isEditMode={isEditMode}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
              <ClipboardDocumentListIcon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-sm font-medium text-slate-200">ACO Orders</h3>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {[280481, 280482, 280483, 280484, 280485].map((orderRef, idx) => {
              const completionPercentage = 85 - idx * 15;
              return (
                <div key={orderRef} className="bg-black/20 rounded-lg p-2 border border-slate-700/50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-slate-200">Order {orderRef}</span>
                    <div className="bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 px-2 py-0.5 rounded text-[10px]">
                      {25 + idx * 10} remain
                    </div>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-amber-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </WidgetCard>
    );
  }

  // Large size
  return (
    <WidgetCard size={widget.config.size} widgetType={widget.type as keyof typeof WidgetStyles.borders} isEditMode={isEditMode}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
              <ClipboardDocumentListIcon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-sm font-medium bg-gradient-to-r from-orange-300 via-amber-300 to-orange-200 bg-clip-text text-transparent">
              ACO Order Progress
            </h3>
          </div>
          
          <div className="flex items-center gap-2 px-2 py-1 bg-white/5 text-slate-300 rounded-md text-xs border border-slate-600/30">
            <ClipboardDocumentListIcon className="w-4 h-4" />
            Order 280481
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {['CPDE123-A', 'CPDE456-B', 'CPDE789-C'].map((code, index) => {
            const percentage = 75 - index * 20;
            return (
              <div key={code} className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-200">{code}</span>
                  <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
                    {150 - index * 30} / 200
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-amber-400 h-3 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                    style={{ width: `${percentage}%` }}
                  >
                    {percentage > 25 && (
                      <span className="text-[10px] font-bold text-white">
                        {percentage}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500">
                    Last updated: Jan 19, 2025 14:30
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </WidgetCard>
  );
}