/**
 * Analytics Dashboard Dialog
 * Main dialog for displaying analytics charts
 */

'use client';

import React, { useState } from 'react';
import { ChevronDownIcon , BarChart3, TrendingUp, Users, Package2, CalendarIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { dialogStyles, iconColors } from '@/app/utils/dialogStyles';
import { useAnalyticsDashboard } from './useAnalyticsDashboard';
import { OutputRatioChart } from './charts/OutputRatioChart';
import { ProductTrendChart } from './charts/ProductTrendChart';
import { StaffWorkloadChart } from './charts/StaffWorkloadChart';

export function AnalyticsDashboardDialog() {
  const { isOpen, closeDashboard } = useAnalyticsDashboard();
  const [timeRange, setTimeRange] = useState('7d');

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && closeDashboard()}>
      <DialogContent className={`${dialogStyles.content} max-h-[90vh] max-w-6xl`}>
        <DialogHeader>
          <DialogTitle className={dialogStyles.title}>
            <BarChart3 className={`h-6 w-6 ${iconColors.blue}`} />
            Analytics Dashboard
          </DialogTitle>
          <DialogDescription className='sr-only'>
            View analytics charts for production output, product trends, and staff workload
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Time Range Selector */}
          <div className='flex items-center justify-between'>
            <div className='text-sm text-slate-400'>
              View analytics for your production and operations
            </div>
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

          {/* Tabs for different charts */}
          <Tabs defaultValue='ratio' className='w-full'>
            <TabsList className='grid w-full grid-cols-3 border border-slate-700/50 bg-slate-800/50'>
              <TabsTrigger
                value='ratio'
                className='data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white'
              >
                <Package2 className='mr-2 h-4 w-4' />
                Finished Transfer
              </TabsTrigger>
              <TabsTrigger
                value='trend'
                className='data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white'
              >
                <TrendingUp className='mr-2 h-4 w-4' />
                Order Trend
              </TabsTrigger>
              <TabsTrigger
                value='workload'
                className='data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white'
              >
                <Users className='mr-2 h-4 w-4' />
                Staff Workload
              </TabsTrigger>
            </TabsList>

            <TabsContent value='ratio' className='mt-6'>
              <OutputRatioChart timeRange={timeRange} />
            </TabsContent>

            <TabsContent value='trend' className='mt-6'>
              <ProductTrendChart timeRange={timeRange} />
            </TabsContent>

            <TabsContent value='workload' className='mt-6'>
              <StaffWorkloadChart timeRange={timeRange} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
