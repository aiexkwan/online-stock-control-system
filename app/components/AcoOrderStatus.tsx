'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AcoRecord {
  order_ref: number;
  code: string;
  required_qty: number | null;
  finished_qty: number | null;
}

interface ProductDetail {
  code: string;
  requiredQty: number;
  completedQty: number;
}

interface OrderProgress {
  orderRef: string;
  totalRequiredQty: number;
  totalCompletedQty: number;
  progressPercentage: number;
  products: ProductDetail[]; // Added for tooltip details
}

export default function AcoOrderStatus() {
  const supabase = createClient();
  const [ordersProgress, setOrdersProgress] = useState<OrderProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAcoData() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('record_aco')
          .select('order_ref, code, required_qty, finished_qty');

        if (fetchError) throw fetchError;

        if (data) {
          const groupedByOrderRef = data.reduce(
            (acc: Record<string, { items: AcoRecord[] }>, record: AcoRecord) => {
              const orderRef = String(record.order_ref);
              acc[orderRef] = acc[orderRef] || { items: [] };
              acc[orderRef].items.push(record as AcoRecord);
              return acc;
            },
            {} as Record<string, { items: AcoRecord[] }>
          );

          const progressData: OrderProgress[] = Object.entries(groupedByOrderRef)
            .map(([orderRef, { items }]) => {
              const totalRequiredQty = items.reduce(
                (sum, item) => sum + (item.required_qty || 0),
                0
              );
              const totalCompletedQty = items.reduce(
                (sum, item) => sum + (item.finished_qty || 0),
                0
              );
              const totalRemainQty = totalRequiredQty - totalCompletedQty;

              if (totalRequiredQty === 0) {
                return null;
              }

              let progressPercentage = 0;
              if (totalRequiredQty > 0) {
                progressPercentage = Math.max(
                  0,
                  Math.min(100, Math.round((totalCompletedQty / totalRequiredQty) * 100))
                );
              }

              const productsDetails: ProductDetail[] = items.map(item => ({
                code: item.code,
                requiredQty: item.required_qty || 0,
                completedQty: item.finished_qty || 0,
              }));

              if (totalRemainQty > 0) {
                return {
                  orderRef,
                  totalRequiredQty,
                  totalCompletedQty,
                  progressPercentage,
                  products: productsDetails, // Added product details
                };
              }
              return null;
            })
            .filter(Boolean) as OrderProgress[];

          setOrdersProgress(progressData.sort((a, b) => a.orderRef.localeCompare(b.orderRef)));
        }
      } catch (err) {
        console.error('Error fetching ACO data for status component:', err);
        let errorMessage = 'An unknown error occurred while fetching ACO status';
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        } else {
          try {
            errorMessage = JSON.stringify(err);
          } catch (e) {
            // If stringify fails, keep the generic message
          }
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchAcoData();
  }, [supabase]);

  if (loading) {
    return (
      <div className='flex items-center justify-center py-4'>
        <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500'></div>
        <p className='ml-3 text-gray-400'>Loading ACO Status...</p>
      </div>
    );
  }
  if (error)
    return (
      <div className='rounded-md bg-red-900 bg-opacity-30 p-3 text-red-500'>
        Error loading ACO Status: {error}
      </div>
    );
  if (ordersProgress.length === 0)
    return <div className='py-4 text-center text-gray-400'>No active ACO orders to display.</div>;

  return (
    <TooltipProvider>
      <div className='space-y-4'>
        {ordersProgress.map(order => (
          <Tooltip key={order.orderRef}>
            <TooltipTrigger asChild>
              <div className='cursor-default rounded-lg bg-gray-700 p-4 shadow-md transition-colors duration-150 hover:bg-gray-600'>
                <div className='mb-2 flex items-center justify-between'>
                  <div>
                    <h3 className='text-md font-semibold text-blue-300'>
                      Order Reference : {order.orderRef}
                    </h3>
                  </div>
                  <span className='text-sm font-medium text-white'>
                    {order.progressPercentage}%
                  </span>
                </div>
                <Progress
                  value={order.progressPercentage}
                  className='h-2 w-full [&>div]:bg-green-500'
                />
                <div className='mt-1.5 text-right text-xs text-gray-400'>
                  {order.totalCompletedQty} / {order.totalRequiredQty} Units Completed
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className='w-64 rounded-md border-gray-700 bg-gray-800 p-3 text-white shadow-lg'>
              {' '}
              {/* Added w-64 for better layout */}
              <p className='mb-2 text-sm font-bold'>Details for Order: {order.orderRef}</p>
              <div className='space-y-1'>
                {order.products.map(product => (
                  <div key={product.code} className='flex justify-between text-xs'>
                    <span className='truncate pr-2 font-medium text-gray-300' title={product.code}>
                      {product.code}:
                    </span>
                    <span className='whitespace-nowrap text-gray-200'>
                      {product.completedQty} / {product.requiredQty}
                    </span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
