/**
 * Export all mockup widgets for easy import
 */

export { MockupOutputStatsWidget } from './MockupOutputStatsWidget';
export { MockupAcoOrderProgressWidget } from './MockupAcoOrderProgressWidget';
export { MockupFinishedProductWidget } from './MockupFinishedProductWidget';
export { MockupProductMixChartWidget } from './MockupProductMixChartWidget';
export { MockupTodayProductionWidget } from './MockupTodayProductionWidget';
export { MockupMachineEfficiencyWidget } from './MockupMachineEfficiencyWidget';
export { MockupTargetHitRateWidget } from './MockupTargetHitRateWidget';

// Create placeholder components for other widgets
import React from 'react';
import { CardContent, CardHeader } from '@/components/ui/card';
import { WidgetCard } from '../WidgetCard';
import { WidgetComponentProps } from '@/app/types/dashboard';

// Generic mockup widget component
const createMockupWidget = (title: string, icon: string, color: string) => {
  return function MockupWidget({ widget, isEditMode }: WidgetComponentProps) {
    return (
      <WidgetCard size={widget.config.size} widgetType={widget.type} isEditMode={isEditMode}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 bg-gradient-to-r ${color} rounded-lg flex items-center justify-center`}>
              <span className="text-white text-sm">{icon}</span>
            </div>
            <h3 className="text-sm font-medium text-slate-200">{title}</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-black/20 rounded-lg p-4 border border-slate-700/50">
              <div className="text-2xl font-bold text-slate-300 mb-2">Demo Content</div>
              <div className="text-sm text-slate-400">This is a mockup widget for layout design</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/20 rounded-lg p-3 border border-slate-700/50">
                <div className="text-lg font-semibold text-slate-300">42</div>
                <div className="text-xs text-slate-500">Items</div>
              </div>
              <div className="bg-black/20 rounded-lg p-3 border border-slate-700/50">
                <div className="text-lg font-semibold text-slate-300">128</div>
                <div className="text-xs text-slate-500">Total</div>
              </div>
            </div>
          </div>
        </CardContent>
      </WidgetCard>
    );
  };
};

// Export mockup widgets for all other types
export const MockupMaterialReceivedWidget = createMockupWidget('Material Received', '📦', 'from-purple-500 to-pink-500');
export const MockupBookedOutStatsWidget = createMockupWidget('Booked Out Stats', '📊', 'from-indigo-500 to-purple-500');
export const MockupInventorySearchWidget = createMockupWidget('Inventory Search', '🔍', 'from-cyan-500 to-blue-500');
export const MockupRecentActivityWidget = createMockupWidget('Recent Activity', '📋', 'from-green-500 to-teal-500');
export const MockupViewHistoryWidget = createMockupWidget('View History', '📜', 'from-yellow-500 to-orange-500');
export const MockupVoidPalletWidget = createMockupWidget('Void Pallet', '❌', 'from-red-500 to-pink-500');
export const MockupDatabaseUpdateWidget = createMockupWidget('Database Update', '💾', 'from-gray-500 to-slate-500');
export const MockupDocumentUploadWidget = createMockupWidget('Upload Files', '📤', 'from-teal-500 to-cyan-500');
export const MockupReportsWidget = createMockupWidget('Reports', '📈', 'from-amber-500 to-yellow-500');
export const MockupAskDatabaseWidget = createMockupWidget('Ask Database', '🤖', 'from-violet-500 to-purple-500');

// Empty widget for unsupported types
export const EmptyWidget = () => null;