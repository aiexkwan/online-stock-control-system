'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { gql, useGraphQLQuery } from '@/lib/graphql-client-stable';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, ClipboardList } from 'lucide-react';

const GET_ACO_ORDERS = gql`
  query GetAcoOrdersForCards {
    record_acoCollection(orderBy: [{ order_ref: DescNullsLast }]) {
      edges {
        node {
          order_ref
          code
          required_qty
          finished_qty
          latest_update
        }
      }
    }
  }
`;

interface AcoOrder {
  order_ref: number;
  code: string;
  required_qty: number;
  finished_qty: number;
  latest_update: string;
}

interface AcoOrderProgressCardsProps {
  timeFrame?: any;
}

export default function AcoOrderProgressCards({ timeFrame }: AcoOrderProgressCardsProps) {
  const { data, loading, error } = useGraphQLQuery(GET_ACO_ORDERS);

  // Group orders by order_ref
  const groupedOrders = useMemo(() => {
    if (!data?.record_acoCollection?.edges) return {};

    const orders = data.record_acoCollection.edges
      .map(({ node }: any) => node as AcoOrder)
      // Filter out completed orders
      .filter((order: AcoOrder) => {
        const remainingQty = order.required_qty - (order.finished_qty || 0);
        return remainingQty > 0;
      });

    return orders.reduce(
      (groups: Record<string, AcoOrder[]>, order: AcoOrder) => {
        if (!groups[order.order_ref]) {
          groups[order.order_ref] = [];
        }
        groups[order.order_ref].push(order);
        return groups;
      },
      {} as Record<number, AcoOrder[]>
    );
  }, [data]);

  if (loading) {
    return (
      <div className='space-y-3'>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className='h-32 w-full bg-slate-700/50' />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant='destructive' className='border-red-500/50 bg-red-900/20'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription className='text-red-300'>
          Failed to load order data: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  const orderEntries = Object.entries(groupedOrders);

  if (orderEntries.length === 0) {
    return (
      <div className='py-8 text-center'>
        <CheckCircle className='mx-auto mb-3 h-12 w-12 text-green-500' />
        <p className='text-slate-400'>All ACO orders completed</p>
      </div>
    );
  }

  return (
    <div className='custom-scrollbar max-h-[600px] space-y-4 overflow-y-auto pr-2'>
      {orderEntries.map(([orderRef, orders], index) => {
        const totalRequired = (orders as AcoOrder[]).reduce((sum: number, order: AcoOrder) => sum + order.required_qty, 0);
        const totalCompleted = (orders as AcoOrder[]).reduce((sum: number, order: AcoOrder) => sum + (order.finished_qty || 0), 0);
        const totalRemaining = totalRequired - totalCompleted;
        const completionPercentage = Math.round((totalCompleted / totalRequired) * 100);

        return (
          <motion.div
            key={orderRef}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className='rounded-lg border border-slate-600/30 bg-slate-700/30 p-4 transition-all duration-300 hover:border-orange-500/30'
          >
            <div className='mb-3 flex items-center justify-between'>
              <h3 className='flex items-center gap-2 text-lg font-semibold text-orange-300'>
                <ClipboardList className='h-5 w-5' />
                Order {orderRef}
              </h3>
              <div className='flex items-center gap-3'>
                <span className='text-sm text-slate-400'>
                  {totalCompleted} / {totalRequired} completed
                </span>
                <div className='rounded-lg border border-orange-400/30 bg-orange-500/20 px-3 py-1 text-sm font-medium text-orange-300'>
                  {completionPercentage}%
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className='mb-4 h-2 w-full rounded-full bg-slate-600/50'>
              <motion.div
                className='h-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500'
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>

            {/* Product details */}
            <div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'>
              {(orders as AcoOrder[]).map((order: AcoOrder, index: number) => {
                const remainingQty = order.required_qty - (order.finished_qty || 0);
                const productCompletionPercentage = Math.round(
                  ((order.finished_qty || 0) / order.required_qty) * 100
                );

                return (
                  <div
                    key={`${orderRef}-${order.code}-${index}`}
                    className='rounded-lg border border-slate-600/20 bg-slate-800/50 p-3'
                  >
                    <div className='mb-2 flex items-center justify-between'>
                      <span className='font-medium text-slate-200'>{order.code}</span>
                      <span className='text-xs text-slate-400'>{productCompletionPercentage}%</span>
                    </div>
                    <div className='mb-2 text-sm text-slate-400'>
                      Required: {order.required_qty} | Remaining: {remainingQty}
                    </div>
                    <div className='h-1 w-full rounded-full bg-slate-600/50'>
                      <motion.div
                        className='h-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500'
                        initial={{ width: 0 }}
                        animate={{ width: `${productCompletionPercentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 + index * 0.1 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #374151;
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #6b7280;
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}
