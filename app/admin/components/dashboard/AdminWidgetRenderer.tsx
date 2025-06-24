/**
 * Admin Widget Renderer
 * 根據配置渲染不同類型的 Admin Widget
 */

'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AdminWidgetConfig } from './adminDashboardLayouts';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';
import { createClient } from '@/lib/supabase';
import { useAdminRefresh } from '@/app/admin/contexts/AdminRefreshContext';
import { 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CubeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  getProductByCode, 
  createProduct, 
  updateProduct,
  ProductData 
} from '@/app/actions/productActions';
import { 
  LineChart, Line, 
  BarChart, Bar, 
  PieChart, Pie, Cell,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface AdminWidgetRendererProps {
  config: AdminWidgetConfig;
  theme: string;
  timeFrame: TimeFrame;
  index?: number;
}

// 顏色配置
const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#64748b'  // gray
];

// 導入特殊組件 - 已移除舊 Dashboard 依賴

// 新的上傳頁面組件 - 使用 lazy loading
const OrdersListWidget = React.lazy(() => import('./widgets/OrdersListWidget').then(mod => ({ default: mod.OrdersListWidget })));
const OtherFilesListWidget = React.lazy(() => import('./widgets/OtherFilesListWidget').then(mod => ({ default: mod.OtherFilesListWidget })));
const UploadFilesWidget = React.lazy(() => import('./widgets/UploadFilesWidget').then(mod => ({ default: mod.UploadFilesWidget })));
const UploadOrdersWidget = React.lazy(() => import('./widgets/UploadOrdersWidget').then(mod => ({ default: mod.UploadOrdersWidget })));
const UploadProductSpecWidget = React.lazy(() => import('./widgets/UploadProductSpecWidget').then(mod => ({ default: mod.UploadProductSpecWidget })));
const UploadPhotoWidget = React.lazy(() => import('./widgets/UploadPhotoWidget').then(mod => ({ default: mod.UploadPhotoWidget })));
const ReportGeneratorWidget = React.lazy(() => import('./widgets/ReportGeneratorWidget'));
const ReportGeneratorWithDialogWidget = React.lazy(() => import('./widgets/ReportGeneratorWithDialogWidget'));
const AvailableSoonWidget = React.lazy(() => import('./widgets/AvailableSoonWidget'));

// GraphQL 組件
const ProductionStatsGraphQL = React.lazy(() => import('./widgets/ProductionStatsGraphQL').then(mod => ({ default: mod.ProductionStatsGraphQL })));
const TopProductsChartGraphQL = React.lazy(() => import('./widgets/TopProductsChartGraphQL').then(mod => ({ default: mod.TopProductsChartGraphQL })));
const ProductDistributionChartGraphQL = React.lazy(() => import('./widgets/ProductDistributionChartGraphQL').then(mod => ({ default: mod.ProductDistributionChartGraphQL })));
const ProductionDetailsGraphQL = React.lazy(() => import('./widgets/ProductionDetailsGraphQL').then(mod => ({ default: mod.ProductionDetailsGraphQL })));
const StaffWorkloadGraphQL = React.lazy(() => import('./widgets/StaffWorkloadGraphQL').then(mod => ({ default: mod.StaffWorkloadGraphQL })));
const OrdersListGraphQL = React.lazy(() => import('./widgets/OrdersListGraphQL').then(mod => ({ default: mod.OrdersListGraphQL })));
const OtherFilesListGraphQL = React.lazy(() => import('./widgets/OtherFilesListGraphQL').then(mod => ({ default: mod.OtherFilesListGraphQL })));

// GraphQL 功能開關
const ENABLE_GRAPHQL = process.env.NEXT_PUBLIC_ENABLE_GRAPHQL === 'true';

export const AdminWidgetRenderer: React.FC<AdminWidgetRendererProps> = ({ 
  config, 
  theme,
  timeFrame,
  index = 0
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { refreshTrigger } = useAdminRefresh();

  // 根據數據源載入數據
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const supabase = createClient();
        
        // 根據不同的數據源載入真實數據
        switch (config.dataSource) {
          case 'record_palletinfo':
            await loadPalletData(supabase, timeFrame);
            break;
          case 'record_inventory':
            await loadInventoryData(supabase, timeFrame);
            break;
          case 'record_transfer':
            await loadTransferData(supabase, timeFrame);
            break;
          case 'stock_level':
            await loadStockLevelData(supabase);
            break;
          case 'record_history':
            await loadHistoryData(supabase, timeFrame);
            break;
          case 'production_summary':
            await loadProductionSummary(supabase, timeFrame);
            break;
          case 'production_details':
            await loadProductionDetails(supabase, timeFrame);
            break;
          case 'work_level':
            await loadWorkLevel(supabase, timeFrame);
            break;
          case 'pipeline_production_details':
            await loadPipelineProductionDetails(supabase, timeFrame);
            break;
          case 'pipeline_work_level':
            await loadPipelineWorkLevel(supabase, timeFrame);
            break;
          case 'data_customerorder':
            await loadCustomerOrderData(supabase);
            break;
          case 'system_status':
            await loadSystemStatus(supabase);
            break;
          case 'coming_soon':
            setData({
              value: 'N/A',
              label: config.title,
              icon: <ClockIcon className="w-8 h-8" />
            });
            break;
          default:
            // 使用模擬數據
            const mockData = getMockData(config);
            setData(mockData);
        }
        
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, timeFrame, refreshTrigger]);

  // 載入 Pallet 數據
  const loadPalletData = async (supabase: any, timeFrame: TimeFrame) => {
    // 根據 metrics 判斷要載入什麼數據
    const metric = config.metrics?.[0];
    
    if (metric === 'pallet_count') {
      // 載入棧板數量
      const { data: palletData, error } = await supabase
        .from('record_palletinfo')
        .select('plt_num')
        .ilike('plt_remark', '%finished in production%')
        .not('product_code', 'ilike', 'U%')
        .gte('generate_time', timeFrame.start.toISOString())
        .lte('generate_time', timeFrame.end.toISOString());

      if (error) {
        console.error('Error loading pallet count:', error);
        setData({ value: 0, label: config.title });
        return;
      }

      const uniquePallets = new Set(palletData?.map((p: any) => p.plt_num) || []);
      
      setData({
        value: uniquePallets.size,
        label: config.title,
        icon: <CubeIcon className="w-8 h-8" />
      });
    } else if (metric === 'pipeline_pallet_count') {
      // 載入 Pipeline 棧板數量
      const { data: palletData, error } = await supabase
        .from('record_palletinfo')
        .select('plt_num')
        .ilike('plt_remark', '%finished in production%')
        .ilike('product_code', 'U%')
        .gte('generate_time', timeFrame.start.toISOString())
        .lte('generate_time', timeFrame.end.toISOString());

      if (error) {
        console.error('Error loading pipeline pallet count:', error);
        setData({ value: 0, label: config.title });
        return;
      }

      const uniquePallets = new Set(palletData?.map((p: any) => p.plt_num) || []);
      
      setData({
        value: uniquePallets.size,
        label: config.title,
        icon: <CubeIcon className="w-8 h-8" />
      });
    } else if (metric === 'quantity_sum') {
      // 載入數量總和
      const { data: palletData, error } = await supabase
        .from('record_palletinfo')
        .select('product_qty')
        .ilike('plt_remark', '%finished in production%')
        .not('product_code', 'ilike', 'U%')
        .gte('generate_time', timeFrame.start.toISOString())
        .lte('generate_time', timeFrame.end.toISOString());

      if (error) {
        console.error('Error loading quantity sum:', error);
        setData({ value: 0, label: config.title });
        return;
      }

      const totalQty = palletData?.reduce((sum: number, p: any) => sum + (p.product_qty || 0), 0) || 0;
      
      setData({
        value: totalQty,
        label: config.title,
        icon: <CubeIcon className="w-8 h-8" />
      });
    } else if (metric === 'pipeline_quantity_sum') {
      // 載入 Pipeline 數量總和
      const { data: palletData, error } = await supabase
        .from('record_palletinfo')
        .select('product_qty')
        .ilike('plt_remark', '%finished in production%')
        .ilike('product_code', 'U%')
        .gte('generate_time', timeFrame.start.toISOString())
        .lte('generate_time', timeFrame.end.toISOString());

      if (error) {
        console.error('Error loading pipeline quantity sum:', error);
        setData({ value: 0, label: config.title });
        return;
      }

      const totalQty = palletData?.reduce((sum: number, p: any) => sum + (p.product_qty || 0), 0) || 0;
      
      setData({
        value: totalQty,
        label: config.title,
        icon: <CubeIcon className="w-8 h-8" />
      });
    } else if (config.chartType === 'bar') {
      // 判斷是否為 pipeline 數據
      const isPipeline = config.metrics?.[0] === 'pipeline_products';
      
      // 載入 Top 5 產品數據
      const query = supabase
        .from('record_palletinfo')
        .select('product_code, product_qty')
        .ilike('plt_remark', '%finished in production%')
        .gte('generate_time', timeFrame.start.toISOString())
        .lte('generate_time', timeFrame.end.toISOString());
        
      if (isPipeline) {
        query.ilike('product_code', 'U%');
      } else {
        query.not('product_code', 'ilike', 'U%');
      }
        
      const { data: palletData, error } = await query;

      if (error) {
        console.error('Error loading top products:', error);
        setData({ chartData: [] });
        return;
      }

      // 按產品代碼分組並計算總數
      const productTotals: Record<string, number> = {};
      palletData?.forEach((p: any) => {
        productTotals[p.product_code] = (productTotals[p.product_code] || 0) + (p.product_qty || 0);
      });

      // 排序並取前5
      const chartData = Object.entries(productTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

      setData({ chartData });
    } else if (config.chartType === 'donut') {
      // 判斷是否為 pipeline 數據
      const isPipeline = config.metrics?.[0] === 'pipeline_products_top10';
      
      // 載入 Top 10 產品數據
      const query = supabase
        .from('record_palletinfo')
        .select('product_code, product_qty')
        .ilike('plt_remark', '%finished in production%')
        .gte('generate_time', timeFrame.start.toISOString())
        .lte('generate_time', timeFrame.end.toISOString());
        
      if (isPipeline) {
        query.ilike('product_code', 'U%');
      } else {
        query.not('product_code', 'ilike', 'U%');
      }
        
      const { data: palletData, error } = await query;

      if (error) {
        console.error('Error loading top products:', error);
        setData({ chartData: [] });
        return;
      }

      // 按產品代碼分組並計算總數
      const productTotals: Record<string, number> = {};
      palletData?.forEach((p: any) => {
        productTotals[p.product_code] = (productTotals[p.product_code] || 0) + (p.product_qty || 0);
      });

      // 排序並取前10
      const chartData = Object.entries(productTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }));

      setData({ chartData });
    }
  };

  // 載入庫存數據
  const loadInventoryData = async (supabase: any, timeFrame: TimeFrame) => {
    const { data: inventoryData } = await supabase
      .from('record_inventory')
      .select('*');

    // 統計各位置的庫存
    const locationTotals: Record<string, number> = {
      injection: 0,
      pipeline: 0,
      prebook: 0,
      await: 0,
      fold: 0,
      bulk: 0,
      backcarpark: 0
    };

    inventoryData?.forEach((record: any) => {
      Object.keys(locationTotals).forEach(loc => {
        locationTotals[loc] += record[loc] || 0;
      });
    });

    const chartData = Object.entries(locationTotals)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));

    setData({
      value: Object.values(locationTotals).reduce((a, b) => a + b, 0),
      label: 'Total Inventory',
      chartData,
      locationTotals
    });
  };

  // 載入轉移數據
  const loadTransferData = async (supabase: any, timeFrame: TimeFrame) => {
    const { data: transferData, count } = await supabase
      .from('record_transfer')
      .select('*', { count: 'exact' })
      .gte('tran_date', timeFrame.start.toISOString())
      .lte('tran_date', timeFrame.end.toISOString())
      .order('tran_date', { ascending: false });

    setData({
      value: count || 0,
      label: 'Total Transfers',
      icon: <TruckIcon className="w-8 h-8" />,
      rows: transferData?.slice(0, 10).map((t: any) => [
        t.plt_num,
        t.f_loc,
        t.t_loc,
        format(new Date(t.tran_date), 'HH:mm')
      ]),
      headers: ['Pallet', 'From', 'To', 'Time']
    });
  };

  // 載入庫存水平數據
  const loadStockLevelData = async (supabase: any) => {
    const { data: stockData } = await supabase
      .from('stock_level')
      .select('*')
      .order('quantity', { ascending: false });

    const totalStock = stockData?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;

    setData({
      value: totalStock,
      label: 'Total Stock Level',
      chartData: stockData?.slice(0, 10).map((s: any) => ({
        name: s.product_code,
        value: s.quantity
      })),
      items: stockData?.slice(0, 5).map((s: any) => ({
        title: s.product_code,
        subtitle: `Stock Level`,
        value: s.quantity.toLocaleString()
      }))
    });
  };

  // 載入歷史數據
  const loadHistoryData = async (supabase: any, timeFrame: TimeFrame) => {
    const { data: historyData } = await supabase
      .from('record_history')
      .select('*, data_id!inner(user_name)')
      .gte('time', timeFrame.start.toISOString())
      .lte('time', timeFrame.end.toISOString())
      .order('time', { ascending: false })
      .limit(20);

    setData({
      items: historyData?.map((h: any) => ({
        title: h.action,
        subtitle: `by ${h.data_id?.user_name || 'Unknown'}`,
        value: h.plt_num || '-',
        time: format(new Date(h.time), 'HH:mm:ss'),
        icon: getActionIcon(h.action)
      }))
    });
  };

  // 載入生產摘要數據
  const loadProductionSummary = async (supabase: any, timeFrame: TimeFrame) => {
    const { data: summaryData } = await supabase
      .from('record_palletinfo')
      .select('product_code, product_qty')
      .gte('generate_time', timeFrame.start.toISOString())
      .lte('generate_time', timeFrame.end.toISOString())
      .order('generate_time', { ascending: false })
      .limit(50);

    // Group by product code
    const productSummary: Record<string, number> = {};
    summaryData?.forEach((item: any) => {
      productSummary[item.product_code] = (productSummary[item.product_code] || 0) + item.product_qty;
    });

    const headers = ['Product', 'Quantity', 'Status', 'Updated'];
    const rows = Object.entries(productSummary)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([code, qty]) => [
        code,
        qty.toLocaleString(),
        'Active',
        format(new Date(), 'HH:mm')
      ]);

    setData({ headers, rows });
  };

  // 載入客戶訂單數據
  const loadCustomerOrderData = async (supabase: any) => {
    const { data: orders, count } = await supabase
      .from('data_customerorder')
      .select('*', { count: 'exact' })
      .eq('order_status', 'active')
      .limit(1);

    setData({
      value: count || 0,
      label: 'Active Orders',
      icon: <DocumentArrowDownIcon className="w-8 h-8" />
    });
  };

  // 載入系統狀態數據
  const loadSystemStatus = async (supabase: any) => {
    // Check system health based on recent errors
    const { count: errorCount } = await supabase
      .from('record_history')
      .select('*', { count: 'exact', head: true })
      .ilike('action', '%error%')
      .gte('time', new Date(Date.now() - 3600000).toISOString()); // Last hour

    const healthScore = errorCount === 0 ? 100 : Math.max(0, 100 - (errorCount * 10));
    
    setData({
      value: healthScore,
      label: 'System Health',
      icon: <ArrowPathIcon className="w-8 h-8" />,
      trend: errorCount === 0 ? 5 : -5
    });
  };

  // 載入生產明細數據
  const loadProductionDetails = async (supabase: any, timeFrame: TimeFrame) => {
    try {
      // 先獲取符合條件的棧板資料
      const { data: palletData, error: palletError } = await supabase
        .from('record_palletinfo')
        .select('plt_num, product_code, product_qty, generate_time')
        .ilike('plt_remark', '%finished in production%')
        .not('product_code', 'ilike', 'U%')
        .gte('generate_time', timeFrame.start.toISOString())
        .lte('generate_time', timeFrame.end.toISOString())
        .order('generate_time', { ascending: false })
        .limit(50);

      if (palletError) {
        console.error('Error loading production details:', palletError);
        setData({ headers: ['Pallet Num', 'Product Code', 'Qty', 'Q.C. By'], rows: [] });
        return;
      }

      // 對每個棧板查找 QC 操作員
      const rows = [];
      for (const pallet of palletData || []) {
        // 查找 QC 記錄
        const { data: historyData } = await supabase
          .from('record_history')
          .select('id')
          .eq('plt_num', pallet.plt_num)
          .eq('action', 'Finished QC')
          .order('time', { ascending: false })
          .limit(1);

        let qcOperator = 'N/A';
        if (historyData && historyData.length > 0 && historyData[0].id) {
          // 查找操作員名稱
          const { data: operatorData, error: operatorError } = await supabase
            .from('data_id')
            .select('name')
            .eq('id', historyData[0].id)
            .limit(1);
          
          if (!operatorError && operatorData && operatorData.length > 0) {
            qcOperator = operatorData[0].name;
          }
        }

        rows.push([
          pallet.plt_num,
          pallet.product_code,
          pallet.product_qty.toLocaleString(),
          qcOperator
        ]);
      }

      setData({
        headers: ['Pallet Num', 'Product Code', 'Qty', 'Q.C. By'],
        rows: rows.slice(0, 20) // 限制顯示20行
      });
    } catch (error) {
      console.error('Error in loadProductionDetails:', error);
      setData({ headers: ['Pallet Num', 'Product Code', 'Qty', 'Q.C. By'], rows: [] });
    }
  };

  // 載入 Pipeline 生產明細數據
  const loadPipelineProductionDetails = async (supabase: any, timeFrame: TimeFrame) => {
    try {
      // 先獲取符合條件的棧板資料
      const { data: palletData, error: palletError } = await supabase
        .from('record_palletinfo')
        .select('plt_num, product_code, product_qty, generate_time')
        .ilike('plt_remark', '%finished in production%')
        .ilike('product_code', 'U%')
        .gte('generate_time', timeFrame.start.toISOString())
        .lte('generate_time', timeFrame.end.toISOString())
        .order('generate_time', { ascending: false })
        .limit(50);

      if (palletError) {
        console.error('Error loading pipeline production details:', palletError);
        setData({ headers: ['Pallet Num', 'Product Code', 'Qty', 'Q.C. By'], rows: [] });
        return;
      }

      // 對每個棧板查找 QC 操作員
      const rows = [];
      for (const pallet of palletData || []) {
        // 查找 QC 記錄
        const { data: historyData } = await supabase
          .from('record_history')
          .select('id')
          .eq('plt_num', pallet.plt_num)
          .eq('action', 'Finished QC')
          .order('time', { ascending: false })
          .limit(1);

        let qcOperator = 'N/A';
        if (historyData && historyData.length > 0 && historyData[0].id) {
          // 查找操作員名稱
          const { data: operatorData, error: operatorError } = await supabase
            .from('data_id')
            .select('name')
            .eq('id', historyData[0].id)
            .limit(1);
          
          if (!operatorError && operatorData && operatorData.length > 0) {
            qcOperator = operatorData[0].name;
          }
        }

        rows.push([
          pallet.plt_num,
          pallet.product_code,
          pallet.product_qty.toLocaleString(),
          qcOperator
        ]);
      }

      setData({
        headers: ['Pallet Num', 'Product Code', 'Qty', 'Q.C. By'],
        rows: rows.slice(0, 20) // 限制顯示20行
      });
    } catch (error) {
      console.error('Error in loadPipelineProductionDetails:', error);
      setData({ headers: ['Pallet Num', 'Product Code', 'Qty', 'Q.C. By'], rows: [] });
    }
  };

  // 載入員工工作量數據
  const loadWorkLevel = async (supabase: any, timeFrame: TimeFrame) => {
    try {
      // 獲取 Injection 部門的員工
      const { data: allUsers } = await supabase
        .from('data_id')
        .select('id, name')
        .eq('department', 'Injection')
        .order('name');

      if (!allUsers || allUsers.length === 0) {
        setData({ chartData: [], legendData: [] });
        return;
      }

      // 計算時間範圍內的日期
      const dates: Date[] = [];
      const currentDate = new Date(timeFrame.start);
      while (currentDate <= timeFrame.end) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // 為每個日期構建數據點
      const chartData: any[] = [];
      
      for (const date of dates) {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        // 獲取當天的工作量數據
        const { data: dayWorkData } = await supabase
          .from('work_level')
          .select('id, qc, grn, move')
          .gte('latest_update', dayStart.toISOString())
          .lte('latest_update', dayEnd.toISOString());

        // 構建當天的數據點
        const dataPoint: any = {
          date: format(date, 'MMM d'),
          fullDate: date.toISOString()
        };

        // 為每個用戶計算總工作量
        allUsers.forEach((user: any) => {
          const userWork = dayWorkData?.find((w: any) => w.id === user.id);
          const total = userWork ? (userWork.qc || 0) + (userWork.grn || 0) + (userWork.move || 0) : 0;
          dataPoint[user.name] = total;
        });

        chartData.push(dataPoint);
      }

      // 準備圖例數據 - 只顯示有數據的用戶
      const legendData = allUsers
        .filter((user: any) => {
          // 檢查用戶是否有任何非零數據
          return chartData.some(point => point[user.name] > 0);
        })
        .map((user: any) => ({
          value: user.name,
          color: CHART_COLORS[allUsers.indexOf(user) % CHART_COLORS.length]
        }));

      setData({ 
        chartData, 
        legendData,
        userNames: legendData.map((l: any) => l.value)
      });
    } catch (error) {
      console.error('Error in loadWorkLevel:', error);
      setData({ chartData: [], legendData: [] });
    }
  };

  // 載入 Pipeline 員工工作量數據
  const loadPipelineWorkLevel = async (supabase: any, timeFrame: TimeFrame) => {
    try {
      // 獲取 Pipeline 部門的員工
      const { data: allUsers } = await supabase
        .from('data_id')
        .select('id, name')
        .eq('department', 'Pipeline')
        .order('name');

      if (!allUsers || allUsers.length === 0) {
        setData({ chartData: [], legendData: [] });
        return;
      }

      // 計算時間範圍內的日期
      const dates: Date[] = [];
      const currentDate = new Date(timeFrame.start);
      while (currentDate <= timeFrame.end) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // 為每個日期構建數據點
      const chartData: any[] = [];
      
      for (const date of dates) {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        // 獲取當天的工作量數據
        const { data: dayWorkData } = await supabase
          .from('work_level')
          .select('id, qc, grn, move')
          .gte('latest_update', dayStart.toISOString())
          .lte('latest_update', dayEnd.toISOString());

        // 構建當天的數據點
        const dataPoint: any = {
          date: format(date, 'MMM d'),
          fullDate: date.toISOString()
        };

        // 為每個用戶計算總工作量
        allUsers.forEach((user: any) => {
          const userWork = dayWorkData?.find((w: any) => w.id === user.id);
          const total = userWork ? (userWork.qc || 0) + (userWork.grn || 0) + (userWork.move || 0) : 0;
          dataPoint[user.name] = total;
        });

        chartData.push(dataPoint);
      }

      // 準備圖例數據 - 只顯示有數據的用戶
      const legendData = allUsers
        .filter((user: any) => {
          // 檢查用戶是否有任何非零數據
          return chartData.some(point => point[user.name] > 0);
        })
        .map((user: any) => ({
          value: user.name,
          color: CHART_COLORS[allUsers.indexOf(user) % CHART_COLORS.length]
        }));

      setData({ 
        chartData, 
        legendData,
        userNames: legendData.map((l: any) => l.value)
      });
    } catch (error) {
      console.error('Error in loadPipelineWorkLevel:', error);
      setData({ chartData: [], legendData: [] });
    }
  };

  // 生成每小時數據
  const generateHourlyData = (data: any[], timeField: string) => {
    const hourlyMap = new Map<number, number>();
    
    // 初始化 24 小時
    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i, 0);
    }
    
    // 統計每小時的數據
    data?.forEach(record => {
      const date = new Date(record[timeField]);
      const hour = date.getHours();
      hourlyMap.set(hour, hourlyMap.get(hour)! + 1);
    });
    
    return Array.from(hourlyMap.entries()).map(([hour, count]) => ({
      name: `${hour}:00`,
      value: count
    }));
  };

  // 根據 action 類型返回圖標
  const getActionIcon = (action: string) => {
    const actionLower = action.toLowerCase();
    
    if (actionLower.includes('transfer') || actionLower.includes('move')) {
      return <TruckIcon className="w-4 h-4 text-orange-500" />;
    }
    if (actionLower.includes('receive') || actionLower.includes('grn')) {
      return <DocumentArrowDownIcon className="w-4 h-4 text-green-500" />;
    }
    if (actionLower.includes('qc') || actionLower.includes('quality')) {
      return <CubeIcon className="w-4 h-4 text-blue-500" />;
    }
    if (actionLower.includes('void') || actionLower.includes('delete')) {
      return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
    }
    return <ArrowPathIcon className="w-4 h-4 text-gray-400" />;
  };

  // 渲染統計卡片
  const renderStatsCard = () => {
    // 檢查是否為需要透明的四個小 widget
    const transparentWidgets = ['Pending Updates', 'Processing', 'Completed Today', 'Failed'];
    if (transparentWidgets.includes(config.title)) {
      return <div className="h-full" style={{ opacity: 0 }}></div>;
    }

    // 如果啟用 GraphQL 且是生產統計類型，使用 GraphQL 組件
    if (ENABLE_GRAPHQL && 
        config.dataSource === 'record_palletinfo' && 
        (config.metrics?.[0] === 'pallet_count' || config.metrics?.[0] === 'quantity_sum')) {
      return (
        <Suspense fallback={
          <div className="animate-pulse">
            <div className="h-12 w-12 bg-slate-700/50 rounded-xl mb-4"></div>
            <div className="h-8 w-24 bg-slate-700/50 rounded mb-2"></div>
            <div className="h-4 w-32 bg-slate-700/50 rounded"></div>
          </div>
        }>
          <ProductionStatsGraphQL
            title={config.title}
            metric={config.metrics[0] as 'pallet_count' | 'quantity_sum'}
            timeFrame={timeFrame}
            className="h-full"
          />
        </Suspense>
      );
    }

    if (loading) {
      return (
        <div className="animate-pulse">
          <div className="h-12 w-12 bg-slate-700/50 rounded-xl mb-4"></div>
          <div className="h-8 w-24 bg-slate-700/50 rounded mb-2"></div>
          <div className="h-4 w-32 bg-slate-700/50 rounded"></div>
        </div>
      );
    }

    const { value, trend, label, icon } = data || {};

    return (
      <div className="h-full flex flex-col">
        {/* Icon Container with Glow Effect */}
        <div className="mb-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(59, 130, 246, 0.05)',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.1)'
            }}
          >
            {icon && React.cloneElement(icon, { className: "w-6 h-6 text-blue-400" })}
          </div>
        </div>
        
        {/* Value with Gradient Text */}
        <div 
          className="text-3xl font-bold mb-2"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.8) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          {value?.toLocaleString() || '0'}
        </div>
        
        {/* Label */}
        <div className="text-sm text-gray-400 mb-3">{label}</div>
        
        {/* Trend with Animation */}
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium",
            trend > 0 ? "text-green-400" : "text-red-400"
          )}>
            {trend > 0 ? 
              <ArrowTrendingUpIcon className="w-4 h-4" /> :
              <ArrowTrendingDownIcon className="w-4 h-4" />
            }
            <span>{trend > 0 ? '+' : ''}{trend.toFixed(1)}%</span>
            <span className="text-gray-500 font-normal">vs yesterday</span>
          </div>
        )}
      </div>
    );
  };

  // 渲染圖表
  const renderChart = () => {
    // 如果啟用 GraphQL，檢查是否有對應的 GraphQL 組件
    if (ENABLE_GRAPHQL) {
      // Top 5 Products by Quantity
      if (config.title === 'Top 5 Products by Quantity' && config.chartType === 'bar') {
        return (
          <Suspense fallback={
            <div className="animate-pulse h-full bg-slate-700 rounded"></div>
          }>
            <TopProductsChartGraphQL
              title={config.title}
              timeFrame={timeFrame}
              className="h-full"
              limit={5}
            />
          </Suspense>
        );
      }
      
      // Top 10 Products Distribution
      if (config.title === 'Top 10 Products Distribution' && config.chartType === 'donut') {
        return (
          <Suspense fallback={
            <div className="animate-pulse h-full bg-slate-700 rounded"></div>
          }>
            <ProductDistributionChartGraphQL
              title={config.title}
              timeFrame={timeFrame}
              className="h-full"
              limit={10}
            />
          </Suspense>
        );
      }
      
      // Staff Workload
      if (config.title === 'Staff Workload' && config.chartType === 'line') {
        return (
          <Suspense fallback={
            <div className="animate-pulse h-full bg-slate-700 rounded"></div>
          }>
            <StaffWorkloadGraphQL
              title={config.title}
              timeFrame={timeFrame}
              className="h-full"
              department="Injection"
            />
          </Suspense>
        );
      }
    }
    
    if (loading) {
      return (
        <div className="animate-pulse h-full bg-slate-700 rounded"></div>
      );
    }

    const chartData = data?.chartData || [];
    
    let ChartComponent = <div />; // Default component
    if (config.chartType === 'line') {
      // Check if this is workload data with multiple users
      const isWorkloadData = data?.userNames && data.userNames.length > 0;
      
      if (isWorkloadData) {
        ChartComponent = (
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
            <YAxis stroke="#94a3b8" fontSize={11} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px'
              }}
            />
            {/* Render a line for each user */}
            {data.userNames.map((userName: string, index: number) => (
              <Line 
                key={userName}
                type="monotone" 
                dataKey={userName} 
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );
      } else {
        // Default single line chart
        ChartComponent = (
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
            <YAxis stroke="#94a3b8" fontSize={11} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 3 }}
            />
          </LineChart>
        );
      }
    } else if (config.chartType === 'bar') {
      ChartComponent = (
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} angle={-45} textAnchor="end" height={60} />
          <YAxis stroke="#94a3b8" fontSize={11} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px'
            }}
          />
          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      );
    } else if (config.chartType === 'pie' || config.chartType === 'donut') {
      // Calculate percentages
      const total = chartData.reduce((sum: number, entry: any) => sum + entry.value, 0);
      const dataWithPercentage = chartData.map((entry: any) => ({
        ...entry,
        percentage: ((entry.value / total) * 100).toFixed(1)
      }));

      ChartComponent = (
        <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Pie
            data={dataWithPercentage}
            cx="50%"
            cy="50%"
            innerRadius={config.chartType === 'donut' ? 50 : 0}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            label={(entry) => `${entry.percentage}%`}
            labelLine={false}
          >
            {dataWithPercentage.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px'
            }}
            formatter={(value: any, name: any, props: any) => [
              `${value.toLocaleString()} (${props.payload.percentage}%)`,
              props.payload.name
            ]}
          />
        </PieChart>
      );
    } else if (config.chartType === 'area') {
      ChartComponent = (
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
          <YAxis stroke="#94a3b8" fontSize={11} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#3b82f6" 
            fill="#3b82f6" 
            fillOpacity={0.3}
          />
        </AreaChart>
      );
    }
    
    return (
      <div className="h-full flex flex-col">
        <ResponsiveContainer width="100%" height={data?.legendData || (config.chartType === 'donut' && chartData.length > 0) ? "85%" : "100%"}>
          {ChartComponent}
        </ResponsiveContainer>
        
        {/* Legend for workload chart */}
        {data?.legendData && data.legendData.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mt-1">
            {data.legendData.map((item: any, index: number) => (
              <div key={item.value} className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-gray-300">{item.value}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Legend for donut/pie chart */}
        {(config.chartType === 'donut' || config.chartType === 'pie') && chartData.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center mt-1 px-1 overflow-y-auto max-h-20">
            {chartData.slice(0, 10).map((item: any, index: number) => (
              <div key={item.name} className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className="text-xs text-gray-300 truncate max-w-[80px]" title={item.name}>
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 渲染列表
  const renderList = () => {
    if (loading) {
      return (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-700 rounded animate-pulse"></div>
          ))}
        </div>
      );
    }

    const items = data?.items || [];

    return (
        <div className="space-y-2 overflow-y-auto h-full">
          {items.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  {item.icon || <CubeIcon className="w-6 h-6 text-blue-500" />}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{item.title}</div>
                  <div className="text-xs text-gray-400">{item.subtitle}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-white">{item.value}</div>
                <div className="text-xs text-gray-400">{item.time}</div>
              </div>
            </div>
          ))}
        </div>
    );
  };

  // 渲染表格
  const renderTable = () => {
    // 如果啟用 GraphQL 且是 Production Details
    if (ENABLE_GRAPHQL && config.title === 'Production Details') {
      return (
        <Suspense fallback={
          <div className="animate-pulse">
            <div className="h-10 bg-slate-700 rounded mb-2"></div>
            <div className="space-y-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 bg-slate-700 rounded"></div>
              ))}
            </div>
          </div>
        }>
          <ProductionDetailsGraphQL
            title={config.title}
            timeFrame={timeFrame}
            className="h-full"
          />
        </Suspense>
      );
    }
    
    if (loading) {
      return (
        <div className="animate-pulse">
          <div className="h-10 bg-slate-700 rounded mb-2"></div>
          <div className="space-y-1">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-8 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      );
    }

    const { headers, rows } = data || { headers: [], rows: [] };

    return (
        <div className="overflow-x-auto h-full">
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-800/90 z-10">
              <tr className="border-b border-slate-700">
                {headers.map((header: string, index: number) => (
                  <th key={index} className="text-left py-2 px-3 text-xs font-medium text-gray-400 uppercase whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows?.map((row: any[], rowIndex: number) => (
                <tr key={rowIndex} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  {row.map((cell: any, cellIndex: number) => (
                    <td key={cellIndex} className="py-2 px-3 text-sm text-white whitespace-nowrap">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    );
  };

  // 渲染特殊組件
  const renderSpecialComponent = () => {
    switch (config.component) {
      case 'HistoryTree':
        return (
          <div className="h-full flex flex-col items-center justify-center text-white">
            <ClockIcon className="w-16 h-16 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">History Tree</h3>
            <p className="text-sm text-gray-400">Component has been removed</p>
          </div>
        );
      case 'WarehouseHeatmap':
        return (
          <div className="h-full flex flex-col items-center justify-center text-white">
            <ChartBarIcon className="w-16 h-16 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Warehouse Heatmap</h3>
            <p className="text-sm text-gray-400">Component has been removed</p>
          </div>
        );
      case 'PipelineFlowDiagram':
        return (
          <div className="h-full flex flex-col items-center justify-center text-white">
            <div className="text-6xl mb-4">⚙️</div>
            <h3 className="text-xl font-semibold mb-2">Pipeline Flow</h3>
            <p className="text-sm text-gray-400">Real-time pipeline visualization</p>
          </div>
        );
      case 'UploadZone':
        return (
          <div className="h-full flex flex-col items-center justify-center text-white p-8">
            <DocumentArrowDownIcon className="w-16 h-16 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Upload Zone</h3>
            <p className="text-sm text-gray-400 mb-6">Drag and drop files here or click to browse</p>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Select Files
            </button>
          </div>
        );
      case 'UpdateForm':
        return <ProductUpdateComponent />;
      case 'ReportGeneratorWidget':
        return (
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-800/50" />}>
            <ReportGeneratorWidget 
              title={config.title}
              reportType={config.reportType || ''}
              description={config.description}
              apiEndpoint={config.apiEndpoint}
            />
          </Suspense>
        );
      case 'ReportGeneratorWithDialogWidget':
        return (
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-800/50" />}>
            <ReportGeneratorWithDialogWidget 
              title={config.title}
              reportType={config.reportType || ''}
              description={config.description}
              apiEndpoint={config.apiEndpoint}
              dialogTitle={config.dialogTitle || ''}
              dialogDescription={config.dialogDescription || ''}
              selectLabel={config.selectLabel || ''}
              dataTable={config.dataTable || ''}
              referenceField={config.referenceField || ''}
            />
          </Suspense>
        );
      case 'AvailableSoonWidget':
        return (
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-800/50" />}>
            <AvailableSoonWidget title={config.title} />
          </Suspense>
        );
      case 'StockInventoryTable':
        return (
          <div className="h-full p-6 overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Stock Inventory</h3>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  className="px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none text-white text-sm"
                />
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  Export
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">Product Code</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">Description</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase">On Hand</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase">Reserved</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase">Available</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8">
                        <div className="animate-pulse">Loading stock data...</div>
                      </td>
                    </tr>
                  ) : (
                    Array.from({ length: 10 }, (_, i) => (
                      <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="py-3 px-4 text-sm text-white font-medium">PC00{i + 1}</td>
                        <td className="py-3 px-4 text-sm text-gray-300">Product Description {i + 1}</td>
                        <td className="py-3 px-4 text-sm text-white text-right">{Math.floor(Math.random() * 1000)}</td>
                        <td className="py-3 px-4 text-sm text-white text-right">{Math.floor(Math.random() * 100)}</td>
                        <td className="py-3 px-4 text-sm text-white text-right">{Math.floor(Math.random() * 900)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            Math.random() > 0.7 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                          }`}>
                            {Math.random() > 0.7 ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      // Upload page widgets
      case 'OrdersListWidget':
        return (
          <Suspense fallback={<div className="h-full flex items-center justify-center"><div className="animate-pulse">Loading orders...</div></div>}>
            {ENABLE_GRAPHQL ? (
              <OrdersListGraphQL widget={{ 
                id: 'orders-list',
                type: 'CUSTOM' as any,
                title: 'Orders List',
                config: { size: 'LARGE' as any }
              }} isEditMode={false} />
            ) : (
              <OrdersListWidget widget={{ 
                id: 'orders-list',
                type: 'CUSTOM' as any,
                title: 'Orders List',
                config: { size: 'LARGE' as any }
              }} isEditMode={false} />
            )}
          </Suspense>
        );
      case 'OtherFilesListWidget':
        return (
          <Suspense fallback={<div className="h-full flex items-center justify-center"><div className="animate-pulse">Loading files...</div></div>}>
            {ENABLE_GRAPHQL ? (
              <OtherFilesListGraphQL widget={{ 
                id: 'other-files-list',
                type: 'CUSTOM' as any,
                title: 'Other Files',
                config: { size: 'LARGE' as any }
              }} isEditMode={false} />
            ) : (
              <OtherFilesListWidget widget={{ 
                id: 'other-files-list',
                type: 'CUSTOM' as any,
                title: 'Other Files',
                config: { size: 'LARGE' as any }
              }} isEditMode={false} />
            )}
          </Suspense>
        );
      case 'UploadFilesWidget':
        return (
          <Suspense fallback={<div className="h-full flex items-center justify-center"><div className="animate-pulse">Loading...</div></div>}>
            <UploadFilesWidget widget={{ 
              id: 'upload-files',
              type: 'UPLOAD_FILES' as any,
              title: 'Upload Files',
              config: { size: 'MEDIUM' as any }
            }} isEditMode={false} />
          </Suspense>
        );
      case 'UploadOrdersWidget':
        return (
          <Suspense fallback={<div className="h-full flex items-center justify-center"><div className="animate-pulse">Loading...</div></div>}>
            <UploadOrdersWidget widget={{ 
              id: 'upload-orders',
              type: 'UPLOAD_ORDER_PDF' as any,
              title: 'Upload Orders',
              config: { size: 'MEDIUM' as any }
            }} isEditMode={false} />
          </Suspense>
        );
      case 'UploadProductSpecWidget':
        return (
          <Suspense fallback={<div className="h-full flex items-center justify-center"><div className="animate-pulse">Loading...</div></div>}>
            <UploadProductSpecWidget widget={{ 
              id: 'upload-product-spec',
              type: 'PRODUCT_SPEC' as any,
              title: 'Upload Product Spec',
              config: { size: 'MEDIUM' as any }
            }} isEditMode={false} />
          </Suspense>
        );
      case 'UploadPhotoWidget':
        return (
          <Suspense fallback={<div className="h-full flex items-center justify-center"><div className="animate-pulse">Loading...</div></div>}>
            <UploadPhotoWidget widget={{ 
              id: 'upload-photo',
              type: 'CUSTOM' as any,
              title: 'Upload Photo',
              config: { size: 'MEDIUM' as any }
            }} isEditMode={false} />
          </Suspense>
        );
      default:
        return <div>Component {config.component} not found</div>;
    }
  };

  // 根據 widget 類型渲染內容
  const renderContent = () => {
    // 如果有特殊組件，優先渲染
    if (config.component) {
      return renderSpecialComponent();
    }

    switch (config.type) {
      case 'stats':
        return renderStatsCard();
      case 'chart':
        return renderChart();
      case 'list':
      case 'activity-feed':
        return renderList();
      case 'table':
        return renderTable();
      case 'alerts':
        return (
            <div className="text-center text-gray-400 py-8">
              <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No alerts at this time</p>
            </div>
        );
      case 'preview':
        return <SupplierUpdateComponent />;
      case 'report-generator':
        return (
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-800/50" />}>
            <ReportGeneratorWidget 
              title={config.title}
              reportType={config.reportType || ''}
              description={config.description}
              apiEndpoint={config.apiEndpoint}
            />
          </Suspense>
        );
      case 'report-generator-dialog':
        return (
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-800/50" />}>
            <ReportGeneratorWithDialogWidget 
              title={config.title}
              reportType={config.reportType || ''}
              description={config.description}
              apiEndpoint={config.apiEndpoint}
              dialogTitle={config.dialogTitle || ''}
              dialogDescription={config.dialogDescription || ''}
              selectLabel={config.selectLabel || ''}
              dataTable={config.dataTable || ''}
              referenceField={config.referenceField || ''}
            />
          </Suspense>
        );
      case 'available-soon':
        return (
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-800/50" />}>
            <AvailableSoonWidget title={config.title} />
          </Suspense>
        );
      default:
        return (
          <div className="text-center text-gray-400">
            <p>Widget type &quot;{config.type}&quot; not implemented</p>
          </div>
        );
    }
  };

  // For special components like HistoryTree, return with special handling
  const specialComponents = [
    'HistoryTree', 'PipelineFlowDiagram', 'WarehouseHeatmap', 'UploadZone', 
    'UpdateForm', 'StockInventoryTable', 'OrdersListWidget', 'OtherFilesListWidget'
  ];
  
  // Upload widgets should be rendered without wrapper
  const uploadComponents = ['UploadFilesWidget', 'UploadOrdersWidget', 'UploadProductSpecWidget', 'UploadPhotoWidget'];
  
  if (config.component && uploadComponents.includes(config.component)) {
    return renderContent();
  }
  
  if (config.component && specialComponents.includes(config.component)) {
    return (
      <div className="h-full w-full p-6">
        {renderContent()}
      </div>
    );
  }

  // For regular widgets in custom themes, they're already wrapped by CustomThemeLayout
  const isCustomTheme = theme === 'injection' || theme === 'pipeline' || theme === 'warehouse' || theme === 'upload' || theme === 'update' || theme === 'stock-management' || theme === 'system' || theme === 'analysis';
  if (isCustomTheme) {
    // Use less padding for chart widgets to maximize space
    const padding = config.type === 'chart' ? 'p-3' : 'p-6';
    return (
      <div className={`h-full w-full ${padding}`}>
        {error ? (
          <div className="text-red-400 text-sm">Error: {error}</div>
        ) : (
          renderContent()
        )}
      </div>
    );
  }

  // Default layout widgets
  return (
    <div 
      style={{ gridArea: config.gridArea }}
      className="bg-slate-800/50 backdrop-blur rounded-lg p-4 overflow-hidden flex flex-col h-full"
    >
      {error ? (
        <div className="text-red-400 text-sm">Error: {error}</div>
      ) : (
        renderContent()
      )}
    </div>
  );
};

// 模擬數據生成函數
function getMockData(config: AdminWidgetConfig): any {
  switch (config.type) {
    case 'stats':
      return {
        value: Math.floor(Math.random() * 1000) + 100,
        trend: (Math.random() - 0.5) * 20,
        label: config.title,
        icon: <CubeIcon className="w-8 h-8" />
      };

    case 'chart':
      return {
        chartData: Array.from({ length: 12 }, (_, i) => ({
          name: `${i + 1}:00`,
          value: Math.floor(Math.random() * 100) + 50
        }))
      };

    case 'list':
    case 'activity-feed':
      return {
        items: Array.from({ length: 5 }, (_, i) => ({
          title: `Item ${i + 1}`,
          subtitle: `Details for item ${i + 1}`,
          value: Math.floor(Math.random() * 100),
          time: `${10 + i}:30 AM`
        }))
      };

    case 'table':
      return {
        headers: ['Product', 'Quantity', 'Status', 'Time'],
        rows: Array.from({ length: 5 }, (_, i) => [
          `PC00${i + 1}`,
          Math.floor(Math.random() * 1000),
          'Active',
          `${10 + i}:00 AM`
        ])
      };

    default:
      return null;
  }
}

// Product Update Component - 從 ProductUpdateTab 移植
interface StatusMessageType {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

function ProductUpdateComponent() {
  // 狀態管理
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchedCode, setSearchedCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<StatusMessageType | null>(null);
  
  // 表單狀態
  const [formData, setFormData] = useState<ProductData>({
    code: '',
    description: '',
    colour: '',
    standard_qty: 0,
    type: ''
  });

  // 重置狀態
  const resetState = useCallback(() => {
    setProductData(null);
    setIsEditing(false);
    setShowCreateDialog(false);
    setShowForm(false);
    setSearchedCode('');
    setStatusMessage(null);
    setFormData({
      code: '',
      description: '',
      colour: '',
      standard_qty: 0,
      type: ''
    });
  }, []);

  // 搜尋產品
  const handleSearch = useCallback(async (code: string) => {
    if (!code.trim()) {
      setStatusMessage({
        type: 'error',
        message: 'Please enter a product code'
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    setSearchedCode(code.trim());
    
    try {
      const result = await getProductByCode(code.trim());
      
      if (result.success && result.data) {
        // 搜尋成功 - 顯示產品信息
        setProductData(result.data);
        setIsEditing(false);
        setShowForm(false);
        setShowCreateDialog(false);
        setStatusMessage({
          type: 'success',
          message: `Product found: ${result.data.code}`
        });
      } else {
        // 搜尋失敗 - 詢問是否新增
        setProductData(null);
        setShowCreateDialog(true);
        setShowForm(false);
        setIsEditing(false);
        setStatusMessage({
          type: 'warning',
          message: `Product "${code.trim()}" not found. Would you like to create it?`
        });
      }
    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: 'An unexpected error occurred during the search.'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 開始編輯
  const handleEdit = useCallback(() => {
    if (productData) {
      setFormData(productData);
      setIsEditing(true);
      setShowForm(true);
      setShowCreateDialog(false);
    }
  }, [productData]);

  // 確認新增產品
  const handleConfirmCreate = useCallback(() => {
    setFormData({
      code: searchedCode,
      description: '',
      colour: '',
      standard_qty: 0,
      type: ''
    });
    setIsEditing(false);
    setShowForm(true);
    setShowCreateDialog(false);
    setStatusMessage({
      type: 'info',
      message: 'Fill in the product details below to create a new product.'
    });
  }, [searchedCode]);

  // 取消操作
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setShowForm(false);
    setShowCreateDialog(false);
    setStatusMessage(null);
  }, []);

  // 提交表單
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      let result;
      
      if (isEditing && productData) {
        // 更新現有產品
        const { code: _, ...updateData } = formData;
        
        // 確保數據類型正確
        if (typeof updateData.standard_qty === 'string') {
          updateData.standard_qty = parseInt(updateData.standard_qty as any) || 0;
        }
        
        result = await updateProduct(productData.code, updateData);
        
        if (result.success) {
          setProductData(result.data!);
          setStatusMessage({
            type: 'success',
            message: 'Product details updated successfully!'
          });
        }
      } else {
        // 新增產品
        result = await createProduct(formData);
        if (result.success) {
          setProductData(result.data!);
          setStatusMessage({
            type: 'success',
            message: 'Product created successfully!'
          });
        }
      }
      
      if (!result.success) {
        setStatusMessage({
          type: 'error',
          message: result.error || 'Operation failed'
        });
        return;
      }
      
      // 成功後重置狀態
      setIsEditing(false);
      setShowForm(false);
      setShowCreateDialog(false);
      
    } catch (error) {
      console.error('[ProductUpdate] Unexpected error:', error);
      setStatusMessage({
        type: 'error',
        message: 'An unexpected error occurred.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [isEditing, productData, formData]);

  // 處理表單輸入變化
  const handleInputChange = useCallback((field: keyof ProductData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // 處理 Enter 鍵搜尋
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      const target = e.target as HTMLInputElement;
      handleSearch(target.value);
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-900/50 via-orange-900/20 to-slate-800/50">
      <div className="h-full overflow-y-auto">
        {/* Search Section */}
        {!showForm && (
          <div className="relative group mb-6 p-6">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-orange-900/30 rounded-2xl blur-xl"></div>
            <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-orange-900/20 hover:border-orange-500/30 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
              <div className="relative z-10">
                <h3 className="text-lg font-medium bg-gradient-to-r from-orange-300 to-amber-300 bg-clip-text text-transparent mb-4">
                  Update Product
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex gap-3 mt-2">
                      <Input
                        id="search"
                        type="text"
                        placeholder="Enter product code and press Enter..."
                        onKeyPress={handleKeyPress}
                        className="flex-1 bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder-slate-400 focus:border-orange-500/70 focus:bg-slate-700/70 hover:border-orange-500/50 hover:bg-slate-700/60 transition-all duration-300"
                        disabled={isLoading || showCreateDialog}
                      />
                      <Button
                        onClick={() => {
                          const input = document.getElementById('search') as HTMLInputElement;
                          if (input) handleSearch(input.value);
                        }}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:from-slate-600 disabled:to-slate-600 text-white px-6 shadow-lg hover:shadow-orange-500/25 hover:scale-105 active:scale-95 transition-all duration-300"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Searching...
                          </>
                        ) : (
                          <>
                            <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                            Search
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New Search Button */}
        {showForm && (
          <div className="flex justify-between items-center mb-6 px-6">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-white via-orange-100 to-amber-100 bg-clip-text text-transparent">
              {isEditing ? 'Edit Product' : 'Create New Product'}
            </h3>
            <Button
              onClick={resetState}
              variant="outline"
              className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 hover:border-orange-400/70 bg-slate-800/50 backdrop-blur-sm"
            >
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              New Search
            </Button>
          </div>
        )}

        {/* Status Message */}
        {statusMessage && (
          <div className={`p-4 rounded-xl mb-6 mx-6 backdrop-blur-sm border ${
            statusMessage.type === 'success' ? 'bg-green-500/10 border-green-500/30' :
            statusMessage.type === 'error' ? 'bg-red-500/10 border-red-500/30' :
            statusMessage.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
            'bg-blue-500/10 border-blue-500/30'
          }`}>
            <p className={`text-sm ${
              statusMessage.type === 'success' ? 'text-green-400' :
              statusMessage.type === 'error' ? 'text-red-400' :
              statusMessage.type === 'warning' ? 'text-yellow-400' :
              'text-blue-400'
            }`}>
              {statusMessage.message}
            </p>
          </div>
        )}

        {/* Create Confirmation Dialog */}
        {showCreateDialog && (
          <div className="relative group mb-6 px-6">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-yellow-900/30 rounded-2xl blur-xl"></div>
            <div className="relative bg-slate-800/40 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6 shadow-xl shadow-yellow-900/20">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-amber-500/5 opacity-100 rounded-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-start space-x-4">
                  <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-yellow-400 mb-2">
                      Product Not Found
                    </h3>
                    <p className="text-slate-300 mb-4">
                      The product code &quot;{searchedCode}&quot; was not found in the database. 
                      Would you like to create a new product with this code?
                    </p>
                    <div className="flex space-x-3">
                      <Button
                        onClick={handleConfirmCreate}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg hover:shadow-green-500/25 hover:scale-105 active:scale-95 transition-all duration-300"
                      >
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        Yes, Create Product
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500/70 hover:text-white transition-all duration-300"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Info Display */}
        {productData && !showForm && (
          <div className="px-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-orange-900/30 rounded-2xl blur-xl"></div>
              <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-orange-900/20 hover:border-orange-500/30 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-2xl"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium bg-gradient-to-r from-orange-300 to-amber-300 bg-clip-text text-transparent">
                      Product Information
                    </h4>
                    <Button
                      onClick={handleEdit}
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg hover:shadow-blue-500/25 hover:scale-105 active:scale-95 transition-all duration-300"
                    >
                      <PencilIcon className="w-4 h-4 mr-2" />
                      Edit Product
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <ProductInfoRow label="Product Code" value={productData.code} />
                    <ProductInfoRow label="Description" value={productData.description} />
                    <ProductInfoRow label="Colour" value={productData.colour} />
                    <ProductInfoRow label="Standard Quantity" value={productData.standard_qty.toString()} />
                    <ProductInfoRow label="Type" value={productData.type} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Form */}
        {showForm && (
          <div className="px-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-orange-900/30 rounded-2xl blur-xl"></div>
              <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-orange-900/20">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-amber-500/5 opacity-100 rounded-2xl"></div>
                <div className="relative z-10">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="code" className="text-slate-200 font-medium">
                          Product Code *
                        </Label>
                        <Input
                          id="code"
                          type="text"
                          value={formData.code}
                          onChange={(e) => handleInputChange('code', e.target.value)}
                          disabled={isEditing}
                          className="mt-2 bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder-slate-400 focus:border-orange-500/70 focus:bg-slate-700/70 disabled:opacity-50 disabled:cursor-not-allowed"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="type" className="text-slate-200 font-medium">
                          Type *
                        </Label>
                        <Input
                          id="type"
                          type="text"
                          value={formData.type}
                          onChange={(e) => handleInputChange('type', e.target.value)}
                          className="mt-2 bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder-slate-400 focus:border-orange-500/70 focus:bg-slate-700/70"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="description" className="text-slate-200 font-medium">
                          Description *
                        </Label>
                        <Input
                          id="description"
                          type="text"
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          className="mt-2 bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder-slate-400 focus:border-orange-500/70 focus:bg-slate-700/70"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="colour" className="text-slate-200 font-medium">
                          Colour
                        </Label>
                        <Input
                          id="colour"
                          type="text"
                          value={formData.colour}
                          onChange={(e) => handleInputChange('colour', e.target.value)}
                          className="mt-2 bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder-slate-400 focus:border-orange-500/70 focus:bg-slate-700/70"
                        />
                      </div>

                      <div>
                        <Label htmlFor="standard_qty" className="text-slate-200 font-medium">
                          Standard Quantity *
                        </Label>
                        <Input
                          id="standard_qty"
                          type="number"
                          value={formData.standard_qty}
                          onChange={(e) => handleInputChange('standard_qty', parseInt(e.target.value) || 0)}
                          className="mt-2 bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder-slate-400 focus:border-orange-500/70 focus:bg-slate-700/70"
                          min="0"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4">
                      <Button
                        type="button"
                        onClick={handleCancel}
                        variant="outline"
                        className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500/70 hover:text-white transition-all duration-300"
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:from-slate-600 disabled:to-slate-600 text-white shadow-lg hover:shadow-orange-500/25 hover:scale-105 active:scale-95 transition-all duration-300"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            {isEditing ? 'Updating...' : 'Creating...'}
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="w-4 h-4 mr-2" />
                            {isEditing ? 'Update Product' : 'Create Product'}
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Product Info Row Component
interface ProductInfoRowProps {
  label: string;
  value: string;
}

function ProductInfoRow({ label, value }: ProductInfoRowProps) {
  return (
    <div className="flex justify-between items-center py-3 px-4 bg-slate-700/30 border border-slate-600/30 rounded-xl">
      <span className="text-slate-300 font-medium">{label}:</span>
      <span className="text-slate-100 font-semibold">{value || '-'}</span>
    </div>
  );
}

// Supplier Update Component - 從 SupplierUpdateTab 移植
interface SupplierData {
  supplier_code: string;
  supplier_name: string;
}

function SupplierUpdateComponent() {
  // 狀態管理
  const [supplierData, setSupplierData] = useState<SupplierData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchedCode, setSearchedCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<StatusMessageType | null>(null);
  
  // 表單狀態
  const [formData, setFormData] = useState<SupplierData>({
    supplier_code: '',
    supplier_name: ''
  });

  const supabase = createClient();

  // 重置狀態
  const resetState = useCallback(() => {
    setSupplierData(null);
    setIsEditing(false);
    setShowCreateDialog(false);
    setShowForm(false);
    setSearchedCode('');
    setStatusMessage(null);
    setFormData({
      supplier_code: '',
      supplier_name: ''
    });
  }, []);

  // 搜尋供應商
  const handleSearch = useCallback(async (code: string) => {
    if (!code.trim()) {
      setStatusMessage({
        type: 'error',
        message: 'Please enter a supplier code'
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    setSearchedCode(code.trim().toUpperCase());
    
    try {
      const { data, error } = await supabase
        .from('data_supplier')
        .select('*')
        .eq('supplier_code', code.trim().toUpperCase())
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        // 搜尋成功 - 顯示供應商信息
        setSupplierData(data);
        setIsEditing(false);
        setShowForm(false);
        setShowCreateDialog(false);
        setStatusMessage({
          type: 'success',
          message: `Supplier found: ${data.supplier_code}`
        });
      } else {
        // 搜尋失敗 - 詢問是否新增
        setSupplierData(null);
        setShowCreateDialog(true);
        setShowForm(false);
        setIsEditing(false);
        setStatusMessage({
          type: 'warning',
          message: `Supplier "${code.trim().toUpperCase()}" not found. Would you like to create it?`
        });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      setStatusMessage({
        type: 'error',
        message: 'An unexpected error occurred during the search.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // 開始編輯
  const handleEdit = useCallback(() => {
    if (supplierData) {
      setFormData(supplierData);
      setIsEditing(true);
      setShowForm(true);
      setShowCreateDialog(false);
    }
  }, [supplierData]);

  // 確認新增供應商
  const handleConfirmCreate = useCallback(() => {
    setFormData({
      supplier_code: searchedCode,
      supplier_name: ''
    });
    setIsEditing(false);
    setShowForm(true);
    setShowCreateDialog(false);
    setStatusMessage({
      type: 'info',
      message: 'Fill in the supplier details below to create a new supplier.'
    });
  }, [searchedCode]);

  // 取消操作
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setShowForm(false);
    setShowCreateDialog(false);
    setStatusMessage(null);
  }, []);

  // 提交表單
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isEditing && supplierData) {
        // 更新現有供應商
        const { data, error } = await supabase
          .from('data_supplier')
          .update({ supplier_name: formData.supplier_name })
          .eq('supplier_code', supplierData.supplier_code)
          .select()
          .single();
        
        if (error) throw error;
        
        setSupplierData(data);
        setStatusMessage({
          type: 'success',
          message: 'Supplier details updated successfully!'
        });
      } else {
        // 新增供應商
        const { data, error } = await supabase
          .from('data_supplier')
          .insert([formData])
          .select()
          .single();
        
        if (error) throw error;
        
        setSupplierData(data);
        setStatusMessage({
          type: 'success',
          message: 'Supplier created successfully!'
        });
      }
      
      // 成功後重置狀態
      setIsEditing(false);
      setShowForm(false);
      setShowCreateDialog(false);
      
    } catch (error: any) {
      console.error('Submit error:', error);
      setStatusMessage({
        type: 'error',
        message: error.message || 'An unexpected error occurred.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [isEditing, supplierData, formData, supabase]);

  // 處理表單輸入變化
  const handleInputChange = useCallback((field: keyof SupplierData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // 處理 Enter 鍵搜尋
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      const target = e.target as HTMLInputElement;
      handleSearch(target.value);
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-900/50 via-blue-900/20 to-slate-800/50">
      <div className="h-full overflow-y-auto">
        {/* Search Section */}
        {!showForm && (
          <div className="relative group mb-6 p-6">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-blue-900/30 rounded-2xl blur-xl"></div>
            <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-blue-900/20 hover:border-blue-500/30 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
              <div className="relative z-10">
                <h3 className="text-lg font-medium bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent mb-4">
                  Update Supplier
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex gap-3 mt-2">
                      <Input
                        id="search"
                        type="text"
                        placeholder="Enter supplier code and press Enter..."
                        onKeyPress={handleKeyPress}
                        className="flex-1 bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder-slate-400 focus:border-blue-500/70 focus:bg-slate-700/70 hover:border-blue-500/50 hover:bg-slate-700/60 transition-all duration-300"
                        disabled={isLoading || showCreateDialog}
                      />
                      <Button
                        onClick={() => {
                          const input = document.getElementById('search') as HTMLInputElement;
                          if (input) handleSearch(input.value);
                        }}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 text-white px-6 shadow-lg hover:shadow-blue-500/25 hover:scale-105 active:scale-95 transition-all duration-300"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Searching...
                          </>
                        ) : (
                          <>
                            <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                            Search
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New Search Button */}
        {showForm && (
          <div className="flex justify-between items-center mb-6 px-6">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
              {isEditing ? 'Edit Supplier' : 'Create New Supplier'}
            </h3>
            <Button
              onClick={resetState}
              variant="outline"
              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400/70 bg-slate-800/50 backdrop-blur-sm"
            >
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              New Search
            </Button>
          </div>
        )}

        {/* Status Message */}
        {statusMessage && (
          <div className={`p-4 rounded-xl mb-6 mx-6 backdrop-blur-sm border ${
            statusMessage.type === 'success' ? 'bg-green-500/10 border-green-500/30' :
            statusMessage.type === 'error' ? 'bg-red-500/10 border-red-500/30' :
            statusMessage.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
            'bg-blue-500/10 border-blue-500/30'
          }`}>
            <p className={`text-sm ${
              statusMessage.type === 'success' ? 'text-green-400' :
              statusMessage.type === 'error' ? 'text-red-400' :
              statusMessage.type === 'warning' ? 'text-yellow-400' :
              'text-blue-400'
            }`}>
              {statusMessage.message}
            </p>
          </div>
        )}

        {/* Create Confirmation Dialog */}
        {showCreateDialog && (
          <div className="relative group mb-6 px-6">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-yellow-900/30 rounded-2xl blur-xl"></div>
            <div className="relative bg-slate-800/40 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6 shadow-xl shadow-yellow-900/20">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-amber-500/5 opacity-100 rounded-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-start space-x-4">
                  <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-yellow-400 mb-2">
                      Supplier Not Found
                    </h3>
                    <p className="text-slate-300 mb-4">
                      The supplier code &quot;{searchedCode}&quot; was not found in the database. 
                      Would you like to create a new supplier with this code?
                    </p>
                    <div className="flex space-x-3">
                      <Button
                        onClick={handleConfirmCreate}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg hover:shadow-green-500/25 hover:scale-105 active:scale-95 transition-all duration-300"
                      >
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        Yes, Create Supplier
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500/70 hover:text-white transition-all duration-300"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Supplier Info Display */}
        {supplierData && !showForm && (
          <div className="px-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-blue-900/30 rounded-2xl blur-xl"></div>
              <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-blue-900/20 hover:border-blue-500/30 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-2xl"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                      Supplier Information
                    </h4>
                    <Button
                      onClick={handleEdit}
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg hover:shadow-blue-500/25 hover:scale-105 active:scale-95 transition-all duration-300"
                    >
                      <PencilIcon className="w-4 h-4 mr-2" />
                      Edit Supplier
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <SupplierInfoRow label="Supplier Code" value={supplierData.supplier_code} />
                    <SupplierInfoRow label="Supplier Name" value={supplierData.supplier_name} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Supplier Form */}
        {showForm && (
          <div className="px-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-blue-900/30 rounded-2xl blur-xl"></div>
              <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-blue-900/20">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-100 rounded-2xl"></div>
                <div className="relative z-10">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="supplier_code" className="text-slate-200 font-medium">
                          Supplier Code *
                        </Label>
                        <Input
                          id="supplier_code"
                          type="text"
                          value={formData.supplier_code}
                          onChange={(e) => handleInputChange('supplier_code', e.target.value.toUpperCase())}
                          disabled={isEditing}
                          className="mt-2 bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder-slate-400 focus:border-blue-500/70 focus:bg-slate-700/70 disabled:opacity-50 disabled:cursor-not-allowed"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="supplier_name" className="text-slate-200 font-medium">
                          Supplier Name *
                        </Label>
                        <Input
                          id="supplier_name"
                          type="text"
                          value={formData.supplier_name}
                          onChange={(e) => handleInputChange('supplier_name', e.target.value)}
                          className="mt-2 bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder-slate-400 focus:border-blue-500/70 focus:bg-slate-700/70"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4">
                      <Button
                        type="button"
                        onClick={handleCancel}
                        variant="outline"
                        className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500/70 hover:text-white transition-all duration-300"
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 text-white shadow-lg hover:shadow-blue-500/25 hover:scale-105 active:scale-95 transition-all duration-300"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            {isEditing ? 'Updating...' : 'Creating...'}
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="w-4 h-4 mr-2" />
                            {isEditing ? 'Update Supplier' : 'Create Supplier'}
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Supplier Info Row Component
interface SupplierInfoRowProps {
  label: string;
  value: string;
}

function SupplierInfoRow({ label, value }: SupplierInfoRowProps) {
  return (
    <div className="flex justify-between items-center py-3 px-4 bg-slate-700/30 border border-slate-600/30 rounded-xl">
      <span className="text-slate-300 font-medium">{label}:</span>
      <span className="text-slate-100 font-semibold">{value || '-'}</span>
    </div>
  );
}