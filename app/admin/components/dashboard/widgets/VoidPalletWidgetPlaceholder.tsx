/**
 * Void Pallet Widget Placeholder
 * 佔位 widget - 暫時不注入功能
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArchiveBoxXMarkIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';

export const VoidPalletWidget = React.memo(function VoidPalletWidget({ widget, isEditMode }: WidgetComponentProps) {
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <WidgetCard widgetType="VOID_PALLET" isEditMode={isEditMode}>
        <CardHeader className="pb-3">
          <CardTitle className="widget-title flex items-center gap-2">
            <ArchiveBoxXMarkIcon className="w-5 h-5" />
            Void Pallet
          </CardTitle>
        </CardHeader>
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center">
            <ArchiveBoxXMarkIcon className="w-16 h-16 text-slate-500 mx-auto mb-4 opacity-50" />
            <p className="text-lg text-slate-400">Void Pallet Functionality</p>
            <p className="text-sm text-slate-500 mt-2">Coming Soon</p>
          </div>
        </CardContent>
      </WidgetCard>
    </motion.div>
  );
});