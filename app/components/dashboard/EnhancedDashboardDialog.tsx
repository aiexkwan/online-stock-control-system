/**
 * 優化的 Widget 選擇對話框
 * 分步驟顯示：先選擇類型，再選擇大小
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WidgetType, WidgetSize, WidgetSizeConfig } from '@/app/types/dashboard';
import { WidgetRegistry } from './WidgetRegistry';
import { cn } from '@/lib/utils';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface WidgetSelectDialogProps {
  onSelect: (type: WidgetType, size: WidgetSize) => void;
  onClose: () => void;
}

export function WidgetSelectDialog({ onSelect, onClose }: WidgetSelectDialogProps) {
  const [selectedType, setSelectedType] = useState<WidgetType | null>(null);
  const [showSizeSelection, setShowSizeSelection] = useState(false);

  // 獲取支援的尺寸
  const getSupportedSizes = (type: WidgetType): WidgetSize[] => {
    // Ask Database 只支援 Medium 和 Large
    if (type === WidgetType.ASK_DATABASE) {
      return [WidgetSize.MEDIUM, WidgetSize.LARGE];
    }
    // 其他 widget 支援所有尺寸
    return [WidgetSize.SMALL, WidgetSize.MEDIUM, WidgetSize.LARGE];
  };

  const handleTypeSelect = (type: WidgetType) => {
    setSelectedType(type);
    setTimeout(() => {
      setShowSizeSelection(true);
    }, 150);
  };

  const handleSizeSelect = (size: WidgetSize) => {
    if (selectedType) {
      onSelect(selectedType, size);
      onClose();
    }
  };

  const handleBack = () => {
    setShowSizeSelection(false);
    setTimeout(() => {
      setSelectedType(null);
    }, 300);
  };

  // 定義小部件分組
  const widgetGroups = [
    {
      title: 'Statistics',
      widgets: [
        WidgetType.STATS_CARD,
        WidgetType.OUTPUT_STATS,
        WidgetType.BOOKED_OUT_STATS,
        WidgetType.VOID_STATS,
      ]
    },
    {
      title: 'Charts & Analytics',
      widgets: [
        WidgetType.PRODUCT_MIX_CHART,
        WidgetType.PALLET_OVERVIEW,
      ]
    },
    {
      title: 'Operations',
      widgets: [
        WidgetType.RECENT_ACTIVITY,
        WidgetType.ACO_ORDER_PROGRESS,
        WidgetType.INVENTORY_SEARCH,
        WidgetType.FINISHED_PRODUCT,
        WidgetType.MATERIAL_RECEIVED,
      ]
    },
    {
      title: 'Tools',
      widgets: [
        WidgetType.QUICK_ACTIONS,
        WidgetType.ASK_DATABASE,
      ]
    },
    {
      title: 'System Tools',
      widgets: [
        WidgetType.VOID_PALLET,
        WidgetType.VIEW_HISTORY,
        WidgetType.DATABASE_UPDATE,
      ]
    },
    {
      title: 'Document Management',
      widgets: [
        WidgetType.UPLOAD_FILES,
        WidgetType.REPORTS,
      ]
    },
    {
      title: 'Analytics',
      widgets: [
        WidgetType.ANALYTICS_DASHBOARD,
      ]
    }
  ];

  const selectedWidget = selectedType ? WidgetRegistry.get(selectedType) : null;
  const supportedSizes = selectedType ? getSupportedSizes(selectedType) : [];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-slate-900 text-white border-slate-700">
        <AnimatePresence mode="wait">
          {!showSizeSelection ? (
            // Widget Type Selection
            <motion.div
              key="type-selection"
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader>
                <DialogTitle className="text-2xl">Add Widget</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Select a widget to add to your dashboard
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-6 max-h-[60vh] overflow-y-auto pr-2">
                {widgetGroups.map((group) => (
                  <div key={group.title}>
                    <h3 className="text-sm font-medium text-slate-400 mb-3">{group.title}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {group.widgets.map((type) => {
                        const registryItem = WidgetRegistry.get(type);
                        if (!registryItem) return null;
                        
                        return (
                          <button
                            key={type}
                            onClick={() => handleTypeSelect(type)}
                            className="p-4 rounded-lg border-2 border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-slate-600 transition-all text-left group"
                          >
                            <div className="font-medium group-hover:text-blue-400 transition-colors">
                              {registryItem.name}
                            </div>
                            <div className="text-sm text-slate-400 mt-1">
                              {registryItem.description}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            // Size Selection
            <motion.div
              key="size-selection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="text-slate-400 hover:text-white"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                  </Button>
                  <div>
                    <DialogTitle className="text-2xl">{selectedWidget?.name}</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Choose widget size
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="mt-8">
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(WidgetSize).map(([key, size]) => {
                    const config = WidgetSizeConfig[size];
                    const isSupported = supportedSizes.includes(size);
                    
                    return (
                      <motion.button
                        key={size}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: key === 'SMALL' ? 0 : key === 'MEDIUM' ? 0.1 : 0.2 }}
                        onClick={() => isSupported && handleSizeSelect(size)}
                        disabled={!isSupported}
                        className={cn(
                          "p-6 rounded-xl border-2 transition-all",
                          !isSupported && "opacity-30 cursor-not-allowed",
                          isSupported && "hover:scale-105 hover:border-blue-500 hover:bg-blue-500/10 cursor-pointer",
                          isSupported ? "border-slate-700 bg-slate-800" : "border-slate-800 bg-slate-900"
                        )}
                      >
                        <div className="flex flex-col items-center gap-4">
                          {/* Size Preview */}
                          <div className="relative">
                            <div 
                              className={cn(
                                "bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg border border-slate-600",
                                size === WidgetSize.SMALL && "w-16 h-16",
                                size === WidgetSize.MEDIUM && "w-24 h-24",
                                size === WidgetSize.LARGE && "w-32 h-32"
                              )}
                            >
                              {/* Grid pattern */}
                              <div className="absolute inset-0 opacity-30">
                                <div className={cn(
                                  "grid gap-px bg-slate-700 p-1 h-full",
                                  size === WidgetSize.SMALL && "grid-cols-2 grid-rows-2",
                                  size === WidgetSize.MEDIUM && "grid-cols-4 grid-rows-4",
                                  size === WidgetSize.LARGE && "grid-cols-6 grid-rows-6"
                                )}>
                                  {Array.from({ length: config.w * config.h }).map((_, i) => (
                                    <div key={i} className="bg-slate-800 rounded-sm" />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Size Info */}
                          <div className="text-center">
                            <div className="font-semibold text-lg capitalize">
                              {size}
                            </div>
                            <div className="text-sm text-slate-400">
                              {config.w} × {config.h}
                            </div>
                            {!isSupported && (
                              <div className="text-xs text-red-400 mt-1">
                                Not supported
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Size Description */}
                <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Size Guide</h4>
                  <div className="space-y-1 text-xs text-slate-400">
                    <div><span className="text-slate-300">Small (2×2):</span> Shows key metrics only</div>
                    <div><span className="text-slate-300">Medium (4×4):</span> Displays detailed information</div>
                    <div><span className="text-slate-300">Large (6×6):</span> Full features with charts</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}