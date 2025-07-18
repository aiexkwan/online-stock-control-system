'use client';

import React from 'react';
import { 
  DashboardDataProvider, 
  useDashboardData,
  useWidgetData 
} from '@/app/admin/contexts/DashboardDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

// 示例 1: 使用整體 dashboard data
function DashboardOverview() {
  const { data, loading, error, refetch } = useDashboardData();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-[100px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[120px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading dashboard data: {(error as { message: string }).message}
        </AlertDescription>
      </Alert>
    );
  }

  const stats = data?.statsCard;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.totalProducts || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.totalStock || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {stats?.lowStockCount || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Average Stock Level</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats?.averageStockLevel?.toFixed(0) || 0}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 示例 2: 使用特定 widget 的數據
function StockDistributionWidget() {
  const { data, loading, error, refetch } = useWidgetData('stockDistribution');

  if (loading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading stock distribution: {(error as { message: string }).message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Stock Distribution</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data?.warehouseData?.map((warehouse: any) => (
            <div key={warehouse.warehouse} className="flex justify-between">
              <span>{warehouse.warehouse}</span>
              <span className="font-medium">
                {warehouse.quantity} ({warehouse.percentage}%)
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{data?.totalQuantity || 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 示例 3: 日期範圍選擇器整合
function DateRangeSelector() {
  const { dateRange, setDateRange } = useDashboardData();

  const handlePresetClick = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    setDateRange({ startDate, endDate });
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePresetClick(7)}
      >
        Last 7 Days
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePresetClick(30)}
      >
        Last 30 Days
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePresetClick(90)}
      >
        Last 90 Days
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDateRange({ startDate: null, endDate: null })}
      >
        All Time
      </Button>
    </div>
  );
}

// 主應用組件，展示如何使用 Provider
export default function DashboardExample() {
  return (
    <DashboardDataProvider 
      initialDateRange={{ startDate: null, endDate: null }}
      autoRefreshInterval={5 * 60 * 1000} // 5 分鐘自動刷新
    >
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <DateRangeSelector />
        </div>
        
        <DashboardOverview />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StockDistributionWidget />
          {/* 可以添加更多 widgets */}
        </div>
      </div>
    </DashboardDataProvider>
  );
}

// 示例 4: 在現有 widget 中使用 context
export function ExistingWidgetWithContext() {
  const { getWidgetData, isWidgetLoading, refetchWidget } = useDashboardData();
  
  // 獲取多個相關 widget 的數據
  const orderData = getWidgetData('ordersList');
  const progressData = getWidgetData('acoOrderProgress');
  const isLoading = isWidgetLoading('ordersList') || isWidgetLoading('acoOrderProgress');

  const handleRefresh = async () => {
    // 可以同時刷新多個相關 widgets
    await Promise.all([
      refetchWidget('ordersList'),
      refetchWidget('acoOrderProgress')
    ]);
  };

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Management</CardTitle>
        <Button size="sm" onClick={handleRefresh}>
          Refresh Orders
        </Button>
      </CardHeader>
      <CardContent>
        {/* 使用來自多個 widgets 的數據 */}
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Total Orders</h3>
            <p className="text-2xl">{progressData?.totalOrders || 0}</p>
          </div>
          
          <div>
            <h3 className="font-medium">Recent Orders</h3>
            <div className="space-y-2">
              {orderData?.orders?.slice(0, 5).map((order: any) => (
                <div key={order.id} className="flex justify-between">
                  <span>{order.orderNumber}</span>
                  <span className="text-sm text-muted-foreground">
                    {(order as { status: string }).status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}