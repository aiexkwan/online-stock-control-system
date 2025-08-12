/**
 * DepartPipeCard - Pipe Line Department Card
 * Shows department-specific metrics and information for the Pipe Line department
 * Now using GraphQL for optimized data fetching
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Activity, Package, TrendingUp, Monitor, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, gql } from '@apollo/client';
import { Skeleton } from '@/components/ui/skeleton';
import type { StockItem, MachineState } from '@/lib/graphql/types/database-types';

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
          <p className="text-sm text-slate-400">{title}</p>
          {loading ? (
            <Skeleton className="h-8 w-20 mt-1" />
          ) : (
            <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
          )}
          {trend && (
            <p className={cn("mt-1 text-sm", trendUp ? "text-green-400" : "text-red-400")}>
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

const LoadingRow = () => (
  <div className="grid grid-cols-4 gap-2 py-2">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-full" />
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

  // Error state with better debugging info
  if (error) {
    return (
      <Card className="h-full bg-transparent border-0">
        <CardHeader>
          <CardTitle className="text-white">{title}</CardTitle>
          <CardDescription className="text-slate-400">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-red-400">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p>Failed to load department data</p>
              <p className="text-sm mt-2 text-slate-500">{error.message}</p>
              <div className="mt-4 p-3 bg-slate-800/50 rounded text-xs text-left max-w-md">
                <p className="text-slate-400 font-semibold mb-2">Debug Info:</p>
                <p className="text-slate-500">• Check if GraphQL server is running</p>
                <p className="text-slate-500">• Verify database connection</p>
                <p className="text-slate-500">• Ensure Pipe products have production records</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-transparent border-0">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
        <CardDescription className="text-slate-400">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <StatCard
              title="Today Finished"
              value={departmentData?.stats?.todayFinished?.toLocaleString() || '0'}
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
              value={departmentData?.stats?.past7Days?.toLocaleString() || '0'}
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
              value={departmentData?.stats?.past14Days?.toLocaleString() || '0'}
              icon={<TrendingUp className="h-6 w-6" />}
              loading={loading}
            />
          </motion.div>
        </div>

        {/* Middle Section - Two columns */}
        <div className="grid grid-cols-2 gap-4">
          {/* Top 10 Stock */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <h3 className="mb-4 text-lg font-semibold text-white">Top 10 Stock</h3>
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-2 pb-2 border-b border-slate-700 text-sm font-medium text-slate-400">
              <div>Product Code</div>
              <div>Description</div>
              <div>Latest Update</div>
              <div className="text-right">Qty</div>
            </div>
            {/* Table Body */}
            <ScrollArea className="h-[200px] pr-2">
              {loading ? (
                <div className="space-y-1 mt-2">
                  <LoadingRow />
                  <LoadingRow />
                  <LoadingRow />
                </div>
              ) : !departmentData?.topStocks?.nodes || departmentData.topStocks.nodes.length === 0 ? (
                <div className="text-slate-400 text-center py-8">
                  <Package className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                  <p>No pipe production data available</p>
                  <p className="text-xs mt-1 text-slate-500">Check if pipe products are being manufactured</p>
                </div>
              ) : (
                <div className="space-y-1 mt-2">
                  {departmentData.topStocks.nodes.map((item: StockItem, index: number) => (
                    <div
                      key={`${item.stock}-${index}`}
                      className="grid grid-cols-4 gap-2 py-2 text-sm hover:bg-slate-700/30 rounded"
                    >
                      <div className="text-white truncate">{item.stock}</div>
                      <div className="text-slate-300 truncate">{item.description || '-'}</div>
                      <div className="text-slate-400">
                        {item.updateTime ? new Date(item.updateTime).toLocaleDateString() : '-'}
                      </div>
                      <div className="text-white text-right">{item.stockLevel.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Material Stock */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <h3 className="mb-4 text-lg font-semibold text-white">Material Stock</h3>
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-2 pb-2 border-b border-slate-700 text-sm font-medium text-slate-400">
              <div>Material Code</div>
              <div>Description</div>
              <div>Latest Update</div>
              <div className="text-right">Qty</div>
            </div>
            {/* Table Body */}
            <ScrollArea className="h-[200px] pr-2">
              {loading ? (
                <div className="space-y-1 mt-2">
                  <LoadingRow />
                  <LoadingRow />
                  <LoadingRow />
                </div>
              ) : !departmentData?.materialStocks?.nodes || departmentData.materialStocks.nodes.length === 0 ? (
                <div className="text-slate-400 text-center py-8">
                  <Package className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                  <p>No material data available</p>
                  <p className="text-xs mt-1 text-slate-500">Materials used for pipe production</p>
                </div>
              ) : (
                <div className="space-y-1 mt-2">
                  {departmentData.materialStocks.nodes.map((item: StockItem, index: number) => (
                    <div
                      key={`${item.stock}-${index}`}
                      className="grid grid-cols-4 gap-2 py-2 text-sm hover:bg-slate-700/30 rounded"
                    >
                      <div className="text-white truncate">{item.stock}</div>
                      <div className="text-slate-300 truncate">{item.description || '-'}</div>
                      <div className="text-slate-400">
                        {item.updateTime ? new Date(item.updateTime).toLocaleDateString() : '-'}
                      </div>
                      <div className="text-white text-right">{item.stockLevel.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Bottom Section - Machine State and Coming Soon */}
        <div className="grid grid-cols-2 gap-4">
          {/* Machine State */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <h3 className="mb-4 text-lg font-semibold text-white">Machine State</h3>
            {/* Table Header */}
            <div className="grid grid-cols-3 gap-2 pb-2 border-b border-slate-700 text-sm font-medium text-slate-400">
              <div>Machine Number</div>
              <div>Latest Active time</div>
              <div>State</div>
            </div>
            {/* Table Body */}
            <div className="space-y-1 mt-2">
              {loading ? (
                <>
                  <LoadingRow />
                  <LoadingRow />
                </>
              ) : departmentData?.machineStates ? (
                departmentData.machineStates.map((machine: MachineState, index: number) => (
                  <div
                    key={`${machine.machineNumber}-${index}`}
                    className="grid grid-cols-3 gap-2 py-2 text-sm hover:bg-slate-700/30 rounded"
                  >
                    <div className="text-white">{machine.machineNumber}</div>
                    <div className="text-slate-400">
                      {machine.lastActiveTime 
                        ? new Date(machine.lastActiveTime).toLocaleString() 
                        : 'N/A'}
                    </div>
                    <div className={cn(
                      "font-medium",
                      machine.state === 'ACTIVE' ? "text-green-400" :
                      machine.state === 'IDLE' ? "text-yellow-400" :
                      machine.state === 'MAINTENANCE' ? "text-orange-400" :
                      machine.state === 'OFFLINE' ? "text-red-400" :
                      "text-slate-400"
                    )}>
                      {machine.state === 'UNKNOWN' ? 'N/A' : machine.state}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-center py-8">
                  <Monitor className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                  <p>No machine data</p>
                  <p className="text-xs mt-1 text-slate-500">Machine monitoring system not connected</p>
                </div>
              )}
            </div>
          </div>

          {/* Coming Soon - Empty as required */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <h3 className="mb-4 text-lg font-semibold text-white">Coming Soon</h3>
            <div className="flex items-center justify-center h-[120px]">
              {/* Empty content as per requirement */}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DepartPipeCard;