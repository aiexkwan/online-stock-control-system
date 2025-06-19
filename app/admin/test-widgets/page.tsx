'use client';

import React from 'react';
import { VoidPalletWidget } from '@/app/admin/components/dashboard/widgets/VoidPalletWidget';
import { ProductMixChartWidget } from '@/app/admin/components/dashboard/widgets/ProductMixChartWidget';
import { BookedOutStatsWidget } from '@/app/admin/components/dashboard/widgets/BookedOutStatsWidget';
import { OutputStatsWidget } from '@/app/admin/components/dashboard/widgets/OutputStatsWidget';
import { VoidStatsWidget } from '@/app/admin/components/dashboard/widgets/VoidStatsWidget';
import { WidgetSize } from '@/app/types/dashboard';

export default function TestWidgetsPage() {
  const testWidgets = [
    { 
      component: VoidPalletWidget, 
      name: 'VoidPalletWidget',
      config: { size: WidgetSize.LARGE, type: 'VOID_PALLET' as any }
    },
    { 
      component: ProductMixChartWidget, 
      name: 'ProductMixChartWidget',
      config: { size: WidgetSize.LARGE, type: 'PRODUCT_MIX_CHART' as any }
    },
    { 
      component: BookedOutStatsWidget, 
      name: 'BookedOutStatsWidget',
      config: { size: WidgetSize.LARGE, type: 'BOOKED_OUT_STATS' as any }
    },
    { 
      component: OutputStatsWidget, 
      name: 'OutputStatsWidget',
      config: { size: WidgetSize.LARGE, type: 'OUTPUT_STATS' as any }
    },
    { 
      component: VoidStatsWidget, 
      name: 'VoidStatsWidget',
      config: { size: WidgetSize.LARGE, type: 'VOID_STATS' as any }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Widget Test Page - Table/Chart Ratio Verification</h1>
      
      <div className="space-y-12">
        {testWidgets.map(({ component: Widget, name, config }) => (
          <div key={name} className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">{name} (5x5)</h2>
            <div className="bg-gray-700 p-2 rounded mb-4">
              <p className="text-sm text-gray-300">Requirements:</p>
              <ul className="text-xs text-gray-400 mt-2 space-y-1">
                <li>✓ Table to Chart ratio: 1:1.5 (40% table, 60% chart)</li>
                <li>✓ Table shows exactly 4 records by default</li>
                <li>✓ Table allows vertical scrolling if more records exist</li>
                <li>✓ Chart has NO vertical scrolling</li>
                <li>✓ NO horizontal scrolling in widget</li>
              </ul>
            </div>
            <div className="h-[500px] w-full">
              <Widget 
                widget={{ 
                  id: `test-${name}`, 
                  channel_id: 'test', 
                  config,
                  x: 0,
                  y: 0,
                  w: 5,
                  h: 5
                }} 
                isEditMode={false} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}