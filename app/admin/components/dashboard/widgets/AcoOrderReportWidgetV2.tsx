/**
 * ACO Order Report Widget V2
 * 使用 DashboardAPI + 服務器端優化
 * 遷移自原 AcoOrderReportWidget
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/ui/use-toast';
import { createDashboardAPIClient as createDashboardAPI } from '@/lib/api/admin/DashboardAPI.client';
import { exportAcoReport } from '@/lib/exportReport';
import { cn } from '@/lib/utils';
import { WidgetComponentProps } from '@/app/types/dashboard';

interface AcoProductData {
  product_code: string;
  required_qty: number | null;
  pallets: Array<{
    plt_num: string | null;
    product_qty: number | null;
    generate_time: string | null;
  }>;
  pallet_count: number;
}

export function AcoOrderReportWidgetV2({ widget, isEditMode }: WidgetComponentProps) {
  const { toast } = useToast();
  const [acoOrders, setAcoOrders] = useState<string[]>([]);
  const [selectedAcoOrder, setSelectedAcoOrder] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    apiResponseTime?: number;
    optimized?: boolean;
  }>({});

  const fetchAcoOrders = useCallback(async () => {
    if (isEditMode) return;

    setLoading(true);
    try {
      const startTime = performance.now();
      const api = createDashboardAPI();

      const result = await api.fetch({
        widgetIds: ['aco_order_refs'],
        params: {
          limit: 100,
          offset: 0,
        },
      });

      const endTime = performance.now();
      setPerformanceMetrics({
        apiResponseTime: Math.round(endTime - startTime),
        optimized: false, // metadata doesn't have optimized property
      });

      // Check if widget data contains error
      if (result.widgets?.[0]?.data?.error) {
        throw new Error(result.widgets[0].data.error);
      }

      const orderRefs = (result.widgets?.[0]?.data?.value as string[]) || [];
      setAcoOrders(orderRefs);

      // Set default selection
      if (orderRefs.length > 0 && !selectedAcoOrder) {
        setSelectedAcoOrder(orderRefs[0]);
      }
    } catch (error) {
      console.error('[AcoOrderReportWidgetV2] Error fetching ACO orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch ACO orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, selectedAcoOrder, isEditMode]);

  // Fetch ACO orders on mount
  useEffect(() => {
    if (!isEditMode) {
      fetchAcoOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

  const handleGenerateReport = async () => {
    if (!selectedAcoOrder) {
      toast({
        title: 'No Order Selected',
        description: 'Please select an ACO order',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const startTime = performance.now();
      const api = createDashboardAPI();

      // Get report data from server
      const result = await api.fetch({
        widgetIds: ['aco_order_report'],
        params: {
          // Use a generic param or extend DashboardParams type
          staticValue: parseInt(selectedAcoOrder, 10),
          dataSource: 'aco_order_report',
        },
      });

      const endTime = performance.now();
      console.log(
        `[AcoOrderReportWidgetV2] Server fetch time: ${Math.round(endTime - startTime)}ms`
      );

      // Check if widget data contains error
      if (result.widgets?.[0]?.data?.error) {
        throw new Error(result.widgets[0].data.error);
      }

      const reportData = result.widgets?.[0]?.data?.value as AcoProductData[];

      // Generate Excel report
      await exportAcoReport(reportData, selectedAcoOrder);

      toast({
        title: 'Success',
        description: `ACO order ${selectedAcoOrder} report generated successfully`,
      });

      // Log performance metrics
      if (result.metadata?.processingTime) {
        console.log(
          `[AcoOrderReportWidgetV2] Server-side processing: ${result.metadata.processingTime}ms`
        );
      }
    } catch (error) {
      console.error('[AcoOrderReportWidgetV2] Error generating report:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card
      className={cn(
        'h-full bg-slate-900/50 backdrop-blur-xl',
        'border border-slate-700/50',
        'shadow-[0_0_30px_rgba(0,0,0,0.3)]',
        'transition-all duration-300',
        'hover:shadow-[0_0_40px_rgba(0,0,0,0.4)]',
        'overflow-visible'
      )}
    >
      <CardContent className='flex h-full flex-col p-4'>
        <div className='flex h-full flex-col'>
          {/* Title */}
          <div className='mb-3 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <DocumentArrowDownIcon className='h-5 w-5 text-cyan-500' />
              <h3 className='text-sm font-semibold text-white'>ACO Order Report</h3>
            </div>
            {performanceMetrics.apiResponseTime && (
              <span className='text-xs text-slate-400'>
                {performanceMetrics.apiResponseTime}ms
                {performanceMetrics.optimized && ' (optimized)'}
              </span>
            )}
          </div>

          {/* Content */}
          <div className='flex flex-1 items-center'>
            <div className='flex w-full items-center gap-3'>
              {/* ACO Order Selector */}
              <div className='flex-1'>
                <Label htmlFor='aco-order' className='sr-only'>
                  ACO Order
                </Label>
                <Select
                  value={selectedAcoOrder}
                  onValueChange={setSelectedAcoOrder}
                  disabled={isEditMode || loading || acoOrders.length === 0}
                >
                  <SelectTrigger
                    id='aco-order'
                    className='h-9 w-full border-slate-600 bg-slate-800 text-sm text-white'
                  >
                    <SelectValue
                      placeholder={
                        loading
                          ? 'Loading...'
                          : acoOrders.length === 0
                            ? 'No ACO orders'
                            : 'Select ACO order'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className='border-slate-600 bg-slate-800'>
                    {acoOrders.map(order => (
                      <SelectItem
                        key={order}
                        value={order}
                        className='text-sm text-white hover:bg-slate-700'
                      >
                        {order}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateReport}
                disabled={
                  isEditMode ||
                  loading ||
                  isGenerating ||
                  acoOrders.length === 0 ||
                  !selectedAcoOrder
                }
                className={cn(
                  'h-9 px-3',
                  'bg-cyan-600 hover:bg-cyan-700',
                  'text-sm font-medium text-white',
                  'border-0',
                  'transition-all duration-200',
                  'disabled:bg-slate-700 disabled:text-slate-400'
                )}
              >
                {isGenerating ? (
                  <>
                    <span className='mr-2 h-3 w-3 animate-spin rounded-full border-b-2 border-white' />
                    Generating...
                  </>
                ) : (
                  'Generate Report'
                )}
              </Button>
            </div>
          </div>

          {/* Helper Text */}
          {acoOrders.length === 0 && !loading && (
            <p className='mt-2 text-xs text-slate-500'>No ACO order data available</p>
          )}

          {/* Performance indicator */}
          {performanceMetrics.optimized && (
            <div className='mt-2 text-center text-[10px] text-green-400'>
              ✓ Server-side optimized
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AcoOrderReportWidgetV2;
