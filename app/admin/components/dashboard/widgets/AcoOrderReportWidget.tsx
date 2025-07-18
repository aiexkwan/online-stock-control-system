/**
 * ACO Order Report Widget
 * 遷移至 REST API 架構，移除版本號
 * 使用 NestJS ACO API 端點進行數據獲取
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
import { exportAcoReport } from '@/lib/exportReport';
import { cn } from '@/lib/utils';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { 
  brandColors, 
  widgetColors, 
  semanticColors,
  getWidgetCategoryColor 
} from '@/lib/design-system/colors';
import { textClasses, getTextClass } from '@/lib/design-system/typography';
import { spacing, widgetSpacing, spacingUtilities } from '@/lib/design-system/spacing';

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

// REST API client for ACO endpoints
const acoApiClient = {
  async getReferences(): Promise<string[]> {
    const response = await fetch('/api/v1/aco/references', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ACO references: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.references || [];
  },

  async getOrdersByDate(orderDate: string): Promise<any[]> {
    const url = new URL('/api/v1/aco/orders-by-date', window.location.origin);
    url.searchParams.append('orderDate', orderDate);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ACO orders: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.records || [];
  },
};

export function AcoOrderReportWidget({ widget, isEditMode }: WidgetComponentProps) {
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
      
      const refs = await acoApiClient.getReferences();
      const endTime = performance.now();
      
      setPerformanceMetrics({
        apiResponseTime: Math.round(endTime - startTime),
        optimized: true,
      });

      setAcoOrders(refs);
      
      // Set default selection to first available order
      if (refs.length > 0 && !selectedAcoOrder) {
        setSelectedAcoOrder(refs[0]);
      }
    } catch (error) {
      console.error('[AcoOrderReportWidget as string] Error fetching ACO orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch ACO order references',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [isEditMode, selectedAcoOrder, toast]);

  useEffect(() => {
    fetchAcoOrders();
  }, [fetchAcoOrders]);

  const handleGenerateReport = async () => {
    if (!selectedAcoOrder) {
      toast({
        title: 'No Order Selected',
        description: 'Please select an ACO order date',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Get ACO orders for the selected date
      const orderRecords = await acoApiClient.getOrdersByDate(selectedAcoOrder);
      
      if (!orderRecords || orderRecords.length === 0) {
        toast({
          title: 'No Data',
          description: 'No ACO order data found for the selected date',
          variant: 'destructive',
        });
        return;
      }

      // Transform data for export
      const processedData = processOrderRecords(orderRecords);
      const orderRef = orderRecords[0]?.aco_ref || 'N/A';

      // Export the report
      await exportAcoReport(processedData, orderRef);

      toast({
        title: 'Success',
        description: 'ACO order report generated successfully',
      });
    } catch (error) {
      console.error('[AcoOrderReportWidget as string] Error generating report:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? (error as { message: string }).message : 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Process order records to group by product code
  const processOrderRecords = (records: Record<string, unknown>[]): AcoProductData[] => {
    const productMap = new Map<string, AcoProductData>();

    records.forEach(record => {
      const productCode = record.product_code;
      if (!productCode) return;

      if (!productMap.has(productCode)) {
        productMap.set(productCode, {
          product_code: productCode,
          required_qty: record.product_quantity || 0,
          pallets: [],
          pallet_count: 0,
        });
      }

      const product = productMap.get(productCode)!;
      
      // Add pallet info if available
      if (record.plt_num) {
        product.pallets.push({
          plt_num: record.plt_num,
          product_qty: record.product_quantity,
          generate_time: record.created_at,
        });
        product.pallet_count = product.pallets.length;
      }
    });

    return Array.from(productMap.values());
  };

  if (isEditMode) {
    return (
      <Card className={cn('h-full w-full', 'border-border bg-card/40')}>
        <CardContent className={cn('flex h-full items-center justify-center', widgetSpacing.container)}>
          <div className='text-center'>
            <h3 className={cn(textClasses['body-medium'], 'font-semibold text-foreground')}>
              ACO Order Report
            </h3>
            <p className={cn(textClasses['body-small'], 'text-muted-foreground')}>
              Generate ACO order reports
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('h-full w-full border-border bg-card/40')}>
      <CardContent className={cn('h-full', widgetSpacing.container)}>
        <div className='flex h-full flex-col'>
          {/* Header */}
          <div className='flex-shrink-0 pb-4'>
            <h3 className={cn(textClasses['body-small'], 'font-semibold text-foreground')}>
              ACO Order Report
            </h3>
            <p className={cn(textClasses['label-small'], 'text-muted-foreground')}>
              Generate and download ACO order reports
            </p>
          </div>

          {/* Main Content */}
          <div className='flex flex-1 flex-col justify-between'>
            {/* Order Selection */}
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label className={cn(textClasses['label-medium'], 'text-foreground')}>
                  Order Date
                </Label>
                <Select
                  value={selectedAcoOrder}
                  onValueChange={(value) => setSelectedAcoOrder(value)}
                  disabled={loading || acoOrders.length === 0}
                >
                  <SelectTrigger className={cn(
                    'w-full',
                    'bg-background/50 hover:bg-background/70',
                    'border-border hover:border-border/80',
                    'text-foreground',
                    textClasses['body-small']
                  )}>
                    <SelectValue 
                      placeholder={
                        loading 
                          ? "Loading orders..." 
                          : acoOrders.length === 0 
                            ? "No orders available" 
                            : "Select order date"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent className='border-border bg-card'>
                    {acoOrders.map((order) => (
                      <SelectItem key={order} value={order} className={cn(
                        'text-foreground hover:bg-accent',
                        textClasses['body-small']
                      )}>
                        {order}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loading && (
                <p className={cn(textClasses['label-small'], 'text-muted-foreground')}>
                  Loading ACO orders...
                </p>
              )}

              {!loading && acoOrders.length === 0 && (
                <p className={cn(textClasses['label-small'], 'text-muted-foreground')}>
                  No ACO orders found
                </p>
              )}
            </div>

            {/* Action Button */}
            <div className='flex-shrink-0 pt-4'>
              <Button
                onClick={handleGenerateReport}
                disabled={!selectedAcoOrder || isGenerating || loading}
                size='sm'
                className={cn(
                  'w-full gap-2',
                  'bg-gradient-to-r',
                  getWidgetCategoryColor('reports', 'gradient'),
                  'font-medium text-primary-foreground',
                  'transition-all duration-200',
                  textClasses['body-small']
                )}
              >
                {isGenerating ? (
                  <>
                    <div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                    Generating...
                  </>
                ) : (
                  <>
                    <DocumentArrowDownIcon className='h-4 w-4' />
                    Generate Report
                  </>
                )}
              </Button>
            </div>

            {/* Performance Indicator */}
            {performanceMetrics.optimized && performanceMetrics.apiResponseTime && (
              <div className={cn(
                'mt-2 text-right',
                textClasses['label-small']
              )} style={{ color: semanticColors.success.DEFAULT }}>
                ✓ REST API optimized ({performanceMetrics.apiResponseTime}ms)
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AcoOrderReportWidget;