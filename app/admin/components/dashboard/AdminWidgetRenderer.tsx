/**
 * Admin Widget Renderer
 * 根據配置渲染不同類型的 Admin Widget
 */

'use client';

import React, { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { AdminWidgetConfig } from './adminDashboardLayouts';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';
import { createClient } from '@/lib/supabase';
import { useAdminRefresh } from '@/app/admin/contexts/AdminRefreshContext';
import { LazyComponents } from './LazyWidgetRegistry';
import { widgetRegistry } from '@/lib/widgets/enhanced-registry';
import { useWidgetState } from '@/app/hooks/useMemory';
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
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
  delay?: number;
}

// 主題顏色映射 - 配合 GlowCard 效果
const THEME_GLOW_COLORS = {
  injection: 'production',
  pipeline: 'search', 
  warehouse: 'warehouse',
  analysis: 'inventory',
  upload: 'search',
  update: 'update',
  'stock-management': 'production',
  system: 'update'
} as const;

type ThemeKey = 'production' | 'warehouse' | 'inventory' | 'update' | 'search';

const getThemeGlowColor = (theme?: string): ThemeKey => {
  return theme && theme in THEME_GLOW_COLORS 
    ? THEME_GLOW_COLORS[theme as keyof typeof THEME_GLOW_COLORS] as ThemeKey
    : 'warehouse'; // 默認 warehouse（藍色）
};

// GlowCard 顏色配置已移至 GlowCard 組件內部

// 統一的 Widget Wrapper Component - 使用 SpotlightCard 提供真正的 spotlight effect
const UnifiedWidgetWrapper = React.memo<{
  children: React.ReactNode;
  isCustomTheme?: boolean;
  hasError?: boolean;
  className?: string;
  style?: React.CSSProperties;
  theme?: string;
}>(({ children, isCustomTheme, hasError, className, style, theme }) => {
  const spotlightTheme = getThemeGlowColor(theme);

  if (hasError) {
    return (
      <SpotlightCard 
        className={cn("h-full w-full", className)}
        theme={spotlightTheme}
        disableSpotlight={true}
      >
        <div 
          className="h-full w-full bg-red-900/10 backdrop-blur-sm"
          style={{ ...style, borderRadius: "1rem" }}
        >
          <div className="p-4 text-red-400 text-sm font-bold">
            <div className="bg-red-900/50 backdrop-blur-sm rounded-lg p-3 border border-red-500/30">
              {children}
            </div>
          </div>
        </div>
      </SpotlightCard>
    );
  }

  // 使用 SpotlightCard 提供完整的 spotlight 動畫效果
  return (
    <SpotlightCard 
      className={cn("h-full w-full", className)}
      theme={spotlightTheme}
      spotlightSize={400}
      spotlightIntensity={0.15}
      disableSpotlight={false}
      borderRadius="1rem"
    >
      <div 
        className="h-full w-full bg-slate-900/10 backdrop-blur-sm transition-all duration-300"
        style={{ ...style, borderRadius: "1rem" }}
      >
        <div className="h-full w-full text-content-enhanced">
          {children}
        </div>
      </div>
    </SpotlightCard>
  );
}, (prevProps, nextProps) => {
  // 自定義比較函數 - 只比較真正會影響渲染的 props
  return (
    prevProps.isCustomTheme === nextProps.isCustomTheme &&
    prevProps.hasError === nextProps.hasError &&
    prevProps.className === nextProps.className &&
    prevProps.theme === nextProps.theme &&
    prevProps.style === nextProps.style &&
    prevProps.children === nextProps.children
  );
});

UnifiedWidgetWrapper.displayName = 'UnifiedWidgetWrapper';

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
import { HistoryTreeV2 as HistoryTree } from './widgets/HistoryTreeV2';
import { getEnhancedWidgetComponent } from './LazyWidgetRegistry';
import { SpotlightCard } from '../ui/SpotlightCard';

// 新的上傳頁面組件 - 使用 lazy loading
const OrdersListWidget = React.lazy(() => import('./widgets/OrdersListWidgetV2').then(mod => ({ default: mod.OrdersListWidgetV2 })));
const OtherFilesListWidget = React.lazy(() => import('./widgets/OtherFilesListWidgetV2').then(mod => ({ default: mod.OtherFilesListWidgetV2 })));
const UploadFilesWidget = React.lazy(() => import('./widgets/UploadFilesWidget').then(mod => ({ default: mod.UploadFilesWidget })));

// Analysis page components
const AnalysisPagedWidget = React.lazy(() => import('./widgets/AnalysisPagedWidgetV2').then(mod => ({ default: mod.AnalysisPagedWidgetV2 })));
const AnalysisPagedWidgetV2 = React.lazy(() => import('./widgets/AnalysisPagedWidgetV2').then(mod => ({ default: mod.AnalysisPagedWidgetV2 })));
const AnalysisExpandableCards = React.lazy(() => import('./widgets/AnalysisExpandableCards').then(mod => ({ default: mod.AnalysisExpandableCards })));
const UploadOrdersWidget = React.lazy(() => import('./widgets/UploadOrdersWidgetV2').then(mod => ({ default: mod.UploadOrdersWidgetV2 })));
const UploadProductSpecWidget = React.lazy(() => import('./widgets/UploadProductSpecWidget').then(mod => ({ default: mod.UploadProductSpecWidget })));
const UploadPhotoWidget = React.lazy(() => import('./widgets/UploadPhotoWidget').then(mod => ({ default: mod.UploadPhotoWidget })));
const ReportGeneratorWidget = React.lazy(() => import('./widgets/ReportGeneratorWithDialogWidgetV2').then(mod => ({ default: mod.ReportGeneratorWithDialogWidgetV2 })));
const TransactionReportWidget = React.lazy(() => import('./widgets/TransactionReportWidget').then(mod => ({ default: mod.TransactionReportWidget })));
const GrnReportWidget = React.lazy(() => import('./widgets/GrnReportWidgetV2').then(mod => ({ default: mod.GrnReportWidgetV2 })));
const AcoOrderReportWidget = React.lazy(() => import('./widgets/AcoOrderReportWidgetV2').then(mod => ({ default: mod.AcoOrderReportWidgetV2 })));
const ReportGeneratorWithDialogWidget = React.lazy(() => import('./widgets/ReportGeneratorWithDialogWidgetV2').then(mod => ({ default: mod.ReportGeneratorWithDialogWidgetV2 })));
const AvailableSoonWidget = React.lazy(() => import('./widgets/AvailableSoonWidget'));

// Production monitoring widgets - Server Actions versions
const ProductionStatsWidget = React.lazy(() => import('./widgets/ProductionStatsWidget').then(mod => ({ default: mod.ProductionStatsWidget })));
const TopProductsChartWidget = React.lazy(() => import('./widgets/TopProductsChartWidget').then(mod => ({ default: mod.TopProductsChartWidget })));
const ProductDistributionChartWidget = React.lazy(() => import('./widgets/ProductDistributionChartWidget').then(mod => ({ default: mod.ProductDistributionChartWidget })));
const ProductionDetailsWidget = React.lazy(() => import('./widgets/ProductionDetailsWidget').then(mod => ({ default: mod.ProductionDetailsWidget })));
const StaffWorkloadWidget = React.lazy(() => import('./widgets/StaffWorkloadWidget').then(mod => ({ default: mod.StaffWorkloadWidget })));
// Server Actions widgets - optimized for performance

// Warehouse Dashboard 組件
const AwaitLocationQtyWidget = React.lazy(() => import('./widgets/AwaitLocationQtyWidget'));
const YesterdayTransferCountWidget = React.lazy(() => import('./widgets/YesterdayTransferCountWidget'));
const StillInAwaitWidget = React.lazy(() => import('./widgets/StillInAwaitWidget').then(mod => ({ default: mod.StillInAwaitWidget })));

// Stock Management 組件
const StockTypeSelector = React.lazy(() => import('./widgets/StockTypeSelector').then(mod => ({ default: mod.StockTypeSelector })));
const StockDistributionChart = React.lazy(() => import('./widgets/StockDistributionChartV2').then(mod => ({ default: mod.StockDistributionChartV2 })));
const StockLevelHistoryChart = React.lazy(() => import('./widgets/StockLevelHistoryChart').then(mod => ({ default: mod.StockLevelHistoryChart })));
const InventoryOrderedAnalysisWidget = React.lazy(() => import('./widgets/InventoryOrderedAnalysisWidget').then(mod => ({ default: mod.InventoryOrderedAnalysisWidget })));
const StillInAwaitPercentageWidget = React.lazy(() => import('./widgets/StillInAwaitPercentageWidget'));
const OrderStateListWidget = React.lazy(() => import('./widgets/OrderStateListWidgetV2').then(mod => ({ default: mod.OrderStateListWidgetV2 })));
const TransferTimeDistributionWidget = React.lazy(() => import('./widgets/TransferTimeDistributionWidget').then(mod => ({ default: mod.TransferTimeDistributionWidget })));
const WarehouseTransferListWidget = React.lazy(() => import('./widgets/WarehouseTransferListWidget').then(mod => ({ default: mod.WarehouseTransferListWidget })));
const WarehouseWorkLevelAreaChart = React.lazy(() => import('./widgets/WarehouseWorkLevelAreaChart').then(mod => ({ default: mod.WarehouseWorkLevelAreaChart })));

// GraphQL removed - all widgets migrated to Server Actions

// 組件 props 生成器 - 預先定義以減少重複計算
const getComponentPropsFactory = (config: AdminWidgetConfig, timeFrame: TimeFrame, theme: string) => {
  const propsMap: Record<string, any> = {
    // History 組件
    HistoryTree: {
      widget: {
        config: {
          ...config,
          size: (config as any).size || 'MEDIUM'
        }
      },
      isEditMode: false
    },
    // Analysis 組件
    AnalysisPagedWidget: { timeFrame, theme },
    AnalysisPagedWidgetV2: { timeFrame, theme },
    AnalysisExpandableCards: { timeFrame, theme },
    // Report 組件
    ReportGeneratorWidget: {
      title: config.title,
      reportType: config.reportType || '',
      description: config.description,
      apiEndpoint: config.apiEndpoint
    },
    ReportGeneratorWithDialogWidget: {
      title: config.title,
      reportType: config.reportType || '',
      description: config.description,
      apiEndpoint: config.apiEndpoint,
      dialogTitle: config.dialogTitle || '',
      dialogDescription: config.dialogDescription || '',
      selectLabel: config.selectLabel || '',
      dataTable: config.dataTable || '',
      referenceField: config.referenceField || ''
    },
    ReportGeneratorWithDialogWidgetV2: {
      title: config.title,
      reportType: config.reportType || '',
      description: config.description,
      apiEndpoint: config.apiEndpoint,
      dialogTitle: config.dialogTitle || config.title || '',
      dialogDescription: config.dialogDescription || config.description || `Generate ${config.title || 'Report'}`,
      selectLabel: config.selectLabel || 'Select Reference',
      dataTable: config.dataTable || '',
      referenceField: config.referenceField || ''
    },
    // Stock 組件
    StockDistributionChart: { widget: config as any, useGraphQL: config.useGraphQL },
    StockTypeSelector: { widget: config as any },
    StockLevelHistoryChart: { widget: config as any, timeFrame },
    InventoryOrderedAnalysisWidget: { widget: config as any },
    // Production 組件
    InjectionProductionStatsWidget: {
      widget: config,
      title: config.title,
      metric: config.metrics?.[0] as 'pallet_count' | 'quantity_sum',
      timeFrame,
      isEditMode: false
    }
  };

  // Upload widgets 共享配置
  const uploadWidgetConfig = {
    widget: {
      id: config.component,
      type: 'CUSTOM' as any,
      title: config.title,
      config: { size: 'MEDIUM' as any }
    },
    isEditMode: false
  };

  const uploadWidgets = [
    'OrdersListWidgetV2',
    'OtherFilesListWidget',
    'UploadFilesWidget',
    'UploadOrdersWidget',
    'UploadProductSpecWidget',
    'UploadPhotoWidget'
  ];

  uploadWidgets.forEach(widgetName => {
    propsMap[widgetName] = uploadWidgetConfig;
  });

  return propsMap;
};

// 虛擬化 Widget 包裝器 - 使用 React.memo 優化
const VirtualizedWidget = React.memo<{
  widgetId: string;
  children: React.ReactNode;
  gridArea: string;
  theme: string;
  isCustomTheme: boolean;
  className?: string;
  style?: React.CSSProperties;
  index?: number;
}>(({ widgetId, children, gridArea, theme, isCustomTheme, className, style, index = 0 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);  // 預設為可見
  const [hasBeenVisible, setHasBeenVisible] = useState(true);  // 預設為已經可見過
  
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    
    // 使用標準 Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const visible = entry.isIntersecting;
          setIsVisible(visible);
          if (visible && !hasBeenVisible) {
            setHasBeenVisible(true);
            // Widget 使用記錄已簡化
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0
      }
    );
    
    observer.observe(element);
    
    return () => {
      observer.unobserve(element);
    };
  }, [widgetId, hasBeenVisible]);
  
  // Widget placeholder
  const renderPlaceholder = () => (
    <div className="h-full w-full animate-pulse">
      <div className="h-full bg-slate-800/50 rounded-xl"></div>
    </div>
  );
  
  // For themes using nth-child CSS, don't set gridArea inline
  // All custom themes use nth-child CSS
  const finalStyle = isCustomTheme 
    ? style 
    : { ...style, gridArea };
  
  // Theme class mapping
  const THEME_CLASS_MAP = {
    injection: 'custom-theme-item',
    pipeline: 'custom-theme-item',
    warehouse: 'custom-theme-item',
    upload: 'upload-item',
    update: 'update-item',
    'stock-management': 'stock-management-item',
    system: 'system-item',
    analysis: 'analysis-item'
  } as const;
  
  // Add theme-specific class based on theme
  const themeClass = isCustomTheme && theme && theme in THEME_CLASS_MAP
    ? THEME_CLASS_MAP[theme as keyof typeof THEME_CLASS_MAP]
    : '';
  
  return (
    <div
      ref={containerRef}
      data-widget-id={widgetId}
      data-widget-index={index}
      className={cn(themeClass, className)}
      style={finalStyle}
    >
      {/* 只有在可見或曾經可見時才渲染真正的內容 */}
      {(isVisible || hasBeenVisible) ? children : renderPlaceholder()}
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定義比較函數 - 只比較會影響渲染的 props
  return (
    prevProps.widgetId === nextProps.widgetId &&
    prevProps.gridArea === nextProps.gridArea &&
    prevProps.theme === nextProps.theme &&
    prevProps.isCustomTheme === nextProps.isCustomTheme &&
    prevProps.className === nextProps.className &&
    prevProps.style === nextProps.style &&
    prevProps.children === nextProps.children &&
    prevProps.index === nextProps.index
  );
});

VirtualizedWidget.displayName = 'VirtualizedWidget';

// AdminWidgetRenderer - 使用 React.memo 優化以減少不必要的重新渲染
const AdminWidgetRendererComponent: React.FC<AdminWidgetRendererProps> = ({ 
  config, 
  theme,
  timeFrame,
  index = 0,
  delay = 0
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDelayed, setIsDelayed] = useState(delay > 0);
  const { refreshTrigger } = useAdminRefresh();
  
  // 處理延遲加載
  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => {
        setIsDelayed(false);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

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
              icon: <ClockIcon className="w-5 h-5" />
            });
            break;
          default:
            // 使用模擬數據
            const mockData = getMockData(config);
            setData(mockData);
        }
        
      } catch (err: any) {
        console.error(`[AdminWidgetRenderer] Error loading ${config.dataSource}:`, err);
        // Handle auth errors specifically
        if (err.name === 'AuthRetryableFetchError' || err.message?.includes('AuthRetryableFetchError')) {
          setError('Authentication error. Please refresh the page and login again.');
        } else {
          setError(err.message || 'Failed to load data');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, timeFrame, refreshTrigger]);

  // 載入 Pallet 數據 - 使用 useCallback 避免重複創建
  const loadPalletData = useCallback(async (supabase: any, timeFrame: TimeFrame) => {
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

      // 排序並取前10
      const chartData = Object.entries(productTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
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
  }, [config]);

  // 載入庫存數據 - 使用 useCallback 避免重複創建
  const loadInventoryData = useCallback(async (supabase: any, timeFrame: TimeFrame) => {
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
  }, []);

  // 載入轉移數據 - 使用 useCallback 避免重複創建
  const loadTransferData = useCallback(async (supabase: any, timeFrame: TimeFrame) => {
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
  }, []);

  // 載入庫存水平數據 - 使用 useCallback 避免重複創建
  const loadStockLevelData = useCallback(async (supabase: any) => {
    const { data: stockData } = await supabase
      .from('stock_level')
      .select('*')
      .order('stock_level', { ascending: false });

    const totalStock = stockData?.reduce((sum: number, item: any) => sum + (item.stock_level || 0), 0) || 0;

    setData({
      value: totalStock,
      label: 'Total Stock Level',
      chartData: stockData?.slice(0, 10).map((s: any) => ({
        name: s.stock || s.product_code || 'Unknown',
        value: s.stock_level || 0
      })),
      items: stockData?.slice(0, 5).map((s: any) => ({
        title: s.stock || s.product_code || 'Unknown',
        subtitle: `Stock Level`,
        value: (s.stock_level || 0).toLocaleString()
      }))
    });
  }, []);

  // 載入歷史數據 - 使用 useCallback 避免重複創建
  const loadHistoryData = useCallback(async (supabase: any, timeFrame: TimeFrame) => {
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
  }, []);

  // 載入生產摘要數據 - 使用 useCallback 避免重複創建
  const loadProductionSummary = useCallback(async (supabase: any, timeFrame: TimeFrame) => {
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
        (qty || 0).toLocaleString(),
        'Active',
        format(new Date(), 'HH:mm')
      ]);

    setData({ headers, rows });
  }, []); // Remove config.title dependency as it's not used in the function

  // 載入生產詳情數據
  const loadProductionDetails = useCallback(async (supabase: any, timeFrame: TimeFrame) => {
    const { data: productionData } = await supabase
      .from('record_palletinfo')
      .select('plt_num, product_code, product_qty, operator, generate_time')
      .gte('generate_time', timeFrame.start.toISOString())
      .lte('generate_time', timeFrame.end.toISOString())
      .order('generate_time', { ascending: false })
      .limit(20);

    const headers = ['Pallet', 'Product', 'Qty', 'Operator', 'Time'];
    const rows = productionData?.map((item: any) => [
      item.plt_num,
      item.product_code,
      item.product_qty?.toLocaleString() || '0',
      item.operator || 'Unknown',
      format(new Date(item.generate_time), 'HH:mm')
    ]) || [];

    setData({ headers, rows });
  }, []);

  // 載入工作量數據
  const loadWorkLevel = useCallback(async (supabase: any, timeFrame: TimeFrame) => {
    const { data: workData } = await supabase
      .from('record_palletinfo')
      .select('operator, generate_time')
      .gte('generate_time', timeFrame.start.toISOString())
      .lte('generate_time', timeFrame.end.toISOString());

    // 按小時統計工作量
    const hourlyData = generateHourlyData(workData || [], 'generate_time');

    setData({
      chartData: hourlyData
    });
  }, []);

  // 載入 Pipeline 生產詳情數據
  const loadPipelineProductionDetails = useCallback(async (supabase: any, timeFrame: TimeFrame) => {
    const { data: productionData } = await supabase
      .from('record_palletinfo')
      .select('plt_num, product_code, product_qty, operator, generate_time')
      .ilike('product_code', 'U%')  // Pipeline products start with U
      .gte('generate_time', timeFrame.start.toISOString())
      .lte('generate_time', timeFrame.end.toISOString())
      .order('generate_time', { ascending: false })
      .limit(20);

    const headers = ['Pallet', 'Product', 'Qty', 'Operator', 'Time'];
    const rows = productionData?.map((item: any) => [
      item.plt_num,
      item.product_code,
      item.product_qty?.toLocaleString() || '0',
      item.operator || 'Unknown',
      format(new Date(item.generate_time), 'HH:mm')
    ]) || [];

    setData({ headers, rows });
  }, []);

  // 載入 Pipeline 工作量數據
  const loadPipelineWorkLevel = useCallback(async (supabase: any, timeFrame: TimeFrame) => {
    const { data: workData } = await supabase
      .from('record_palletinfo')
      .select('operator, generate_time')
      .ilike('product_code', 'U%')  // Pipeline products start with U
      .gte('generate_time', timeFrame.start.toISOString())
      .lte('generate_time', timeFrame.end.toISOString());

    // 按小時統計工作量
    const hourlyData = generateHourlyData(workData || [], 'generate_time');

    setData({
      chartData: hourlyData
    });
  }, []);

  // 載入客戶訂單數據
  const loadCustomerOrderData = useCallback(async (supabase: any) => {
    const { data: orderData } = await supabase
      .from('data_order')
      .select('order_ref, account_num, created_at, product_code')
      .order('created_at', { ascending: false })
      .limit(10);

    const headers = ['Order', 'Account', 'Date', 'Product'];
    const rows = orderData?.map((item: any) => [
      item.order_ref,
      item.account_num,
      format(new Date(item.created_at), 'MM/dd'),
      item.product_code
    ]) || [];

    setData({ headers, rows });
  }, []);

  // 載入系統狀態數據
  const loadSystemStatus = useCallback(async (supabase: any) => {
    try {
      // 使用正確的資料表（已通過 MCP 工具確認）
      const { count: userCount, error: userError } = await supabase
        .from('data_id')
        .select('*', { count: 'exact', head: true });

      if (userError) {
        console.error('[loadSystemStatus] Error fetching user count:', userError);
        throw userError;
      }

      const { count: productCount, error: productError } = await supabase
        .from('data_code')
        .select('*', { count: 'exact', head: true });

      if (productError) {
        console.error('[loadSystemStatus] Error fetching product count:', productError);
        throw productError;
      }

      setData({
        value: userCount || 0,
        label: 'Active Users',
        secondaryValue: productCount || 0,
        secondaryLabel: 'Total Products',
        icon: <CheckCircleIcon className="w-8 h-8 text-green-500" />
      });
    } catch (error) {
      console.error('[loadSystemStatus] Failed:', error);
      throw error;
    }
  }, []);

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

  // 渲染統計卡片 - 使用 useCallback 優化
  const renderStatsCard = useCallback(() => {
    // 檢查是否為需要顯示 "Not available" 的三個小 widget
    const notAvailableWidgets = ['Processing', 'Completed Today', 'Failed'];
    if (notAvailableWidgets.includes(config.title)) {
      return (
        <div className="h-full flex flex-col items-center justify-center">
          <div className="text-gray-500 text-sm">Not available</div>
        </div>
      );
    }

    // 如果是生產統計類型，使用 Server Actions 組件
    if (config.dataSource === 'record_palletinfo' && 
        (config.metrics?.[0] === 'pallet_count' || config.metrics?.[0] === 'quantity_sum')) {
      return (
        <Suspense fallback={
          <div className="animate-pulse">
            <div className="h-12 w-12 bg-slate-700/50 rounded-xl mb-4"></div>
            <div className="h-8 w-24 bg-slate-700/50 rounded mb-2"></div>
            <div className="h-4 w-32 bg-slate-700/50 rounded"></div>
          </div>
        }>
          <ProductionStatsWidget
            widget={{
              id: `production-stats-${config.gridArea}`,
              type: config.type as any,
              title: config.title,
              config: {
                dataSource: config.dataSource,
                metrics: config.metrics
              }
            }}
            title={config.title}
            metric={config.metrics[0] as 'pallet_count' | 'quantity_sum'}
            timeFrame={timeFrame}
            isEditMode={false}
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
        {/* Header with unified icon design */}
        <CardHeader className="pb-2">
          <CardTitle className="widget-title flex items-center gap-2">
            {icon && React.cloneElement(icon, { className: "w-5 h-5" })}
            {label}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            {/* Value */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-4xl font-bold text-white mb-2"
            >
              {(value !== undefined && value !== null) ? value.toLocaleString() : '0'}
            </motion.div>
            
            {/* Trend with Animation */}
            {trend !== undefined && (
              <div className={cn(
                "flex items-center gap-1 text-sm justify-center",
                trend > 0 ? "text-green-400" : "text-red-400"
              )}>
                {trend > 0 ? 
                  <ArrowTrendingUpIcon className="w-4 h-4" /> :
                  <ArrowTrendingDownIcon className="w-4 h-4" />
                }
                <span>{trend > 0 ? '+' : ''}{trend.toFixed(1)}%</span>
              </div>
            )}
          </div>
        </CardContent>
      </div>
    );
  }, [config, data, loading, timeFrame]);

  // 渲染圖表 - 使用 useCallback 優化
  const renderChart = useCallback(() => {
    // Production monitoring widgets - Server Actions versions
    // Top 10 Products by Quantity
    if (config.title === 'Top 10 Products by Quantity' && config.chartType === 'bar') {
      return (
        <Suspense fallback={
          <div className="animate-pulse h-full bg-slate-700 rounded"></div>
        }>
          <TopProductsChartWidget
            widget={{
              id: `top-products-${config.gridArea}`,
              type: config.type as any,
              title: config.title,
              config: {
                dataSource: config.dataSource,
                chartType: config.chartType
              }
            }}
            title={config.title}
            timeFrame={timeFrame}
            isEditMode={false}
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
          <ProductDistributionChartWidget
            widget={{
              id: `product-distribution-${config.gridArea}`,
              type: config.type as any,
              title: config.title,
              config: {
                dataSource: config.dataSource,
                chartType: config.chartType
              }
            }}
            title={config.title}
            timeFrame={timeFrame}
            isEditMode={false}
            limit={10}
          />
        </Suspense>
      );
    }
    
    // Staff Workload - 使用 Server Actions 版本
    if (config.title === 'Staff Workload' && config.chartType === 'line') {
      return (
        <Suspense fallback={
          <div className="animate-pulse h-full bg-slate-700 rounded"></div>
        }>
          <StaffWorkloadWidget
            title={config.title}
            timeFrame={timeFrame}
            isEditMode={false}
            department="Injection"
            useGraphQL={config.useGraphQL}
            widget={{
              id: `staff-workload-${config.gridArea}`,
              type: config.type as any,
              title: config.title,
              config: {
                dataSource: config.dataSource,
                chartType: config.chartType
              }
            }}
          />
        </Suspense>
      );
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
        // 計算最大值以設定 Y 軸範圍
        let maxValue = 0;
        chartData.forEach((dataPoint: any) => {
          data.userNames.forEach((userName: string) => {
            if (dataPoint[userName] > maxValue) {
              maxValue = dataPoint[userName];
            }
          });
        });
        
        // 增加 20% 的空間避免穿圖
        const yAxisMax = Math.ceil(maxValue * 1.2);
        
        ChartComponent = (
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8" 
              fontSize={10}
              angle={-45}
              textAnchor="end"
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={11}
              domain={[0, yAxisMax || 'auto']}
              ticks={Array.from({length: 6}, (_, i) => Math.round(yAxisMax * i / 5))}
            />
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
                type="natural" 
                dataKey={userName} 
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth={2}
                dot={false}
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
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} angle={-45} textAnchor="end" />
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
              `${(value || 0).toLocaleString()} (${props.payload.percentage || 0}%)`,
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
        <ResponsiveContainer 
          width="100%" 
          height={
            config.chartType === 'line' && data?.userNames ? "100%" : 
            (data?.legendData || (config.chartType === 'donut' && chartData.length > 0) ? "85%" : "100%")
          }
        >
          {ChartComponent}
        </ResponsiveContainer>
        
        {/* Legend for workload chart - 移除此部分 */}
        {data?.legendData && data.legendData.length > 0 && config.title !== 'Staff Workload' && (
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
              <div key={`${item.name}-${index}`} className="flex items-center gap-1">
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
  }, [config, data, loading, timeFrame]);

  // 渲染列表 - 使用 useCallback 優化
  const renderList = useCallback(() => {
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
  }, [data, loading]);

  // 渲染表格 - 使用 useCallback 優化
  const renderTable = useCallback(() => {
    // 如果是 Production Details，使用 Server Actions 組件
    if (config.title === 'Production Details') {
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
          <ProductionDetailsWidget
            title={config.title}
            timeFrame={timeFrame}
            isEditMode={false}
            useGraphQL={config.useGraphQL}
            widget={{
              id: `production-details-${config.gridArea}`,
              type: config.type as any,
              title: config.title,
              config: {
                dataSource: config.dataSource
              }
            }}
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
  }, [config, data, loading, timeFrame]);

  // 渲染特殊組件 - 使用 useCallback 優化
  const renderSpecialComponent = useCallback(() => {
    const componentName = config.component || '';
    
    // 優先從增強的 widget registry 獲取組件
    const EnhancedComponent = getEnhancedWidgetComponent(componentName, false);
    if (EnhancedComponent) {
      // 使用預先定義的 props 查找對象
      const propsMap = getComponentPropsFactory(config, timeFrame, theme);
      const componentProps = propsMap[componentName] || { widget: config, isEditMode: false };
      
      return (
        <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-800/50" />}>
          <EnhancedComponent {...componentProps} />
        </Suspense>
      );
    }
    
    // 回退到 LazyComponents
    const LazyComponent = LazyComponents[componentName];
    if (LazyComponent) {
      // 使用預先定義的 props 查找對象
      const propsMap = getComponentPropsFactory(config, timeFrame, theme);
      const componentProps = propsMap[componentName] || { widget: config, isEditMode: false };
      
      return <LazyComponent {...componentProps} />;
    }
    
    // 原有的 switch 處理（只保留非懶加載組件）
    switch (config.component) {
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
      case 'ProductUpdateWidget':
        const ProductUpdateWidget = LazyComponents['ProductUpdateWidget'];
        if (ProductUpdateWidget) {
          return (
            <ProductUpdateWidget 
              widget={{
                id: 'product-update',
                type: 'CUSTOM' as any,
                title: config.title,
                config: { size: 'MEDIUM' as any }
              }}
              isEditMode={false}
            />
          );
        }
        return null;
      case 'SupplierUpdateWidget':
        const SupplierUpdateWidget = LazyComponents['SupplierUpdateWidget'];
        if (SupplierUpdateWidget) {
          return (
            <SupplierUpdateWidget 
              widget={{
                id: 'supplier-update',
                type: 'CUSTOM' as any,
                title: config.title,
                config: { size: 'MEDIUM' as any }
              }}
              isEditMode={false}
            />
          );
        }
        return null;
      case 'VoidPalletWidget':
        const VoidPalletWidget = LazyComponents['VoidPalletWidget'];
        if (VoidPalletWidget) {
          return (
            <VoidPalletWidget 
              widget={{
                id: 'void-pallet',
                type: 'VOID_PALLET' as any,
                title: config.title,
                config: { size: 'MEDIUM' as any }
              }}
              isEditMode={false}
            />
          );
        }
        return null;
      // ReportGeneratorWidget 和 ReportGeneratorWithDialogWidget 已經在 LazyComponents 中處理
      case 'AvailableSoonWidget':
        return (
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-800/50" />}>
            <AvailableSoonWidget widget={{
              id: `available-soon-${config.gridArea}`,
              type: config.type as any,
              title: config.title,
              config: {
                dataSource: config.dataSource
              }
            }} isEditMode={false} />
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
      // Upload page widgets - all handled by LazyComponents now
      // Warehouse Dashboard Widgets
      case 'AwaitLocationQtyWidget':
        return (
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-800/50" />}>
            <AwaitLocationQtyWidget widget={{ 
              id: 'await-location-qty',
              type: 'CUSTOM' as any,
              title: 'Await Location Qty',
              config: { size: 'MEDIUM' as any }
            }} isEditMode={false} timeFrame={timeFrame} />
          </Suspense>
        );
      case 'YesterdayTransferCountWidget':
        return (
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-800/50" />}>
            <YesterdayTransferCountWidget widget={{ 
              id: 'yesterday-transfer-count',
              type: 'CUSTOM' as any,
              title: 'Transfer Done',
              config: { size: 'MEDIUM' as any }
            }} isEditMode={false} timeFrame={timeFrame} />
          </Suspense>
        );
      case 'StillInAwaitWidget':
        return (
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-800/50" />}>
            <StillInAwaitWidget widget={{ 
              id: 'still-in-await',
              type: 'CUSTOM' as any,
              title: 'Still In Await',
              config: { size: 'MEDIUM' as any }
            }} isEditMode={false} timeFrame={timeFrame} />
          </Suspense>
        );
      case 'StillInAwaitPercentageWidget':
        return (
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-800/50" />}>
            <StillInAwaitPercentageWidget widget={{ 
              id: 'still-in-await-percentage',
              type: 'CUSTOM' as any,
              title: 'Still In Await %',
              config: { size: 'MEDIUM' as any }
            }} isEditMode={false} timeFrame={timeFrame} />
          </Suspense>
        );
      case 'OrderStateListWidget':
        return (
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-800/50" />}>
            <OrderStateListWidget widget={{ 
              id: 'order-state-list',
              type: 'CUSTOM' as any,
              title: 'Order Progress',
              config: { size: 'MEDIUM' as any }
            }} isEditMode={false} timeFrame={timeFrame} />
          </Suspense>
        );
      case 'TransferTimeDistributionWidget':
        return (
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-800/50" />}>
            <TransferTimeDistributionWidget widget={{ 
              id: 'transfer-time-distribution',
              type: 'CUSTOM' as any,
              title: 'Transfer Time Distribution',
              config: { size: 'MEDIUM' as any }
            }} isEditMode={false} timeFrame={timeFrame} />
          </Suspense>
        );
      case 'WarehouseTransferListWidget':
        return (
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-800/50" />}>
            <WarehouseTransferListWidget widget={{ 
              id: 'warehouse-transfer-list',
              type: 'CUSTOM' as any,
              title: 'Transfer List',
              config: { size: 'LARGE' as any }
            }} isEditMode={false} timeFrame={timeFrame} />
          </Suspense>
        );
      case 'WarehouseWorkLevelAreaChart':
        return (
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-800/50" />}>
            <WarehouseWorkLevelAreaChart widget={{ 
              id: 'warehouse-work-level',
              type: 'CUSTOM' as any,
              title: 'Work Level',
              config: { size: 'LARGE' as any }
            }} isEditMode={false} timeFrame={timeFrame} />
          </Suspense>
        );
      case 'StockTypeSelector':
        return (
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-800/50" />}>
            <StockTypeSelector 
              widget={{
                id: 'stock-type-selector',
                type: config.type as any,
                title: config.title || 'Stock Type Selector',
                config: {
                  dataSource: 'stock_level'
                }
              }}
              isEditMode={false}
              useGraphQL={config.useGraphQL}
            />
          </Suspense>
        );
      case 'StockDistributionChart':
      case 'StockDistributionChartV2':
        return (
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-800/50" />}>
            <StockDistributionChart widget={config as any} useGraphQL={config.useGraphQL} />
          </Suspense>
        );
      case 'StockLevelHistoryChart':
        return (
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-800/50" />}>
            <StockLevelHistoryChart widget={{
              id: `stock-level-history-${config.gridArea}`,
              type: config.type as any,
              title: config.title,
              config: {
                dataSource: config.dataSource
              }
            }} timeFrame={timeFrame} />
          </Suspense>
        );
      case 'InventoryOrderedAnalysisWidget':
        return (
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-800/50" />}>
            <InventoryOrderedAnalysisWidget widget={config as any} isEditMode={false} />
          </Suspense>
        );
      default:
        return <div>Component {config.component} not found</div>;
    }
  }, [config, timeFrame, theme, loading]);

  // 根據 widget 類型渲染內容 - 使用 useCallback 優化
  const renderContent = useCallback(() => {
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
              dialogTitle={config.dialogTitle || config.title}
              dialogDescription={config.dialogDescription || config.description || 'Generate report'}
              selectLabel={config.selectLabel || 'Select option'}
              dataTable={config.dataTable || ''}
              referenceField={config.referenceField || ''}
            />
          </Suspense>
        );
      case 'transaction-report':
        return (
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-800/50" />}>
            <TransactionReportWidget 
              title={config.title}
              reportType={config.reportType || ''}
              description={config.description}
              apiEndpoint={config.apiEndpoint}
            />
          </Suspense>
        );
      case 'grn-report':
        return (
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-800/50" />}>
            <GrnReportWidget 
              title={config.title}
              reportType={config.reportType || ''}
              description={config.description}
              apiEndpoint={config.apiEndpoint}
            />
          </Suspense>
        );
      case 'aco-order-report':
        return (
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-800/50" />}>
            <AcoOrderReportWidget widget={{
              id: `aco-order-report-${config.gridArea}`,
              type: config.type as any,
              title: config.title,
              config: {
                dataSource: config.dataSource
              }
            }} isEditMode={false} />
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
            <AvailableSoonWidget widget={{
              id: `available-soon-${config.gridArea}`,
              type: config.type as any,
              title: config.title,
              config: {
                dataSource: config.dataSource
              }
            }} isEditMode={false} />
          </Suspense>
        );
      case 'orders-list':
        return renderSpecialComponent();
      case 'other-files-list':
        return renderSpecialComponent();
      default:
        return (
          <div className="text-center text-gray-400">
            <p>Widget type &quot;{config.type}&quot; not implemented</p>
          </div>
        );
    }
  }, [config, renderStatsCard, renderChart, renderList, renderTable, renderSpecialComponent]);

  // Check if this is a custom theme
  const isCustomTheme = theme === 'injection' || theme === 'pipeline' || theme === 'warehouse' || theme === 'upload' || theme === 'update' || theme === 'stock-management' || theme === 'system';
  
  // Special components that need minimal wrapper (like HistoryTree)
  const minimalWrapperComponents = ['HistoryTree'];
  
  // Components that need their own padding
  const paddedComponents = ['UploadFilesWidget', 'UploadOrdersWidget', 'UploadProductSpecWidget', 'UploadPhotoWidget'];
  
  // Determine wrapper class
  let wrapperClass = '';
  if (!isCustomTheme) {
    wrapperClass = 'p-4';
  } else if (config.component && paddedComponents.includes(config.component)) {
    wrapperClass = 'p-6';
  }
  
  // Special handling for components that need transparent background
  const transparentComponents = ['HistoryTree'];
  const isTransparent = config.component && transparentComponents.includes(config.component);
  
  // Generate unique widget ID
  const widgetId = `${config.type}-${config.title.replace(/\s+/g, '-')}-${index}`;
  
  // Use unified wrapper for ALL widgets with virtualization
  // Re-enable VirtualizedWidget with data-widget-index support
  const shouldUseVirtualization = true; // Enable virtualization
  
  if (shouldUseVirtualization) {
    // 如果仍在延遲中，顯示佔位符
    if (isDelayed) {
      return (
        <div
          style={{ gridArea: config.gridArea }}
          className="h-full w-full rounded-2xl bg-slate-800/30 animate-pulse"
        />
      );
    }
    
    return (
      <VirtualizedWidget
        widgetId={widgetId}
        gridArea={config.gridArea}
        theme={theme}
        isCustomTheme={isCustomTheme}
        index={index}
      >
        <UnifiedWidgetWrapper 
          isCustomTheme={isCustomTheme}
          hasError={!!error}
          theme={theme}
          className={cn(
            wrapperClass,
            isTransparent && '!bg-transparent !backdrop-blur-0' // Override background for transparent widgets, keep border
          )}
        >
          {error ? `Error: ${error}` : renderContent()}
        </UnifiedWidgetWrapper>
      </VirtualizedWidget>
    );
  }
  
  // Direct rendering without VirtualizedWidget
  // Use the same theme class mapping
  const THEME_CLASS_MAP = {
    injection: 'custom-theme-item',
    pipeline: 'custom-theme-item',
    warehouse: 'custom-theme-item',
    upload: 'upload-item',
    update: 'update-item',
    'stock-management': 'stock-management-item',
    system: 'system-item',
    analysis: 'analysis-item'
  } as const;
  
  const themeClass = isCustomTheme && theme && theme in THEME_CLASS_MAP
    ? THEME_CLASS_MAP[theme as keyof typeof THEME_CLASS_MAP]
    : '';
  
  return (
    <div
      data-widget-index={index}
      className={themeClass}
      style={isCustomTheme ? undefined : { gridArea: config.gridArea }}
    >
      <UnifiedWidgetWrapper 
        isCustomTheme={isCustomTheme}
        hasError={!!error}
        theme={theme}
        className={cn(
          wrapperClass,
          isTransparent && '!bg-transparent !backdrop-blur-0'
        )}
      >
        {error ? `Error: ${error}` : renderContent()}
      </UnifiedWidgetWrapper>
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
        icon: <CubeIcon className="w-5 h-5" />
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


  return (
    <div className="h-full">
      <div className="h-full overflow-y-auto">
        {/* Search Section */}
        {!showForm && (
          <div className="relative group mb-6 p-6">
            <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
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
                        className="flex-1 bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder-slate-400 focus:border-orange-500/70 focus:bg-slate-700/70 hover:border-orange-500/50 hover:bg-slate-700/60 transition-all duration-300"
                        disabled={isLoading || showCreateDialog}
                      />
                      <Button
                        onClick={() => {
                          const input = document.getElementById('search') as HTMLInputElement;
                          if (input) handleSearch(input.value);
                        }}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:from-slate-600 disabled:to-slate-600 text-white px-6 transition-all duration-300"
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
            <div className="relative bg-slate-800/40 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6">
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
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white transition-all duration-300"
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
              <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium bg-gradient-to-r from-orange-300 to-amber-300 bg-clip-text text-transparent">
                      Product Information
                    </h4>
                    <Button
                      onClick={handleEdit}
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white transition-all duration-300"
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
              <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
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


  return (
    <div className="h-full">
      <div className="h-full overflow-y-auto">
        {/* Search Section */}
        {!showForm && (
          <div className="relative group mb-6 p-6">
            <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
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
                        className="flex-1 bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder-slate-400 focus:border-blue-500/70 focus:bg-slate-700/70 hover:border-blue-500/50 hover:bg-slate-700/60 transition-all duration-300"
                        disabled={isLoading || showCreateDialog}
                      />
                      <Button
                        onClick={() => {
                          const input = document.getElementById('search') as HTMLInputElement;
                          if (input) handleSearch(input.value);
                        }}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 text-white px-6 transition-all duration-300"
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
            <div className="relative bg-slate-800/40 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6">
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
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white transition-all duration-300"
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
              <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                      Supplier Information
                    </h4>
                    <Button
                      onClick={handleEdit}
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white transition-all duration-300"
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
              <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
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
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 text-white transition-all duration-300"
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

// Export AdminWidgetRenderer with React.memo
export const AdminWidgetRenderer = React.memo(AdminWidgetRendererComponent, (prevProps, nextProps) => {
  // 自定義比較函數 - 只比較會影響渲染的 props
  return (
    prevProps.config === nextProps.config &&
    prevProps.theme === nextProps.theme &&
    prevProps.timeFrame === nextProps.timeFrame &&
    prevProps.index === nextProps.index
  );
});

AdminWidgetRenderer.displayName = "AdminWidgetRenderer";
