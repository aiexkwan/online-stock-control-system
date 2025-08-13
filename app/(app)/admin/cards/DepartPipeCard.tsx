/**
 * DepartPipeCard - Pipe Line Department Card
 * Shows department-specific metrics and information for the Pipe Line department
 * Now using GraphQL for optimized data fetching
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

// GraphQL Query for Pipe Department - Fixed Connection format
const DEPARTMENT_PIPE_QUERY = gql`
  query GetDepartmentPipeData {
    departmentPipeData {
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
          type
          realTimeLevel
          lastStockUpdate
        }
        totalCount
        pageInfo {
          hasNextPage
          hasPreviousPage
        }
      }
      materialStocks {
        nodes {
          stock
          description
          stockLevel
          updateTime
          type
          realTimeLevel
          lastStockUpdate
        }
        totalCount
        pageInfo {
          hasNextPage
          hasPreviousPage
        }
      }
      machineStates {
        machineNumber
        lastActiveTime
        state
        efficiency
        currentTask
        nextMaintenance
      }
      pipeProductionRate
      materialConsumptionRate
      loading
      error
    }
  }
`;

interface DepartPipeCardProps {
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
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={cn(cardTextStyles.labelSmall, "text-slate-400")}>{title}</p>
          {loading ? (
            <Skeleton className="mt-1 h-8 w-20" />
          ) : (
            <p className={cn(cardTextStyles.title, "mt-1")}>{value}</p>
          )}
          {trend && !loading && (
            <p className={cn(cardTextStyles.bodySmall, "mt-1", trendUp ? "text-green-400" : "text-red-400")}>
              {trend}
            </p>
          )}
        </div>
        <div className="text-slate-400">
          {icon}
        </div>
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
  </div>
);

export const DepartPipeCard: React.FC<DepartPipeCardProps> = ({
  title = 'Pipe Line Department',
  description = 'Real-time metrics and statistics for the Pipe Line department',
  isEditMode = false,
}) => {
  const { data, loading, error } = useQuery(DEPARTMENT_PIPE_QUERY, {
    pollInterval: 60000, // Refresh every minute
    fetchPolicy: 'cache-and-network',
  });

  const departmentData = data?.departmentPipeData;

  // Handle error state
  if (error) {
    console.error('[DepartPipeCard] GraphQL Error:', error);
  }

  return (
    <ReportCard
      className="h-full"
      borderGlow="hover"
      variant="glass"
      padding="base"
    >
      <div className="space-y-2 mb-6">
        <h3 className={cardTextStyles.title}>{title}</h3>
        <p className={cn(cardTextStyles.bodySmall, "text-slate-400")}>{description}</p>
      </div>
      <div className="space-y-6">
        {/* Top Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <StatCard
              title="Today Finished"
              value={loading ? '...' : departmentData?.stats?.todayFinished?.toLocaleString() || '0'}
              icon={<Activity className="h-6 w-6" />}
              loading={loading}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StatCard
              title="Past 7 days"
              value={loading ? '...' : departmentData?.stats?.past7Days?.toLocaleString() || '0'}
              icon={<Package className="h-6 w-6" />}
              loading={loading}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <StatCard
              title="Past 14 days"
              value={loading ? '...' : departmentData?.stats?.past14Days?.toLocaleString() || '0'}
              icon={<TrendingUp className="h-6 w-6" />}
              loading={loading}
            />
          </motion.div>
        </div>

        {/* Middle Section - Two columns */}
        <div className="grid grid-cols-2 gap-4">
          {/* Top 10 Stock */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <h3 className={cn(cardTextStyles.subtitle, "mb-4")}>Top 10 Stock</h3>
            <div className="overflow-hidden">
              <table className="w-full text-sm table-fixed">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className={cn("text-left pb-2 w-[25%]", cardTextStyles.labelSmall, "text-slate-400")}>Product Code</th>
                    <th className={cn("text-left pb-2 w-[40%]", cardTextStyles.labelSmall, "text-slate-400")}>Description</th>
                    <th className={cn("text-left pb-2 w-[20%]", cardTextStyles.labelSmall, "text-slate-400")}>Latest Update</th>
                    <th className={cn("text-right pb-2 w-[15%]", cardTextStyles.labelSmall, "text-slate-400")}>Qty</th>
                  </tr>
                </thead>
              </table>
              <ScrollArea className="h-[150px]">
                <table className="w-full text-sm table-fixed">
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="py-4">
                          <LoadingSkeleton />
                        </td>
                      </tr>
                    ) : !departmentData?.topStocks?.nodes || departmentData.topStocks.nodes.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-slate-400">No pipe production data available</td>
                      </tr>
                    ) : (
                      departmentData.topStocks.nodes.map((item: StockItem, index: number) => (
                        <tr key={`${item.stock}-${index}`} className="border-b border-slate-700/50">
                          <td className={cn("py-2 w-[25%]", cardTextStyles.bodySmall)}>{item.stock}</td>
                          <td className={cn("py-2 w-[40%] truncate pr-2", cardTextStyles.labelSmall, "text-slate-400")} title={item.description}>
                            {item.description || '-'}
                          </td>
                          <td className={cn("py-2 w-[20%]", cardTextStyles.labelSmall, "text-slate-400")}>
                            {(() => {
                              if (!item.updateTime) return '-';
                              try {
                                const date = new Date(item.updateTime);
                                return isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
                              } catch (e) {
                                console.error('[DepartPipeCard] Date parsing error for topStock:', item.updateTime, e);
                                return '-';
                              }
                            })()}
                          </td>
                          <td className={cn("py-2 text-right w-[15%]", cardTextStyles.bodySmall)}>{item.stockLevel?.toLocaleString() || '0'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          </div>

          {/* Material Stock */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <h3 className={cn(cardTextStyles.subtitle, "mb-4")}>Material Stock</h3>
            <div className="overflow-hidden">
              <table className="w-full text-sm table-fixed">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className={cn("text-left pb-2 w-[25%]", cardTextStyles.labelSmall, "text-slate-400")}>Material Code</th>
                    <th className={cn("text-left pb-2 w-[40%]", cardTextStyles.labelSmall, "text-slate-400")}>Description</th>
                    <th className={cn("text-left pb-2 w-[20%]", cardTextStyles.labelSmall, "text-slate-400")}>Latest Update</th>
                    <th className={cn("text-right pb-2 w-[15%]", cardTextStyles.labelSmall, "text-slate-400")}>Qty</th>
                  </tr>
                </thead>
              </table>
              <ScrollArea className="h-[150px]">
                <table className="w-full text-sm table-fixed">
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="py-4">
                          <LoadingSkeleton />
                        </td>
                      </tr>
                    ) : !departmentData?.materialStocks?.nodes || departmentData.materialStocks.nodes.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-slate-400">No material data available</td>
                      </tr>
                    ) : (
                      departmentData.materialStocks.nodes.map((item: StockItem, index: number) => (
                        <tr key={`${item.stock}-${index}`} className="border-b border-slate-700/50">
                          <td className={cn("py-2 w-[25%]", cardTextStyles.bodySmall)}>{item.stock}</td>
                          <td className={cn("py-2 w-[40%] truncate pr-2", cardTextStyles.labelSmall, "text-slate-400")} title={item.description}>
                            {item.description || '-'}
                          </td>
                          <td className={cn("py-2 w-[20%]", cardTextStyles.labelSmall, "text-slate-400")}>
                            {(() => {
                              if (!item.updateTime) return '-';
                              try {
                                const date = new Date(item.updateTime);
                                return isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
                              } catch (e) {
                                console.error('[DepartPipeCard] Date parsing error for materialStock:', item.updateTime, e);
                                return '-';
                              }
                            })()}
                          </td>
                          <td className={cn("py-2 text-right w-[15%]", cardTextStyles.bodySmall)}>{item.stockLevel?.toLocaleString() || '0'}</td>
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
        <div className="grid grid-cols-2 gap-4">
          {/* Machine State */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <h3 className={cn(cardTextStyles.subtitle, "mb-4")}>Machine State</h3>
            <div className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className={cn("text-left pb-2", cardTextStyles.labelSmall, "text-slate-400")}>Machine Number</th>
                    <th className={cn("text-left pb-2", cardTextStyles.labelSmall, "text-slate-400")}>Latest Active time</th>
                    <th className={cn("text-left pb-2", cardTextStyles.labelSmall, "text-slate-400")}>State</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="py-4">
                        <LoadingSkeleton />
                      </td>
                    </tr>
                  ) : !departmentData?.machineStates || departmentData.machineStates.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-slate-400">
                        <div>
                          <Monitor className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                          <p>No machine data</p>
                          <p className="text-xs mt-1 text-slate-500">Machine monitoring system not connected</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    departmentData.machineStates.map((machine: MachineState, index: number) => (
                      <tr key={`${machine.machineNumber}-${index}`} className="border-b border-slate-700/50">
                        <td className={cn("py-2", cardTextStyles.bodySmall)}>{machine.machineNumber}</td>
                        <td className={cn("py-2", cardTextStyles.labelSmall, "text-slate-400")}>
                          {machine.lastActiveTime 
                            ? new Date(machine.lastActiveTime).toLocaleString() 
                            : 'N/A'}
                        </td>
                        <td className={cn(
                          "py-2 font-medium",
                          cardTextStyles.labelSmall,
                          machine.state === 'ACTIVE' ? "text-green-400" :
                          machine.state === 'IDLE' ? "text-yellow-400" :
                          machine.state === 'MAINTENANCE' ? "text-orange-400" :
                          machine.state === 'OFFLINE' ? "text-red-400" :
                          "text-slate-400"
                        )}>
                          {machine.state === 'UNKNOWN' ? 'N/A' : machine.state}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Coming Soon */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <h3 className={cn(cardTextStyles.subtitle, "mb-2")}>Coming Soon</h3>
            <div className="h-32">
              {/* No content to display */}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-700 bg-red-900/20 p-4">
            <p className={cn(cardTextStyles.bodySmall, "text-red-400")}>
              Error loading data. The system will retry automatically.
            </p>
          </div>
        )}
      </div>
    </ReportCard>
  );
};

export default DepartPipeCard;