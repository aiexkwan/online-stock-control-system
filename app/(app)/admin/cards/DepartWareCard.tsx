/**
 * DepartWareCard - Warehouse Department Card
 * Shows department-specific metrics and information for the Warehouse department
 * Now using GraphQL for optimized data fetching
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Archive, History, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useLazyQuery, gql } from '@apollo/client';
import { Skeleton } from '@/components/ui/skeleton';
import type { RecentActivity, OrderCompletion } from '@/lib/graphql/types/database-types';

// GraphQL Query for Warehouse Department - Updated to include orderCompletions
const DEPARTMENT_WAREHOUSE_QUERY = gql`
  query GetDepartmentWarehouseData {
    departmentWarehouseData {
      stats {
        todayTransferred
        past7Days
        past14Days
        lastUpdated
      }
      recentActivities {
        time
        staff
        action
        detail
      }
      orderCompletions {
        orderRef
        productQty
        loadedQty
        completionPercentage
        latestUpdate
        hasPdf
        docUrl
      }
      loading
      error
    }
  }
`;

// Query for order details (lazy query - only fetch when needed)
const ORDER_DETAILS_QUERY = gql`
  query GetOrderDetails($orderRef: String!) {
    warehouseOrder(orderRef: $orderRef) {
      id
      orderRef
      customerName
      status
      totalQuantity
      loadedQuantity
      remainingQuantity
      createdAt
      updatedAt
      items {
        id
        productCode
        productDesc
        quantity
        loadedQuantity
        status
      }
    }
  }
`;

interface DepartWareCardProps {
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
            <Skeleton className="mt-1 h-8 w-20" />
          ) : (
            <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
          )}
          {trend && !loading && (
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

const LoadingSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
  </div>
);

interface SelectedOrder {
  orderRef: string;
  docUrl?: string | null;
  showDetails?: boolean;
  productQty?: number;
  loadedQty?: number;
  latestUpdate?: string;
  completionPercentage?: number;
  status?: string;
}

interface OrderDetail {
  id: string;
  productCode: string;
  productDesc: string | null;
  quantity: number;
  loadedQuantity: number;
  status: string;
}

export const DepartWareCard: React.FC<DepartWareCardProps> = ({
  title = 'Warehouse Department',
  description = 'Real-time metrics and statistics for the Warehouse department',
  isEditMode = false,
}) => {
  const [selectedOrder, setSelectedOrder] = useState<SelectedOrder | null>(null);
  
  // Use GraphQL query for department stats
  const { data, loading, error } = useQuery(DEPARTMENT_WAREHOUSE_QUERY, {
    pollInterval: 30000, // Poll every 30 seconds
    fetchPolicy: 'cache-and-network', // Use cache but also fetch fresh data
  });

  // Lazy query for order details - only fetch when needed
  const [fetchOrderDetails, { data: orderDetailsData, loading: orderDetailsLoading }] = useLazyQuery(
    ORDER_DETAILS_QUERY,
    {
      onCompleted: (data) => {
        // Order details fetched successfully
        console.log('Order details:', data.warehouseOrder);
      }
    }
  );

  // Extract data from GraphQL response
  const warehouseData = data?.departmentWarehouseData;
  const stats = warehouseData?.stats || {};
  const recentActivities = warehouseData?.recentActivities || [];
  const orderCompletions = warehouseData?.orderCompletions || [];
  
  const orderDetails = orderDetailsData?.warehouseOrder?.items || [];

  // Handle error state
  if (error) {
    console.error('[DepartWareCard] GraphQL Error:', error);
  }

  const statsDisplay = [
    {
      title: 'Today Transferred',
      value: loading ? '...' : (stats.todayTransferred?.toLocaleString() || '0'),
      icon: <Archive className="h-6 w-6" />,
      trend: 'Today\'s transfers',
      trendUp: true,
    },
    {
      title: 'Past 7 days',
      value: loading ? '...' : (stats.past7Days?.toLocaleString() || '0'),
      icon: <History className="h-6 w-6" />,
      trend: 'Weekly transfers',
      trendUp: true,
    },
    {
      title: 'Past 14 days',
      value: loading ? '...' : (stats.past14Days?.toLocaleString() || '0'),
      icon: <Clock className="h-6 w-6" />,
      trend: '2 weeks transfers',
      trendUp: true,
    },
  ];

  const handleOrderClick = (orderRef: string, hasPdf: boolean, docUrl?: string) => {
    if (hasPdf && docUrl) {
      // First check if the URL is accessible
      fetch(docUrl, { method: 'HEAD' })
        .then(response => {
          if (response.ok) {
            // PDF is accessible, open the preview
            setSelectedOrder({
              orderRef,
              docUrl,
            });
          } else {
            // PDF URL exists but file is not accessible
            alert(`PDF file for order ${orderRef} is not accessible. The file may have been deleted from storage.`);
            console.error(`PDF not accessible for order ${orderRef}: ${response.status}`);
          }
        })
        .catch(error => {
          // Network error or other issue
          alert(`Unable to access PDF for order ${orderRef}. Please check your network connection.`);
          console.error(`Error accessing PDF for order ${orderRef}:`, error);
        });
    } else {
      // No PDF URL in database
      alert(`No PDF document found for order ${orderRef}.`);
      console.log(`No PDF found for order ${orderRef}`);
    }
  };

  const handleCompletionClick = async (order: OrderCompletion) => {
    // Fetch order details using lazy query
    await fetchOrderDetails({
      variables: { orderRef: order.orderRef }
    });
    
    setSelectedOrder({
      orderRef: order.orderRef,
      productQty: order.productQty,
      loadedQty: order.loadedQty,
      latestUpdate: order.latestUpdate,
      completionPercentage: order.completionPercentage,
      showDetails: true
    });
  };

  return (
    <Card className="h-full bg-transparent border-0">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
        <CardDescription className="text-slate-400">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          {statsDisplay.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <StatCard {...stat} loading={loading} />
            </motion.div>
          ))}
        </div>

        {/* Middle Section - Two columns */}
        <div className="grid grid-cols-2 gap-4">
          {/* Last 24 hours Activity */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-4">
            <h3 className="mb-4 text-lg font-semibold text-white">Last 24 hours Activity</h3>
            <div className="mb-3 grid grid-cols-4 gap-2 text-xs font-medium text-slate-400 px-2">
              <span>Time</span>
              <span>Staff</span>
              <span>Action</span>
              <span>Detail</span>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {loading ? (
                <LoadingSkeleton />
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-4 text-slate-400">No recent activities</div>
              ) : (
                recentActivities.slice(0, 7).map((activity: RecentActivity, index: number) => (
                  <div
                    key={index}
                    className="grid grid-cols-4 gap-2 rounded-md bg-slate-700/30 p-2 text-sm"
                  >
                    <span className="text-slate-300">{activity.time}</span>
                    <span className="text-white">{activity.staff}</span>
                    <span className={cn(
                      "font-medium",
                      activity.action === 'Loading' ? 'text-green-400' : 'text-blue-400'
                    )}>
                      {activity.action}
                    </span>
                    <span className="text-slate-400 truncate">{activity.detail}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Order Completion */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-4">
            <h3 className="mb-4 text-lg font-semibold text-white">Order Completion</h3>
            <div className="mb-3 grid grid-cols-3 gap-2 text-xs font-medium text-slate-400 px-2">
              <span>Order</span>
              <span>Completion</span>
              <span>Latest Update</span>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {loading ? (
                <LoadingSkeleton />
              ) : orderCompletions.length === 0 ? (
                <div className="text-center py-4 text-slate-400">No order data available</div>
              ) : (
                orderCompletions.slice(0, 7).map((order: OrderCompletion, index: number) => (
                  <div
                    key={index}
                    className="grid grid-cols-3 gap-2 rounded-md bg-slate-700/30 p-2 text-sm items-center"
                  >
                    <span 
                      className={cn(
                        order.hasPdf 
                          ? "text-blue-400 cursor-pointer hover:text-blue-300" 
                          : "text-slate-400"
                      )}
                      onClick={() => order.hasPdf && handleOrderClick(order.orderRef, order.hasPdf, order.docUrl)}
                    >
                      {order.orderRef}
                    </span>
                    <div 
                      className="cursor-pointer"
                      onClick={() => handleCompletionClick(order)}
                    >
                      <Progress 
                        value={order.completionPercentage} 
                        className="h-2 bg-slate-700"
                      />
                      <span className="text-xs text-slate-400 mt-1">
                        {order.completionPercentage}%
                      </span>
                    </div>
                    <span className="text-slate-400">{order.latestUpdate || 'N/A'}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section - Coming Soon Areas */}
        <div className="grid grid-cols-2 gap-4">
          {/* Coming Soon - Left */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 min-h-[200px] flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-400 mb-2">Coming Soon</h3>
              <p className="text-sm text-slate-500">New features will be available here</p>
            </div>
          </div>

          {/* Coming Soon - Right */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 min-h-[200px] flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-400 mb-2">Coming Soon</h3>
              <p className="text-sm text-slate-500">New features will be available here</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-700 bg-red-900/20 p-4">
            <p className="text-red-400 text-sm">
              Error loading data. The system will retry automatically.
            </p>
          </div>
        )}
      </CardContent>

      {/* Order Preview Dialog */}
      {selectedOrder && !selectedOrder.showDetails && selectedOrder.docUrl && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle>{selectedOrder.orderRef} - Document Preview</DialogTitle>
            </DialogHeader>
            <div className="relative h-[calc(90vh-80px)]">
              <iframe
                src={selectedOrder.docUrl}
                className="absolute inset-0 w-full h-full"
                title="Order Document"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Order Details Dialog */}
      {selectedOrder && selectedOrder.showDetails && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedOrder.orderRef} Details</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <div className="grid grid-cols-5 gap-2 text-sm font-medium text-slate-400 mb-3 px-2">
                <span>Product Code</span>
                <span>Description</span>
                <span>Total Qty</span>
                <span>Loaded Qty</span>
                <span>Status</span>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {orderDetailsLoading ? (
                  <LoadingSkeleton />
                ) : orderDetails.length === 0 ? (
                  <div className="text-center py-4 text-slate-400">No details available</div>
                ) : (
                  orderDetails.map((detail: OrderDetail, index: number) => (
                    <div
                      key={index}
                      className="grid grid-cols-5 gap-2 rounded-md bg-slate-700/30 p-2 text-sm"
                    >
                      <span className="text-slate-300">{detail.productCode}</span>
                      <span className="text-white">{detail.productDesc || 'N/A'}</span>
                      <span className="text-slate-300">{detail.quantity}</span>
                      <span className="text-white">{detail.loadedQuantity}</span>
                      <span className="text-slate-300">{detail.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

export default DepartWareCard;