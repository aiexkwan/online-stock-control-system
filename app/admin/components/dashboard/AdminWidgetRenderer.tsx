/**
 * Admin Widget Renderer
 * 根據配置渲染不同類型的 Admin Widget
 */

'use client';

import React, { useState, useEffect, Suspense } from 'react';
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
  ArrowPathIcon
} from '@heroicons/react/24/outline';
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
    } else if (config.chartType === 'bar') {
      // 載入 Top 5 產品數據
      const { data: palletData, error } = await supabase
        .from('record_palletinfo')
        .select('product_code, product_qty')
        .ilike('plt_remark', '%finished in production%')
        .not('product_code', 'ilike', 'U%')
        .gte('generate_time', timeFrame.start.toISOString())
        .lte('generate_time', timeFrame.end.toISOString());

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
      // 載入 Top 10 產品數據
      const { data: palletData, error } = await supabase
        .from('record_palletinfo')
        .select('product_code, product_qty')
        .ilike('plt_remark', '%finished in production%')
        .not('product_code', 'ilike', 'U%')
        .gte('generate_time', timeFrame.start.toISOString())
        .lte('generate_time', timeFrame.end.toISOString());

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
          const { data: operatorData } = await supabase
            .from('data_id')
            .select('name')
            .eq('id', historyData[0].id)
            .single();
          
          if (operatorData) {
            qcOperator = operatorData.name;
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

  // 載入員工工作量數據
  const loadWorkLevel = async (supabase: any, timeFrame: TimeFrame) => {
    try {
      // 獲取 Injection 部門的員工
      const { data: allUsers } = await supabase
        .from('data_id')
        .select('id, name')
        .eq('Department', 'Injection')
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
        return (
          <div className="h-full p-6 text-white">
            <h3 className="text-xl font-semibold mb-4">Update Data Form</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Product Code</label>
                <input type="text" className="w-full px-3 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Quantity</label>
                <input type="number" className="w-full px-3 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none" />
              </div>
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Submit Update
              </button>
            </div>
          </div>
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
      default:
        return (
          <div className="text-center text-gray-400">
            <p>Widget type &quot;{config.type}&quot; not implemented</p>
          </div>
        );
    }
  };

  // For special components like HistoryTree, return with special handling
  if (config.component === 'HistoryTree' || config.component === 'PipelineFlowDiagram' || config.component === 'WarehouseHeatmap' || config.component === 'UploadZone' || config.component === 'UpdateForm' || config.component === 'StockInventoryTable') {
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