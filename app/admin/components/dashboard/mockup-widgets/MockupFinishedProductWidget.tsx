/**
 * Mockup Finished Product Widget - Static version for layout design
 */

'use client';

import React from 'react';
import { CardContent, CardHeader } from '@/components/ui/card';
import { WidgetCard } from '../WidgetCard';
import { CubeIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { WidgetStyles } from '@/app/utils/widgetStyles';

export function MockupFinishedProductWidget({ widget, isEditMode }: WidgetComponentProps) {
  const size = widget.config.size || WidgetSize.SMALL;

  if (size === WidgetSize.SMALL) {
    return (
      <WidgetCard size={widget.config.size} widgetType={widget.type as keyof typeof WidgetStyles.borders} isEditMode={isEditMode}>
        <CardContent className="p-2 h-full flex flex-col justify-center items-center">
          <h3 className="text-xs text-slate-400 mb-1">Finished Products</h3>
          <div className="text-2xl font-bold text-green-400">89</div>
          <p className="text-xs text-slate-500 mt-1">Today</p>
        </CardContent>
      </WidgetCard>
    );
  }

  if (size === WidgetSize.MEDIUM) {
    return (
      <WidgetCard size={widget.config.size} widgetType={widget.type as keyof typeof WidgetStyles.borders} isEditMode={isEditMode}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <CubeIcon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-sm font-medium text-slate-200">Finished Products</h3>
            </div>
            <select className="px-2 py-1 bg-white/5 border border-slate-600/30 rounded-md text-xs text-slate-300">
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-2">
            {[
              { code: 'CPDE123', count: 24 },
              { code: 'CPDE456', count: 18 },
              { code: 'CPDE789', count: 15 },
              { code: 'CPDE012', count: 12 },
              { code: 'CPDE345', count: 10 }
            ].map((product) => (
              <div key={product.code} className="flex items-center justify-between bg-black/20 rounded-lg p-2 border border-slate-700/50">
                <span className="text-sm text-slate-300">{product.code}</span>
                <span className="text-sm font-bold text-green-400">{product.count} pallets</span>
              </div>
            ))}
            <div className="pt-2 mt-2 border-t border-slate-700/50">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Total</span>
                <span className="text-sm font-bold text-green-400">89 pallets</span>
              </div>
            </div>
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
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <CubeIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-medium bg-gradient-to-r from-green-300 via-emerald-300 to-teal-300 bg-clip-text text-transparent">
              Finished Product Summary
            </h3>
          </div>
          <select className="px-3 py-1 bg-white/5 border border-slate-600/30 rounded-md text-sm text-slate-300">
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-black/20 rounded-lg p-3 border border-slate-700/50 text-center">
              <div className="text-2xl font-bold text-green-400">89</div>
              <div className="text-xs text-slate-400">Total Pallets</div>
            </div>
            <div className="bg-black/20 rounded-lg p-3 border border-slate-700/50 text-center">
              <div className="text-2xl font-bold text-emerald-400">15</div>
              <div className="text-xs text-slate-400">Products</div>
            </div>
            <div className="bg-black/20 rounded-lg p-3 border border-slate-700/50 text-center">
              <div className="text-2xl font-bold text-teal-400">2,456</div>
              <div className="text-xs text-slate-400">Total Qty</div>
            </div>
          </div>
          
          <h4 className="text-sm font-medium text-slate-300">Top 5 Products</h4>
          <div className="space-y-2">
            {[
              { code: 'CPDE123', pallets: 24, qty: 576 },
              { code: 'CPDE456', pallets: 18, qty: 432 },
              { code: 'CPDE789', pallets: 15, qty: 360 },
              { code: 'CPDE012', pallets: 12, qty: 288 },
              { code: 'CPDE345', pallets: 10, qty: 240 }
            ].map((product) => (
              <div key={product.code} className="bg-black/20 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-200">{product.code}</span>
                  <div className="flex gap-4">
                    <span className="text-sm text-green-400">{product.pallets} pallets</span>
                    <span className="text-sm text-emerald-400">{product.qty} qty</span>
                  </div>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 rounded-full"
                    style={{ width: `${(product.pallets / 24) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </WidgetCard>
  );
}