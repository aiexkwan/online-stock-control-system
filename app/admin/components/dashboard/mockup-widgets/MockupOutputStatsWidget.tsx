/**
 * Mockup Output Stats Widget - Static version for layout design
 */

'use client';

import React from 'react';
import { CardContent, CardHeader } from '@/components/ui/card';
import { WidgetCard } from '../WidgetCard';
import { CubeIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';

export function MockupOutputStatsWidget({ widget, isEditMode }: WidgetComponentProps) {
  const size = widget.config.size || WidgetSize.SMALL;

  if (size === WidgetSize.SMALL) {
    return (
      <WidgetCard size={widget.config.size} widgetType="OUTPUT_STATS" isEditMode={isEditMode}>
        <CardContent className="p-2 h-full flex flex-col justify-center items-center">
          <h3 className="text-xs text-slate-400 mb-1">Output Today</h3>
          <div className="text-2xl font-bold text-orange-400">256</div>
          <p className="text-xs text-slate-500 mt-1">pallets</p>
        </CardContent>
      </WidgetCard>
    );
  }

  if (size === WidgetSize.MEDIUM) {
    return (
      <WidgetCard size={widget.config.size} widgetType="OUTPUT_STATS" isEditMode={isEditMode}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <CubeIcon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-sm font-medium text-slate-200">Production Output</h3>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-3">
            <div className="bg-black/20 rounded-lg p-3 border border-slate-700/50">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Today</span>
                <span className="text-xl font-bold text-blue-400">256</span>
              </div>
            </div>
            <div className="bg-black/20 rounded-lg p-3 border border-slate-700/50">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">This Week</span>
                <span className="text-xl font-bold text-cyan-400">1,842</span>
              </div>
            </div>
            <div className="bg-black/20 rounded-lg p-3 border border-slate-700/50">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">This Month</span>
                <span className="text-xl font-bold text-teal-400">7,365</span>
              </div>
            </div>
          </div>
        </CardContent>
      </WidgetCard>
    );
  }

  // Large size
  return (
    <WidgetCard size={widget.config.size} widgetType="OUTPUT_STATS" isEditMode={isEditMode}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <CubeIcon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-medium bg-gradient-to-r from-blue-300 via-cyan-300 to-teal-300 bg-clip-text text-transparent">
            Production Output Statistics
          </h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-black/20 rounded-lg p-4 border border-slate-700/50">
            <div className="text-sm text-slate-400 mb-1">Today&apos;s Output</div>
            <div className="text-3xl font-bold text-blue-400">256</div>
            <div className="text-xs text-green-400 mt-1">↑ 12% from yesterday</div>
          </div>
          <div className="bg-black/20 rounded-lg p-4 border border-slate-700/50">
            <div className="text-sm text-slate-400 mb-1">Weekly Average</div>
            <div className="text-3xl font-bold text-cyan-400">263</div>
            <div className="text-xs text-slate-500 mt-1">pallets per day</div>
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-300">Top Products Today</h4>
          {['CPDE123', 'CPDE456', 'CPDE789', 'CPDE012', 'CPDE345'].map((code, idx) => (
            <div key={code} className="flex items-center justify-between bg-black/20 rounded-lg p-2 border border-slate-700/50">
              <span className="text-sm text-slate-300">{code}</span>
              <div className="flex items-center gap-3">
                <div className="w-24 bg-white/10 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                    style={{ width: `${85 - idx * 10}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-blue-400">{45 - idx * 5}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </WidgetCard>
  );
}