'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';
import { Progress } from '@/components/ui/progress';
import { 
    Tooltip, 
    TooltipContent, 
    TooltipProvider, 
    TooltipTrigger 
} from '@/components/ui/tooltip';

interface AcoRecord {
  order_ref: string;
  code: string;
  required_qty: number | null;
  remain_qty: number | null;
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
          .select('order_ref, code, required_qty, remain_qty');

        if (fetchError) throw fetchError;

        if (data) {
          const groupedByOrderRef = data.reduce((acc, record: AcoRecord) => {
            acc[record.order_ref] = acc[record.order_ref] || { items: [] };
            acc[record.order_ref].items.push(record);
            return acc;
          }, {} as Record<string, { items: AcoRecord[] }>);

          const progressData: OrderProgress[] = Object.entries(groupedByOrderRef)
            .map(([orderRef, { items }]) => {
              const totalRequiredQty = items.reduce((sum, item) => sum + (item.required_qty || 0), 0);
              const totalRemainQty = items.reduce((sum, item) => sum + (item.remain_qty || 0), 0);
              
              if (totalRequiredQty === 0) { 
                return null; 
              }

              const totalCompletedQty = totalRequiredQty - totalRemainQty;
              let progressPercentage = 0;
              if (totalRequiredQty > 0) {
                progressPercentage = Math.max(0, Math.min(100, Math.round((totalCompletedQty / totalRequiredQty) * 100)));
              }
              
              const productsDetails: ProductDetail[] = items.map(item => ({
                code: item.code,
                requiredQty: item.required_qty || 0,
                completedQty: (item.required_qty || 0) - (item.remain_qty || 0),
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
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-400">Loading ACO Status...</p>
      </div>
    );
  }
  if (error) return <div className="text-red-500 bg-red-900 bg-opacity-30 p-3 rounded-md">Error loading ACO Status: {error}</div>;
  if (ordersProgress.length === 0) return <div className="text-gray-400 py-4 text-center">No active ACO orders to display.</div>;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {ordersProgress.map((order) => (
          <Tooltip key={order.orderRef}>
            <TooltipTrigger asChild>
              <div className="bg-gray-700 p-4 rounded-lg shadow-md hover:bg-gray-600 transition-colors duration-150 cursor-default">
                <div className="flex justify-between items-center mb-2">
                  <div>
                      <h3 className="text-md font-semibold text-blue-300">Order Reference : {order.orderRef}</h3>
                  </div>
                  <span className="text-sm font-medium text-white">{order.progressPercentage}%</span>
                </div>
                <Progress value={order.progressPercentage} className="w-full h-2 [&>div]:bg-green-500" />
                <div className="text-xs text-gray-400 mt-1.5 text-right">
                  {order.totalCompletedQty} / {order.totalRequiredQty} Units Completed
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-800 text-white border-gray-700 p-3 rounded-md shadow-lg w-64"> {/* Added w-64 for better layout */}
              <p className="font-bold mb-2 text-sm">Details for Order: {order.orderRef}</p>
              <div className="space-y-1">
                {order.products.map(product => (
                  <div key={product.code} className="text-xs flex justify-between">
                    <span className="font-medium text-gray-300 truncate pr-2" title={product.code}>{product.code}:</span> 
                    <span className="text-gray-200 whitespace-nowrap">{product.completedQty} / {product.requiredQty}</span>
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