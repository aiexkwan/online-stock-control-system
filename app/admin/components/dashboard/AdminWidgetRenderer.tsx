/**
 * Admin Widget Renderer - 簡化版本  
 * 使用專門的子渲染器處理不同類型的 Widget
 */

'use client';

import React, { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AdminWidgetConfig } from './adminDashboardLayouts';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';
import { createClient } from '@/lib/supabase';
import { useAdminRefresh } from '@/app/admin/contexts/AdminRefreshContext';
import { unifiedWidgetRegistry } from '@/lib/widgets/unified-registry';
import { 
  getWidgetCategory,
  getThemeGlowColor,
  createErrorFallback 
} from './widget-renderer-shared';
import { ChartWidgetRenderer } from './ChartWidgetRenderer';
import { StatsWidgetRenderer } from './StatsWidgetRenderer';
import { ListWidgetRenderer } from './ListWidgetRenderer';
import { WidgetSuspenseFallback } from './widgets/common/WidgetStates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  getProductByCode, 
  createProduct, 
  updateProduct,
  ProductData 
} from '@/app/actions/productActions';
import { cn } from '@/lib/utils';
import { 
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

interface AdminWidgetRendererProps {
  config: AdminWidgetConfig;
  theme: string;
  timeFrame: TimeFrame;
  index?: number;
  delay?: number;
}

// 統一的 Suspense Fallback 生成器
const createSuspenseFallback = (type: 'default' | 'stats' | 'chart' | 'table' | 'list' = 'default') => {
  return <WidgetSuspenseFallback type={type} />;
};

// 統一的 Widget Wrapper Component
const UnifiedWidgetWrapper = React.memo<{
  children: React.ReactNode;
  theme: string;
  title?: string;
  isEditMode?: boolean;
  onUpdate?: () => void;
  onRemove?: () => void;
}>(({ children, theme, title, isEditMode, onUpdate, onRemove }) => {
  const glowColor = getThemeGlowColor(theme);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative h-full w-full rounded-lg border bg-card text-card-foreground shadow-sm",
        `glow-${glowColor}`
      )}
    >
      {title && (
        <div className="flex items-center justify-between p-4 pb-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          {isEditMode && (
            <div className="flex space-x-2">
              {onUpdate && (
                <Button size="sm" variant="outline" onClick={onUpdate}>
                  <PencilIcon className="h-4 w-4" />
                </Button>
              )}
              {onRemove && (
                <Button size="sm" variant="destructive" onClick={onRemove}>
                  ×
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </motion.div>
  );
});

UnifiedWidgetWrapper.displayName = 'UnifiedWidgetWrapper';

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
  
  // Helper function to render lazy component from unifiedWidgetRegistry
  const renderLazyComponent = useCallback((componentName: string, props: any) => {
    const Component = unifiedWidgetRegistry.getWidgetComponent(componentName);
    if (!Component) {
      console.error(`Component ${componentName} not found in unifiedWidgetRegistry.getWidgetComponent`);
      return <div>Component {componentName} not found</div>;
    }
    return <Component {...props} />;
  }, []);

  // 處理延遲加載
  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => {
        setIsDelayed(false);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  // 穩定 config 的關鍵屬性以避免無限循環
  const stableConfigKey = useMemo(() => {
    return `${config.dataSource}-${config.title}-${config.type}-${JSON.stringify(config.metrics)}`;
  }, [config.dataSource, config.title, config.type, config.metrics]);

  // 根據數據源載入數據
  useEffect(() => {
    if (isDelayed) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const supabase = createClient();
        
        // 根據不同的數據源載入真實數據
        switch (config.dataSource) {
          case 'record_palletinfo':
          case 'record_inventory':
          case 'record_transfer':
          case 'stock_level':
          case 'record_history':
          case 'production_summary':
          case 'production_details':
          case 'work_level':
          case 'pipeline_production_details':
          case 'pipeline_work_level':
          case 'data_customerorder':
          case 'system_status':
          case 'coming_soon':
            // Data loading logic removed - loadWidgetData method not available
            // TODO: Implement proper data loading for these widget types
            setData(null);
            break;
            
          default:
            // 默認的假數據
            setData(null);
        }
      } catch (err) {
        console.error('Data loading error:', err);
        setError(err instanceof Error ? (err as { message: string }).message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [config.dataSource, stableConfigKey, timeFrame, refreshTrigger, isDelayed]);

  // 如果還在延遲階段，顯示加載狀態
  if (isDelayed) {
    return (
      <UnifiedWidgetWrapper theme={theme} title={config.title}>
        <div className="flex items-center justify-center h-32">
          <ArrowPathIcon className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </UnifiedWidgetWrapper>
    );
  }

  // 根據 widget 類型選擇對應的渲染器
  const widgetCategory = getWidgetCategory(config.type);
  
  const baseProps = {
    config,
    theme,
    timeFrame,
    data,
    loading,
    error,
    renderLazyComponent
  };

  let renderedContent: JSX.Element;

  try {
    switch (widgetCategory) {
      case 'chart':
        renderedContent = <ChartWidgetRenderer {...baseProps} />;
        break;
        
      case 'stats':
        renderedContent = <StatsWidgetRenderer {...baseProps} />;
        break;
        
      case 'list':
        renderedContent = <ListWidgetRenderer {...baseProps} />;
        break;
        
      case 'core':
      default:
        // 處理核心 widgets (上傳、產品更新等)
        renderedContent = renderCoreWidget(config, theme, timeFrame, data, loading, error, renderLazyComponent);
        break;
    }
  } catch (err) {
    console.error('Widget rendering error:', err);
    renderedContent = createErrorFallback(config.type, err instanceof Error ? (err as { message: string }).message : 'Unknown error');
  }

  return (
    <UnifiedWidgetWrapper theme={theme} title={config.title}>
      <Suspense fallback={createSuspenseFallback(widgetCategory as 'default' | 'stats' | 'chart' | 'table' | 'list')}>
        {renderedContent}
      </Suspense>
    </UnifiedWidgetWrapper>
  );
};

// 核心 Widget 渲染函數
function renderCoreWidget(
  config: AdminWidgetConfig,
  theme: string,
  timeFrame: TimeFrame,
  data: any,
  loading: boolean,
  error: string | null,
  renderLazyComponent: (componentName: string, props: any) => JSX.Element
): JSX.Element {
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (error) {
    return createErrorFallback(config.type, error);
  }

  const getComponentProps = (data?: any) => ({
    config,
    timeFrame,
    theme,
    data
  });

  switch (config.type) {
    case 'UploadZone':
      return renderLazyComponent('UploadZone', getComponentProps(data));
      
    case 'ProductUpdateWidget':
    case 'ProductUpdateWidgetV2':
      return <ProductUpdateWidget config={config} timeFrame={timeFrame} theme={theme} />;
      
    case 'SupplierUpdateWidget':
      return <SupplierUpdateWidget config={config} timeFrame={timeFrame} theme={theme} />;
      
    case 'VoidPalletWidget':
      return renderLazyComponent('VoidPalletWidget', getComponentProps(data));
      
    case 'AvailableSoonWidget':
      return renderLazyComponent('AvailableSoonWidget', getComponentProps(data));
      
    case 'alerts':
      return <AlertsWidget data={data} />;
      
    case 'preview':
      return <PreviewWidget config={config} />;
      
    case 'report-generator':
      return <ReportGeneratorWidget config={config} timeFrame={timeFrame} />;
      
    case 'coming_soon':
    case 'available-soon':
      return (
        <div className="flex items-center justify-center h-32">
          <div className="text-center text-gray-500">
            <BuildingOfficeIcon className="h-12 w-12 mx-auto mb-2" />
            <p className="text-sm">功能即將推出</p>
          </div>
        </div>
      );
      
    default:
      return createErrorFallback(`Unknown core widget type: ${config.type}`);
  }
}

// 簡化的產品更新 Widget
const ProductUpdateWidget: React.FC<{
  config: AdminWidgetConfig;
  timeFrame: TimeFrame;
  theme: string;
}> = ({ config, timeFrame, theme }) => {
  const [productCode, setProductCode] = useState('');
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!productCode.trim()) return;
    
    setLoading(true);
    try {
      const result = await getProductByCode(productCode);
      setProductData(result as unknown as ProductData);
    } catch (error) {
      console.error('Product search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Input
          placeholder="輸入產品代碼"
          value={productCode}
          onChange={(e) => setProductCode(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={loading}>
          <MagnifyingGlassIcon className="h-4 w-4" />
        </Button>
      </div>
      
      {productData && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium">{productData.code}</h4>
          <p className="text-sm text-gray-600">{productData.description}</p>
        </div>
      )}
    </div>
  );
};

// 簡化的供應商更新 Widget
const SupplierUpdateWidget: React.FC<{
  config: AdminWidgetConfig;
  timeFrame: TimeFrame;
  theme: string;
}> = ({ config, timeFrame, theme }) => {
  return (
    <div className="text-center text-gray-500">
      <p>供應商更新功能</p>
    </div>
  );
};

// 簡化的警報 Widget
const AlertsWidget: React.FC<{ data: any }> = ({ data }) => {
  const alerts = data || [];
  
  return (
    <div className="space-y-2">
      {alerts.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          暫無警報
        </div>
      ) : (
        alerts.map((alert: any, index: number) => (
          <div key={index} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
            {(alert as { message: string }).message || `警報 ${index + 1}`}
          </div>
        ))
      )}
    </div>
  );
};

// 簡化的預覽 Widget
const PreviewWidget: React.FC<{ config: AdminWidgetConfig }> = ({ config }) => {
  return (
    <div className="text-center text-gray-500">
      <p>預覽功能</p>
    </div>
  );
};

// 簡化的報告生成器 Widget
const ReportGeneratorWidget: React.FC<{
  config: AdminWidgetConfig;
  timeFrame: TimeFrame;
}> = ({ config, timeFrame }) => {
  return (
    <div className="text-center text-gray-500">
      <p>報告生成器</p>
    </div>
  );
};

// Export AdminWidgetRenderer with React.memo
export const AdminWidgetRenderer = React.memo(AdminWidgetRendererComponent, (prevProps, nextProps) => {
  // 自定義比較函數
  return (
    JSON.stringify(prevProps.config) === JSON.stringify(nextProps.config) &&
    prevProps.theme === nextProps.theme &&
    JSON.stringify(prevProps.timeFrame) === JSON.stringify(nextProps.timeFrame) &&
    prevProps.index === nextProps.index &&
    prevProps.delay === nextProps.delay
  );
});

AdminWidgetRenderer.displayName = "AdminWidgetRenderer";