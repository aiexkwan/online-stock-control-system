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
      <WidgetCard widgetType='custom' isEditMode={true}>
        <div className='flex h-full items-center justify-center'>
          <p className='font-medium text-slate-400'>Coming Soon Widget</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widgetType='custom'>
      <CardHeader className='pb-2'>
        <CardTitle className='widget-title flex items-center gap-2'>
          <ClockIcon className='h-5 w-5' />
          {(widget as any).title || 'Coming Soon'}
        </CardTitle>
      </CardHeader>
      <CardContent className='flex flex-1 items-center justify-center'>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className='text-center'
        >
          <p className='mb-2 text-lg font-medium text-slate-300'>New Features Coming Soon</p>
          <p className='text-sm text-slate-400'>We&apos;re working on something awesome!</p>
        </motion.div>
      </CardContent>
    </WidgetCard>
  );
}

export default AvailableSoonWidget;
