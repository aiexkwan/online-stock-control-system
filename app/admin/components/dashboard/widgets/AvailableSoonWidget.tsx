'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { ClockIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';

function AvailableSoonWidget({ widget, isEditMode }: WidgetComponentProps) {
  if (isEditMode) {
    return (
      <WidgetCard widget={widget} isEditMode={true}>
        <div className="h-full flex items-center justify-center">
          <p className="text-slate-400 font-medium">Coming Soon Widget</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widget={widget}>
      <CardHeader className="pb-2">
        <CardTitle className="widget-title flex items-center gap-2">
          <ClockIcon className="w-5 h-5" />
          {widget.title || 'Coming Soon'}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <p className="text-lg font-medium text-slate-300 mb-2">New Features Coming Soon</p>
          <p className="text-sm text-slate-400">We&apos;re working on something awesome!</p>
        </motion.div>
      </CardContent>
    </WidgetCard>
  );
}

export default AvailableSoonWidget;