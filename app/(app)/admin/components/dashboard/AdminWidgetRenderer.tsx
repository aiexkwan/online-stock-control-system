/**
 * Admin Widget Renderer - 簡化版本
 * 使用專門的子渲染器處理不同類型的 Widget
 */

'use client';

import React, { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { DatabaseRecord } from '@/types/database/tables';
import { Database } from '@/types/database/supabase';
import { motion } from 'framer-motion';
import { AdminWidgetConfig } from '@/types/components/dashboard';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';
import { createClient } from '@/lib/supabase';
import { useAdminRefresh } from '@/app/(app)/admin/contexts/AdminRefreshContext';
import { unifiedWidgetRegistry } from '@/lib/widgets/unified-registry';
// 直接靜態導入 HistoryTreeV2 避免 originalFactory.call 錯誤
import HistoryTreeV2 from './widgets/HistoryTreeV2';
import { requestDeduplicator } from '@/lib/utils/request-deduplicator';
import { StatsCard } from './cards/StatsCard';
import { ChartCard } from './cards/ChartCard';
import { TableCard } from './cards/TableCard';
import { AnalysisCard } from './cards/AnalysisCard';
import { ListCard } from './cards/ListCard';
import { FormCard, FormType as FormCardType } from './cards/FormCard';
import { ListType, AnalysisType } from '@/types/generated/graphql';
import { DepartmentSelectorCard } from './cards/DepartmentSelectorCard';
import { HistoryTreeCard } from './cards/HistoryTreeCard';
import { 
  isStatsWidget, 
  convertWidgetConfigToStatsCard,
  STATS_MIGRATION_FLAGS 
} from '@/lib/widgets/stats-migration-config';
import {
  getWidgetCategory,
  getThemeGlowColor,
  createErrorFallback,
  WidgetData,
  WidgetComponentProps,
} from './widget-renderer-shared';
import { ChartWidgetRenderer } from './ChartWidgetRenderer';
import { StatsWidgetRenderer } from './StatsWidgetRenderer';
import { ListWidgetRenderer } from './ListWidgetRenderer';
import { WidgetSuspenseFallback } from './widgets/common/WidgetStates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AlertData {
  message: string;
  type?: 'info' | 'warning' | 'error';
  timestamp?: string;
}

type LocalWidgetData = DatabaseRecord[] | null;
import { cn } from '@/lib/utils';
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { GlassmorphicCard } from '@/app/components/visual-system/effects/GlassmorphicCard';

interface AdminWidgetRendererProps {
  config: AdminWidgetConfig;
  theme: string;
  timeFrame: TimeFrame;
  index?: number;
  delay?: number;
}

// 統一的 Suspense Fallback 生成器
const createSuspenseFallback = (
  type: 'default' | 'stats' | 'chart' | 'table' | 'list' = 'default'
) => {
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
  gridArea?: string; // 新增 gridArea 支援
  style?: React.CSSProperties;
}>(({ children, theme, title, isEditMode, onUpdate, onRemove, gridArea, style }) => {
  const glowColor = getThemeGlowColor(theme);

  return (
    <GlassmorphicCard
      variant="default"
      hover={true}
      borderGlow={false}
      padding="none"
      className={cn(
        'h-full w-full',
        `glow-${glowColor}`,
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
      )}
      style={{
        ...style,
        gridArea: gridArea, // 應用 gridArea 樣式
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="h-full w-full"
        data-widget-focusable='true'
        tabIndex={-1}
        role='region'
        aria-label={title || 'Dashboard widget'}
      >
        {title && (
          <div className='flex items-center justify-between p-4 pb-2'>
            <h3 className='text-lg font-semibold'>{title}</h3>
            {isEditMode && (
              <div className='flex space-x-2'>
                {onUpdate && (
                  <Button size='sm' variant='outline' onClick={onUpdate}>
                    <PencilIcon className='h-4 w-4' />
                  </Button>
                )}
                {onRemove && (
                  <Button size='sm' variant='destructive' onClick={onRemove}>
                    ×
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
        <div className='p-4'>{children}</div>
      </motion.div>
    </GlassmorphicCard>
  );
});

UnifiedWidgetWrapper.displayName = 'UnifiedWidgetWrapper';

const AdminWidgetRendererComponent: React.FC<AdminWidgetRendererProps> = ({
  config,
  theme,
  timeFrame,
  index = 0,
  delay = 0,
}) => {
  const [data, setData] = useState<LocalWidgetData>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 移除 isDelayed state - 不再使用延遲加載
  const { refreshTrigger } = useAdminRefresh();

  // Helper function to render lazy component from unifiedWidgetRegistry
  const renderLazyComponent = useCallback((componentName: string, props: WidgetComponentProps) => {
    try {
      console.log(`[renderLazyComponent] Attempting to render component: ${componentName}`);

      // 特殊處理 HistoryTreeV2 - 使用靜態導入版本
      if (componentName === 'HistoryTreeV2') {
        console.log(`[renderLazyComponent] Using static import for HistoryTreeV2`);
        return <HistoryTreeV2 {...props} />;
      }

      const Component = unifiedWidgetRegistry.getWidgetComponent(componentName);
      if (!Component) {
        console.error(
          `[renderLazyComponent] Component ${componentName} not found in unifiedWidgetRegistry.getWidgetComponent`
        );
        return <div>Component {componentName} not found</div>;
      }

      console.log(`[renderLazyComponent] Component ${componentName} found, creating element`);

      // Convert props to support unified registry's expected interface
      const unifiedProps = {
        ...props,
        widgetId: componentName, // Add required widgetId for BatchQueryWidgetComponentProps
      };

      // Use React.createElement with error handling to catch originalFactory.call errors
      try {
        return React.createElement(Component, unifiedProps);
      } catch (createElementError) {
        console.error(
          `[renderLazyComponent] React.createElement failed for ${componentName}:`,
          createElementError
        );
        return (
          <div className='rounded border border-red-300 bg-red-50 p-4 text-red-500'>
            <h4 className='font-semibold'>React Element Creation Failed</h4>
            <p className='mt-1 text-sm'>Component: {componentName}</p>
            <p className='mt-2 text-xs text-gray-600'>
              Error:{' '}
              {createElementError instanceof Error ? createElementError.message : 'Unknown error'}
            </p>
          </div>
        );
      }
    } catch (outerError) {
      console.error(`[renderLazyComponent] Outer error for ${componentName}:`, outerError);
      return (
        <div className='rounded border border-red-300 bg-red-50 p-4 text-red-500'>
          <h4 className='font-semibold'>Widget Loading Failed</h4>
          <p className='mt-1 text-sm'>Component: {componentName}</p>
          <p className='mt-2 text-xs text-gray-600'>
            Error: {outerError instanceof Error ? outerError.message : 'Unknown error'}
          </p>
        </div>
      );
    }
  }, []);

  // 延遲加載機制已移除

  // 穩定 config 的關鍵屬性以避免無限循環
  const stableConfigKey = useMemo(() => {
    return `${config.dataSource}-${config.title}-${config.type}-${JSON.stringify(config.metrics)}`;
  }, [config.dataSource, config.title, config.type, config.metrics]);

  // 穩定的數據載入函數
  const fetchData = useCallback(async () => {
    // 防止重複載入
    if (!config.dataSource || loading) {
      return;
    }

    const requestKey = `widget-${config.dataSource}-${timeFrame.start}-${timeFrame.end}`;
    
    try {
      setLoading(true);
      setError(null);
      
      // 使用請求去重器
      const result = await requestDeduplicator.dedupe(requestKey, async () => {
        console.log(`[AdminWidgetRenderer] Fetching data for widget: ${config.dataSource}`);
        
        // 使用 REST API 獲取數據
        const response = await fetch(
          `/api/admin/dashboard?widgets=${config.dataSource}&startDate=${timeFrame.start}&endDate=${timeFrame.end}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const data = await response.json();
        return data[config.dataSource || 'default'] || null;
      });
      
      setData(result);
    } catch (err) {
      console.error(`[AdminWidgetRenderer] Error fetching data:`, err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [config.dataSource, timeFrame.start, timeFrame.end]); // 移除 loading 依賴，避免循環

  // 數據載入邏輯 - 只在手動刷新或時間範圍改變時載入
  useEffect(() => {
    // 首次載入不自動獲取數據，等待用戶手動刷新
    if (refreshTrigger > 0) {
      fetchData();
    }
  }, [refreshTrigger, fetchData]);

  // 時間範圍改變時自動載入
  useEffect(() => {
    // 只在已經有過刷新後才自動載入
    if (refreshTrigger > 0) {
      fetchData();
    }
  }, [timeFrame, fetchData]);

  // 移除 isDelayed 檢查和旋轉動畫 - 直接渲染 widgets

  // 根據 widget 類型選擇對應的渲染器
  const widgetCategory = getWidgetCategory(config.type);

  const baseProps = {
    config,
    theme,
    timeFrame,
    data: data as unknown as WidgetData,
    loading,
    error,
    renderLazyComponent,
  };

  let renderedContent: JSX.Element = createErrorFallback('Unknown widget type');

  try {
    switch (widgetCategory) {
      case 'chart':
        // 檢查是否為新的 ChartCard 類型
        if (config.type === 'chart-card' || config.type === 'chart') {
          renderedContent = (
            <ChartCard
              chartTypes={[config.chartType as any || 'line']}
              dataSources={[config.dataSource || 'default']}
              dateRange={timeFrame ? {
                start: new Date(timeFrame.start),
                end: new Date(timeFrame.end)
              } : undefined}
              isEditMode={false}
            />
          );
        } else {
          renderedContent = <ChartWidgetRenderer {...baseProps} />;
        }
        break;

      case 'stats':
        // 檢查是否為新的 StatsCard 類型
        if (config.type === 'stats-card' || config.type === 'stats') {
          renderedContent = (
            <StatsCard
              statTypes={config.metrics?.map(metric => ({ type: metric } as any)) || []}
              columns={1}
              dateRange={timeFrame ? {
                start: new Date(timeFrame.start),
                end: new Date(timeFrame.end)
              } : undefined}
              showTrend={true}
              showComparison={true}
              isEditMode={false}
            />
          );
        } else if (STATS_MIGRATION_FLAGS.enableStatsCard && isStatsWidget(config.type)) {
          // 舊版 StatsCard 遷移邏輯
          const { statTypes } = convertWidgetConfigToStatsCard([config.type]);
          if (statTypes.length > 0) {
            renderedContent = (
              <StatsCard
                statTypes={statTypes}
                columns={1}
                dateRange={timeFrame ? {
                  start: new Date(timeFrame.start),
                  end: new Date(timeFrame.end)
                } : undefined}
                showTrend={true}
                showComparison={true}
                isEditMode={false}
              />
            );
            break;
          }
        } else {
          // 使用原有的 StatsWidgetRenderer
          renderedContent = <StatsWidgetRenderer {...baseProps} />;
        }
        break;

      case 'list':
        // 檢查是否為新的 Card 類型
        if (config.type === 'table-card') {
          renderedContent = (
            <TableCard
              dataSource={config.dataSource || 'default'}
              dateRange={timeFrame ? {
                start: new Date(timeFrame.start),
                end: new Date(timeFrame.end)
              } : undefined}
              isEditMode={false}
            />
          );
        } else if (config.type === 'list-card') {
          // 處理 ListCard 類型
          // 使用 dataSource 來確定 listType，並從 description 中解析額外配置
          let listType = ListType.OrderState; // 默認值
          let pageSize = 50; // 默認值
          
          // 根據 dataSource 或 description 映射到正確的 ListType
          const sourceType = config.dataSource || config.description;
          switch (sourceType) {
            case 'ORDER_STATE':
            case 'order-state':
            case 'order_state':
              listType = ListType.OrderState;
              break;
            case 'ORDER_RECORD':
            case 'order-record':
            case 'order_record':
              listType = ListType.OrderRecord;
              break;
            case 'WAREHOUSE_TRANSFER':
            case 'warehouse-transfer':
            case 'warehouse_transfer':
              listType = ListType.WarehouseTransfer;
              break;
            case 'OTHER_FILES':
            case 'other-files':
            case 'other_files':
              listType = ListType.OtherFiles;
              break;
            default:
              // 嘗試從 component 名稱推斷
              if (config.component) {
                if (config.component.toLowerCase().includes('order') && config.component.toLowerCase().includes('state')) {
                  listType = ListType.OrderState;
                } else if (config.component.toLowerCase().includes('order') && config.component.toLowerCase().includes('record')) {
                  listType = ListType.OrderRecord;
                } else if (config.component.toLowerCase().includes('transfer')) {
                  listType = ListType.WarehouseTransfer;
                } else if (config.component.toLowerCase().includes('file')) {
                  listType = ListType.OtherFiles;
                }
              }
          }
          
          // 嘗試從 metrics 中解析 pageSize
          if (config.metrics && config.metrics.length > 0) {
            const pageSizeMetric = config.metrics.find(m => m.startsWith('pageSize:'));
            if (pageSizeMetric) {
              const size = parseInt(pageSizeMetric.split(':')[1]);
              if (!isNaN(size)) {
                pageSize = size;
              }
            }
          }
          
          renderedContent = (
            <ListCard
              listType={listType}
              pageSize={pageSize}
              dateRange={timeFrame ? {
                start: new Date(timeFrame.start),
                end: new Date(timeFrame.end)
              } : undefined}
              showHeader={true}
              showMetrics={true}
              showRefreshButton={true}
              isEditMode={false}
            />
          );
        } else if (config.type === 'analysis-card') {
          renderedContent = (
            <AnalysisCard
              analysisType={AnalysisType.TrendForecasting}
              dateRange={timeFrame ? {
                start: new Date(timeFrame.start),
                end: new Date(timeFrame.end)
              } : undefined}
              isEditMode={false}
            />
          );
        } else if (config.type === 'form-card') {
          // 處理 FormCard 類型
          // 使用 dataSource 來確定 formType，並從 config 中解析額外配置
          let formType = FormCardType.PRODUCT_EDIT; // 默認值
          let entityId: string | undefined = undefined;
          let prefilledData: Record<string, any> = {};
          
          // 根據 dataSource 或 description 映射到正確的 FormType
          const sourceType = config.dataSource || config.description || config.component;
          switch (sourceType) {
            case 'PRODUCT_EDIT':
            case 'product-edit':
            case 'product_edit':
              formType = FormCardType.PRODUCT_EDIT;
              break;
            case 'USER_REGISTRATION':
            case 'user-registration':
            case 'user_registration':
              formType = FormCardType.USER_REGISTRATION;
              break;
            case 'ORDER_CREATE':
            case 'order-create':
            case 'order_create':
              formType = FormCardType.ORDER_CREATE;
              break;
            case 'WAREHOUSE_TRANSFER':
            case 'warehouse-transfer':
            case 'warehouse_transfer':
              formType = FormCardType.WAREHOUSE_TRANSFER;
              break;
            case 'QUALITY_CHECK':
            case 'quality-check':
            case 'quality_check':
              formType = FormCardType.QUALITY_CHECK;
              break;
            case 'INVENTORY_ADJUST':
            case 'inventory-adjust':
            case 'inventory_adjust':
              formType = FormCardType.INVENTORY_ADJUST;
              break;
            default:
              // 嘗試從 component 名稱推斷
              if (config.component) {
                if (config.component.toLowerCase().includes('product') && config.component.toLowerCase().includes('edit')) {
                  formType = FormCardType.PRODUCT_EDIT;
                } else if (config.component.toLowerCase().includes('user') && config.component.toLowerCase().includes('registration')) {
                  formType = FormCardType.USER_REGISTRATION;
                } else if (config.component.toLowerCase().includes('order') && config.component.toLowerCase().includes('create')) {
                  formType = FormCardType.ORDER_CREATE;
                } else if (config.component.toLowerCase().includes('warehouse') && config.component.toLowerCase().includes('transfer')) {
                  formType = FormCardType.WAREHOUSE_TRANSFER;
                }
              }
          }
          
          // 嘗試從 metrics 中解析 entityId 和其他配置
          if (config.metrics && config.metrics.length > 0) {
            config.metrics.forEach(metric => {
              if (metric.startsWith('entityId:')) {
                entityId = metric.split(':')[1];
              } else if (metric.startsWith('prefilled:')) {
                try {
                  const prefilledJson = metric.substring('prefilled:'.length);
                  prefilledData = JSON.parse(prefilledJson);
                } catch (e) {
                  console.warn('Failed to parse prefilled data:', e);
                }
              }
            });
          }
          
          // 從 config.config 中解析額外配置
          if (config.config) {
            if (config.config.entityId) {
              entityId = config.config.entityId;
            }
            if (config.config.prefilledData) {
              prefilledData = { ...prefilledData, ...config.config.prefilledData };
            }
          }
          
          renderedContent = (
            <FormCard
              formType={formType}
              entityId={entityId}
              prefilledData={prefilledData}
              showHeader={true}
              showProgress={true}
              showValidationSummary={false}
              isEditMode={false}
              onSubmitSuccess={(data) => {
                console.log('Form submitted successfully:', data);
                // 可以在這裡添加成功處理邏輯
              }}
              onSubmitError={(error) => {
                console.error('Form submission error:', error);
                // 可以在這裡添加錯誤處理邏輯
              }}
              onCancel={() => {
                console.log('Form cancelled');
                // 可以在這裡添加取消處理邏輯
              }}
              onFieldChange={(fieldName, value) => {
                console.log('Field changed:', fieldName, value);
                // 可以在這裡添加字段變更處理邏輯
              }}
            />
          );
        } else {
          renderedContent = <ListWidgetRenderer {...baseProps} />;
        }
        break;

      case 'core':
      default:
        // 處理新的 Operations Cards
        if (config.type === 'department-selector') {
          renderedContent = (
            <DepartmentSelectorCard
              config={{
                defaultDepartment: 'All',
                showIcons: true,
                style: 'full'
              }}
              onDepartmentChange={(department) => {
                console.log('Department changed:', department);
              }}
            />
          );
        } else if (config.type === 'history-tree') {
          renderedContent = (
            <HistoryTreeCard
              gridArea={config.gridArea}
              maxEntries={20}
            />
          );
        } else {
          // 處理核心 widgets (上傳、產品更新等)
          renderedContent = renderCoreWidget(
            config,
            theme,
            timeFrame,
            data || [],
            loading,
            error,
            renderLazyComponent
          );
        }
        break;
    }
  } catch (err) {
    console.error('Widget rendering error:', err);
    renderedContent = createErrorFallback(
      config.type,
      err instanceof Error ? (err as { message: string }).message : 'Unknown error'
    );
  }

  return (
    <UnifiedWidgetWrapper
      theme={theme}
      title={config.title}
      gridArea={config.gridArea} // 傳遞 gridArea 屬性
    >
      <Suspense
        fallback={createSuspenseFallback(
          widgetCategory as 'default' | 'stats' | 'chart' | 'table' | 'list'
        )}
      >
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
  data: DatabaseRecord[],
  loading: boolean,
  error: string | null,
  renderLazyComponent: (componentName: string, props: WidgetComponentProps) => JSX.Element
): JSX.Element {
  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return createErrorFallback(config.type, error);
  }

  const getComponentProps = (data?: LocalWidgetData): WidgetComponentProps => ({
    config,
    timeFrame,
    theme,
    data: data as unknown as WidgetData,
  });

  switch (config.type) {
    case 'UploadZone':
      return renderLazyComponent('UploadZone', getComponentProps(data));

    case 'ProductUpdateWidget':
      return renderLazyComponent('ProductUpdateWidget', getComponentProps(data));

    case 'ProductUpdateWidgetV2': // 向後兼容
      return renderLazyComponent('ProductUpdateWidget', getComponentProps(data));

    case 'SupplierUpdateWidget':
      return <SupplierUpdateWidget config={config} timeFrame={timeFrame} theme={theme} />;

    case 'VoidPalletWidget':
      return renderLazyComponent('VoidPalletWidget', getComponentProps(data));

    case 'alerts':
      return <AlertsWidget data={data} />;

    case 'preview':
      return <PreviewWidget config={config} />;

    case 'report-generator':
      return <ReportGeneratorWidget config={config} timeFrame={timeFrame} />;

    case 'coming_soon':
    case 'available-soon':
      return (
        <div className='flex h-32 items-center justify-center'>
          <div className='text-center text-gray-500'>
            <BuildingOfficeIcon className='mx-auto mb-2 h-12 w-12' />
            <p className='text-sm'>功能即將推出</p>
          </div>
        </div>
      );

    case 'history-tree':
      // 直接使用靜態導入的 HistoryTreeV2 避免 originalFactory.call 錯誤
      return <HistoryTreeV2 {...getComponentProps(data)} />;

    default:
      return createErrorFallback(`Unknown core widget type: ${config.type}`);
  }
}

// 簡化的供應商更新 Widget
const SupplierUpdateWidget: React.FC<{
  config: AdminWidgetConfig;
  timeFrame: TimeFrame;
  theme: string;
}> = ({ config, timeFrame, theme }) => {
  return (
    <div className='text-center text-gray-500'>
      <p>供應商更新功能</p>
    </div>
  );
};

// 簡化的警報 Widget
const AlertsWidget: React.FC<{ data: DatabaseRecord[] }> = ({ data }) => {
  const alerts = data || [];

  return (
    <div className='space-y-2'>
      {alerts.length === 0 ? (
        <div className='py-4 text-center text-gray-500'>暫無警報</div>
      ) : (
        alerts.map((alert: DatabaseRecord, index: number) => (
          <div key={index} className='rounded border border-yellow-200 bg-yellow-50 p-2 text-sm'>
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
    <div className='text-center text-gray-500'>
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
    <div className='text-center text-gray-500'>
      <p>報告生成器</p>
    </div>
  );
};

// Export AdminWidgetRenderer with React.memo
export const AdminWidgetRenderer = React.memo(
  AdminWidgetRendererComponent,
  (prevProps, nextProps) => {
    // 自定義比較函數
    return (
      JSON.stringify(prevProps.config) === JSON.stringify(nextProps.config) &&
      prevProps.theme === nextProps.theme &&
      JSON.stringify(prevProps.timeFrame) === JSON.stringify(nextProps.timeFrame) &&
      prevProps.index === nextProps.index &&
      prevProps.delay === nextProps.delay
    );
  }
);

AdminWidgetRenderer.displayName = 'AdminWidgetRenderer';
