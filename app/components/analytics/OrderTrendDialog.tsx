/**
 * Order Trend Analytics Dialog
 * Shows product trend analytics chart
 */

'use client';

import React, { useState } from 'react';
import { TrendingUp, CalendarIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { dialogStyles, iconColors } from '@/app/utils/dialogStyles';
import { ProductTrendChart } from './charts/ProductTrendChart';

interface OrderTrendDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrderTrendDialog({ isOpen, onClose }: OrderTrendDialogProps) {
  const [timeRange, setTimeRange] = useState('7d');

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className={`${dialogStyles.content} max-h-[90vh] max-w-4xl`}>
        <DialogHeader>
          <DialogTitle className={dialogStyles.title}>
            <TrendingUp className={`h-6 w-6 ${iconColors.green}`} />
            Order Trend Analytics
          </DialogTitle>
          <DialogDescription className='sr-only'>
            View analytics for order and product trends
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Time Range Selector */}
          <div className='flex items-center justify-between'>
            <div className='text-sm text-slate-400'>Daily production trends by product type</div>
            <div className='flex items-center gap-2'>
              <CalendarIcon className='h-4 w-4 text-slate-400' />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    className='w-[180px] justify-between border-slate-600 bg-slate-800/50 hover:bg-slate-700/50'
                  >
                    {timeRange === '1d' && 'Today'}
                    {timeRange === '7d' && 'Past 7 Days'}
                    {timeRange === '30d' && 'Past 30 Days'}
                    {timeRange === '90d' && 'Past 90 Days'}
                    <CalendarIcon className='ml-2 h-4 w-4 opacity-50' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-[180px]'>
                  <DropdownMenuItem onClick={() => setTimeRange('1d')}>Today</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTimeRange('7d')}>
                    Past 7 Days
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTimeRange('30d')}>
                    Past 30 Days
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTimeRange('90d')}>
                    Past 90 Days
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Chart Content */}
          <div className='h-[500px] overflow-hidden'>
            <ProductTrendChart timeRange={timeRange} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
