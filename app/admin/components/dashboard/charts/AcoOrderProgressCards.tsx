'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
// Migrated to REST API - GraphQL hooks removed
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, ClipboardList } from 'lucide-react';
import { restRequest } from '@/lib/api/unified-api-client';

interface AcoOrderProgressCard {
  id: string;
  title: string;
  value: number;
  previousValue?: number;
  percentageChange?: number;
  trend?: 'up' | 'down' | 'stable';
  description?: string;
  category?: string;
  icon?: string;
  color?: string;
}

interface AcoOrderProgressCardsResponse {
  cards: AcoOrderProgressCard[];
  totalCards: number;
  dateRange?: string;
  lastUpdated: string;
  metadata?: Record<string, any>;
}

interface AcoOrderProgressCardsProps {
  timeFrame?: any;
  useGraphQL?: boolean;
}

export default function AcoOrderProgressCards({ timeFrame, useGraphQL = false }: AcoOrderProgressCardsProps) {
  const [data, setData] = useState<AcoOrderProgressCardsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await restRequest<AcoOrderProgressCardsResponse>(
          'GET',
          '/analysis/aco-order-progress-cards',
          undefined,
          {
            startDate: timeFrame?.startDate,
            endDate: timeFrame?.endDate,
            warehouse: timeFrame?.warehouse,
          }
        );

        if (response.success && response.data) {
          setData(response.data);
        } else {
          setError(response.error || 'Failed to fetch data');
        }
      } catch (err) {
        setError(err instanceof Error ? (err as { message: string }).message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Poll every 5 minutes
    const interval = setInterval(fetchData, 300000);
    
    return () => clearInterval(interval);
  }, [timeFrame as string]);

  const displayCards = useMemo(() => {
    if (!data?.cards) return [];
    
    // Format cards for display
    return data.cards.map((card) => ({
      ...card,
      completionPercentage: card.value,
      orderRef: card.title.replace('Order ', ''),
    }));
  }, [data as string]);

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
          Failed to load order data: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (displayCards.length === 0) {
    return (
      <div className='py-8 text-center'>
        <CheckCircle className='mx-auto mb-3 h-12 w-12 text-green-500' />
        <p className='text-slate-400'>All ACO orders completed</p>
      </div>
    );
  }

  return (
    <div className='custom-scrollbar max-h-[600px] space-y-4 overflow-y-auto pr-2'>
      {displayCards.map((card, index) => {
        const completionPercentage = Math.round(card.completionPercentage);
        const trendColor = card.trend === 'up' ? 'text-green-400' : 
                          card.trend === 'down' ? 'text-red-400' : 'text-slate-400';
        
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`rounded-lg border border-slate-600/30 bg-slate-700/30 p-4 transition-all duration-300 hover:border-orange-500/30 ${card.color ? `border-${card.color}-500/20` : ''}`}
          >
            <div className='mb-3 flex items-center justify-between'>
              <h3 className='flex items-center gap-2 text-lg font-semibold text-orange-300'>
                <ClipboardList className='h-5 w-5' />
                {card.title}
              </h3>
              <div className='flex items-center gap-3'>
                {card.description && (
                  <span className='text-sm text-slate-400'>
                    {card.description}
                  </span>
                )}
                <div className='rounded-lg border border-orange-400/30 bg-orange-500/20 px-3 py-1 text-sm font-medium text-orange-300'>
                  {completionPercentage}%
                </div>
                {card.percentageChange && (
                  <div className={`text-xs ${trendColor}`}>
                    {card.percentageChange > 0 ? '+' : ''}{card.percentageChange.toFixed(1)}%
                  </div>
                )}
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

            {/* Card details */}
            <div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'>
              <div className='rounded-lg border border-slate-600/20 bg-slate-800/50 p-3'>
                <div className='mb-2 flex items-center justify-between'>
                  <span className='font-medium text-slate-200'>Value</span>
                  <span className='text-xs text-slate-400'>{card.value}</span>
                </div>
                {card.previousValue && (
                  <div className='mb-2 text-sm text-slate-400'>
                    Previous: {card.previousValue}
                  </div>
                )}
                <div className='h-1 w-full rounded-full bg-slate-600/50'>
                  <motion.div
                    className='h-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500'
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 + index * 0.1 }}
                  />
                </div>
              </div>
              
              {card.category && (
                <div className='rounded-lg border border-slate-600/20 bg-slate-800/50 p-3'>
                  <div className='mb-2 flex items-center justify-between'>
                    <span className='font-medium text-slate-200'>Category</span>
                  </div>
                  <div className='text-sm text-slate-400'>
                    {card.category}
                  </div>
                </div>
              )}
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
