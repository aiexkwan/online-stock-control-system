'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { gql, useGraphQLQuery } from '@/lib/graphql-client-stable';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, ClipboardList } from 'lucide-react';

const GET_ACO_ORDERS = gql`
  query GetAcoOrders {
    record_acoCollection(
      filter: { remain_qty: { gt: 0 } }
      orderBy: [{ order_ref: DescNullsLast }]
    ) {
      edges {
        node {
          order_ref
          code
          required_qty
          remain_qty
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
  remain_qty: number;
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

    const orders = data.record_acoCollection.edges.map(({ node }: any) => node as AcoOrder);
    
    return orders.reduce((groups, order) => {
      if (!groups[order.order_ref]) {
        groups[order.order_ref] = [];
      }
      groups[order.order_ref].push(order);
      return groups;
    }, {} as Record<number, AcoOrder[]>);
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full bg-slate-700/50" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="bg-red-900/20 border-red-500/50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-red-300">
          Failed to load order data: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  const orderEntries = Object.entries(groupedOrders);

  if (orderEntries.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="text-slate-400">All ACO orders completed</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
      {orderEntries.map(([orderRef, orders], index) => {
        const totalRequired = orders.reduce((sum, order) => sum + order.required_qty, 0);
        const totalRemaining = orders.reduce((sum, order) => sum + order.remain_qty, 0);
        const totalCompleted = totalRequired - totalRemaining;
        const completionPercentage = Math.round((totalCompleted / totalRequired) * 100);
        
        return (
          <motion.div
            key={orderRef}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30 hover:border-orange-500/30 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-orange-300 flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Order {orderRef}
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400">
                  {totalCompleted} / {totalRequired} completed
                </span>
                <div className="bg-orange-500/20 border border-orange-400/30 text-orange-300 px-3 py-1 rounded-lg text-sm font-medium">
                  {completionPercentage}%
                </div>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-slate-600/50 rounded-full h-2 mb-4">
              <motion.div 
                className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            
            {/* Product details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {orders.map((order, index) => {
                const productCompletionPercentage = Math.round(((order.required_qty - order.remain_qty) / order.required_qty) * 100);
                
                return (
                  <div key={`${orderRef}-${order.code}-${index}`} className="bg-slate-800/50 rounded-lg p-3 border border-slate-600/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-200 font-medium">{order.code}</span>
                      <span className="text-xs text-slate-400">
                        {productCompletionPercentage}%
                      </span>
                    </div>
                    <div className="text-sm text-slate-400 mb-2">
                      Required: {order.required_qty} | Remaining: {order.remain_qty}
                    </div>
                    <div className="w-full bg-slate-600/50 rounded-full h-1">
                      <motion.div 
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${productCompletionPercentage}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 + index * 0.1 }}
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
          background: #6B7280;
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9CA3AF;
        }
      `}</style>
    </div>
  );
}