/**
 * DepartInjCard - Injection Department Card
 * Shows department-specific metrics and information for the Injection department
 * Now using GraphQL for data fetching
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Package, TrendingUp, Monitor, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, gql } from '@apollo/client';
import { Skeleton } from '@/components/ui/skeleton';
import type { StockItem, MachineState } from '@/lib/graphql/types/database-types';
import { ReportCard } from '@/lib/card-system/EnhancedGlassmorphicCard';
import { cardTextStyles } from '@/lib/card-system/theme';

// GraphQL Query
const DEPARTMENT_INJECTION_QUERY = gql`
  query GetDepartmentInjectionData {
    departmentInjectionData {
      stats {
        todayFinished
        past7Days
        past14Days
        lastUpdated
      }
      topStocks {
        nodes {
          stock
          description
          stockLevel
          updateTime
        }
        totalCount
      }
      materialStocks {
        nodes {
          stock
          description
          stockLevel
          updateTime
        }
        totalCount
      }
      machineStates {
        machineNumber
        lastActiveTime
        state
      }
      loading
      error
    }
  }
`;

interface DepartInjCardProps {
  title?: string;
  description?: string;
  isEditMode?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendUp, loading }) => {
  return (
    <div className='rounded-lg border border-slate-700 bg-slate-800/50 p-4'>
      <div className='flex items-center justify-between'>
        <div className='flex-1'>
          <p className={cn(cardTextStyles.labelSmall, 'text-slate-400')}>{title}</p>
          {loading ? (
            <Skeleton className='mt-1 h-8 w-20' />
          ) : (
            <p className={cn(cardTextStyles.title, 'mt-1')}>{value}</p>
          )}
          {trend && !loading && (
            <p
              className={cn(
                cardTextStyles.bodySmall,
                'mt-1',
                trendUp ? 'text-green-400' : 'text-red-400'
              )}
            >
              {trend}
            </p>
          )}
        </div>
        <div className='text-slate-400'>{icon}</div>
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className='space-y-2'>
    <Skeleton className='h-4 w-full' />
    <Skeleton className='h-4 w-full' />
    <Skeleton className='h-4 w-3/4' />
  </div>
);

export const DepartInjCard: React.FC<DepartInjCardProps> = ({
  title = 'Injection Department',
  description = 'Real-time metrics and statistics for the Injection department',
  isEditMode = false,
}) => {
  // Use GraphQL query with polling every 60 seconds
  const { data, loading, error } = useQuery(DEPARTMENT_INJECTION_QUERY, {
    pollInterval: 60000, // Poll every 60 seconds (1 minute)
    fetchPolicy: 'cache-and-network', // Use cache but also fetch fresh data
  });

  // Extract data from GraphQL response
  const injectionData = data?.departmentInjectionData;
  const stats = injectionData?.stats || {};

  // Memoize computed values to prevent unnecessary re-renders
  const topStocks = React.useMemo(
    () => injectionData?.topStocks?.nodes || [],
    [injectionData?.topStocks?.nodes]
  );

  const materialStocks = React.useMemo(
    () => injectionData?.materialStocks?.nodes || [],
    [injectionData?.materialStocks?.nodes]
  );

  const machineStates = React.useMemo(
    () => injectionData?.machineStates || [],
    [injectionData?.machineStates]
  );

  // Debug: Log the actual data structure
  React.useEffect(() => {
    if (topStocks.length > 0) {
      console.log('[DepartInjCard] Sample topStock item:', topStocks[0]);
      console.log('[DepartInjCard] updateTime type:', typeof topStocks[0]?.updateTime);
      console.log('[DepartInjCard] updateTime value:', topStocks[0]?.updateTime);
      console.log('[DepartInjCard] Date parse result:', new Date(topStocks[0]?.updateTime));
    }
    if (materialStocks.length > 0) {
      console.log('[DepartInjCard] Sample materialStock item:', materialStocks[0]);
      console.log('[DepartInjCard] updateTime type:', typeof materialStocks[0]?.updateTime);
      console.log('[DepartInjCard] updateTime value:', materialStocks[0]?.updateTime);
      console.log('[DepartInjCard] Date parse result:', new Date(materialStocks[0]?.updateTime));
    }
  }, [topStocks, materialStocks]);

  // Handle error state
  if (error) {
    console.error('[DepartInjCard] GraphQL Error:', error);
  }

  return (
    <ReportCard className='h-full' borderGlow='hover' variant='glass' padding='base'>
      <div className='mb-6 space-y-2'>
        <h3 className={cardTextStyles.title}>{title}</h3>
        <p className={cn(cardTextStyles.bodySmall, 'text-slate-400')}>{description}</p>
      </div>
      <div className='space-y-6'>
        {/* Top Stats Row */}
        <div className='grid grid-cols-3 gap-4'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <StatCard
              title='Today Finished'
              value={loading ? '...' : stats.todayFinished?.toLocaleString() || '0'}
              icon={<Activity className='h-6 w-6' />}
              loading={loading}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StatCard
              title='Past 7 days'
              value={loading ? '...' : stats.past7Days?.toLocaleString() || '0'}
              icon={<Package className='h-6 w-6' />}
              loading={loading}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <StatCard
              title='Past 14 days'
              value={loading ? '...' : stats.past14Days?.toLocaleString() || '0'}
              icon={<TrendingUp className='h-6 w-6' />}
              loading={loading}
            />
          </motion.div>
        </div>

        {/* Middle Section - Two columns */}
        <div className='grid grid-cols-2 gap-4'>
          {/* Top 10 Stock */}
          <div className='rounded-lg border border-slate-700 bg-slate-800/50 p-4'>
            <h3 className={cn(cardTextStyles.subtitle, 'mb-4')}>Top 10 Stock</h3>
            <div className='overflow-hidden'>
              <table className='w-full table-fixed text-sm'>
                <thead>
                  <tr className='border-b border-slate-700'>
                    <th
                      className={cn(
                        'w-[25%] pb-2 text-left',
                        cardTextStyles.labelSmall,
                        'text-slate-400'
                      )}
                    >
                      Product Code
                    </th>
                    <th
                      className={cn(
                        'w-[40%] pb-2 text-left',
                        cardTextStyles.labelSmall,
                        'text-slate-400'
                      )}
                    >
                      Description
                    </th>
                    <th
                      className={cn(
                        'w-[20%] pb-2 text-left',
                        cardTextStyles.labelSmall,
                        'text-slate-400'
                      )}
                    >
                      Latest Update
                    </th>
                    <th
                      className={cn(
                        'w-[15%] pb-2 text-right',
                        cardTextStyles.labelSmall,
                        'text-slate-400'
                      )}
                    >
                      Qty
                    </th>
                  </tr>
                </thead>
              </table>
              <ScrollArea className='h-[150px]'>
                <table className='w-full table-fixed text-sm'>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className='py-4'>
                          <LoadingSkeleton />
                        </td>
                      </tr>
                    ) : topStocks.length === 0 ? (
                      <tr>
                        <td colSpan={4} className='py-4 text-center text-slate-400'>
                          No data available
                        </td>
                      </tr>
                    ) : (
                      topStocks.map((item: StockItem) => (
                        <tr key={item.stock} className='border-b border-slate-700/50'>
                          <td className={cn('w-[25%] py-2', cardTextStyles.bodySmall)}>
                            {item.stock}
                          </td>
                          <td
                            className={cn(
                              'w-[40%] truncate py-2 pr-2',
                              cardTextStyles.labelSmall,
                              'text-slate-400'
                            )}
                            title={item.description}
                          >
                            {item.description}
                          </td>
                          <td
                            className={cn(
                              'w-[20%] py-2',
                              cardTextStyles.labelSmall,
                              'text-slate-400'
                            )}
                          >
                            {(() => {
                              if (!item.updateTime) return '-';
                              try {
                                const date = new Date(item.updateTime);
                                return isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
                              } catch (e) {
                                console.error(
                                  '[DepartInjCard] Date parsing error for topStock:',
                                  item.updateTime,
                                  e
                                );
                                return '-';
                              }
                            })()}
                          </td>
                          <td className={cn('w-[15%] py-2 text-right', cardTextStyles.bodySmall)}>
                            {item.stockLevel?.toLocaleString() || '0'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          </div>

          {/* Material Stock */}
          <div className='rounded-lg border border-slate-700 bg-slate-800/50 p-4'>
            <h3 className={cn(cardTextStyles.subtitle, 'mb-4')}>Material Stock</h3>
            <div className='overflow-hidden'>
              <table className='w-full table-fixed text-sm'>
                <thead>
                  <tr className='border-b border-slate-700'>
                    <th
                      className={cn(
                        'w-[25%] pb-2 text-left',
                        cardTextStyles.labelSmall,
                        'text-slate-400'
                      )}
                    >
                      Material Code
                    </th>
                    <th
                      className={cn(
                        'w-[40%] pb-2 text-left',
                        cardTextStyles.labelSmall,
                        'text-slate-400'
                      )}
                    >
                      Description
                    </th>
                    <th
                      className={cn(
                        'w-[20%] pb-2 text-left',
                        cardTextStyles.labelSmall,
                        'text-slate-400'
                      )}
                    >
                      Latest Update
                    </th>
                    <th
                      className={cn(
                        'w-[15%] pb-2 text-right',
                        cardTextStyles.labelSmall,
                        'text-slate-400'
                      )}
                    >
                      Qty
                    </th>
                  </tr>
                </thead>
              </table>
              <ScrollArea className='h-[150px]'>
                <table className='w-full table-fixed text-sm'>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className='py-4'>
                          <LoadingSkeleton />
                        </td>
                      </tr>
                    ) : materialStocks.length === 0 ? (
                      <tr>
                        <td colSpan={4} className='py-4 text-center text-slate-400'>
                          No material data available
                        </td>
                      </tr>
                    ) : (
                      materialStocks.map((item: StockItem) => (
                        <tr key={item.stock} className='border-b border-slate-700/50'>
                          <td className={cn('w-[25%] py-2', cardTextStyles.bodySmall)}>
                            {item.stock}
                          </td>
                          <td
                            className={cn(
                              'w-[40%] truncate py-2 pr-2',
                              cardTextStyles.labelSmall,
                              'text-slate-400'
                            )}
                            title={item.description}
                          >
                            {item.description}
                          </td>
                          <td
                            className={cn(
                              'w-[20%] py-2',
                              cardTextStyles.labelSmall,
                              'text-slate-400'
                            )}
                          >
                            {(() => {
                              if (!item.updateTime) return '-';
                              try {
                                const date = new Date(item.updateTime);
                                return isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
                              } catch (e) {
                                console.error(
                                  '[DepartInjCard] Date parsing error for topStock:',
                                  item.updateTime,
                                  e
                                );
                                return '-';
                              }
                            })()}
                          </td>
                          <td className={cn('w-[15%] py-2 text-right', cardTextStyles.bodySmall)}>
                            {item.stockLevel?.toLocaleString() || '0'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Bottom Section - Machine State and Coming Soon */}
        <div className='grid grid-cols-2 gap-4'>
          <div className='rounded-lg border border-slate-700 bg-slate-800/50 p-4'>
            <h3 className={cn(cardTextStyles.subtitle, 'mb-4')}>Machine State</h3>
            <div className='overflow-hidden'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-slate-700'>
                    <th
                      className={cn('pb-2 text-left', cardTextStyles.labelSmall, 'text-slate-400')}
                    >
                      Machine Number
                    </th>
                    <th
                      className={cn('pb-2 text-left', cardTextStyles.labelSmall, 'text-slate-400')}
                    >
                      Latest Active time
                    </th>
                    <th
                      className={cn('pb-2 text-left', cardTextStyles.labelSmall, 'text-slate-400')}
                    >
                      State
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} className='py-4'>
                        <LoadingSkeleton />
                      </td>
                    </tr>
                  ) : (
                    machineStates.map((machine: MachineState) => (
                      <tr key={machine.machineNumber} className='border-b border-slate-700/50'>
                        <td className={cn('py-2', cardTextStyles.bodySmall)}>
                          {machine.machineNumber}
                        </td>
                        <td className={cn('py-2', cardTextStyles.labelSmall, 'text-slate-400')}>
                          N/A
                        </td>
                        <td className={cn('py-2', cardTextStyles.labelSmall, 'text-slate-400')}>
                          N/A
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className='rounded-lg border border-slate-700 bg-slate-800/50 p-4'>
            <h3 className={cn(cardTextStyles.subtitle, 'mb-2')}>Coming Soon</h3>
            <div className='h-32'>{/* No content to display */}</div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className='rounded-lg border border-red-700 bg-red-900/20 p-4'>
            <p className={cn(cardTextStyles.bodySmall, 'text-red-400')}>
              Error loading data. The system will retry automatically.
            </p>
          </div>
        )}
      </div>
    </ReportCard>
  );
};

export default DepartInjCard;
