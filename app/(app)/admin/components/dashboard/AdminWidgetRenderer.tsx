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

  // 🛑 緊急修復：完全禁用數據載入，立即停止循環
  useEffect(() => {
    // 立即設置空數據和結束載入狀態
    setData(null);
    setLoading(false);
    setError(null);
    console.log(`[AdminWidgetRenderer] Widget ${config.dataSource} - EMERGENCY STOP - Loading disabled`);
  }, []); // 🔧 空依賴數組 - 只執行一次，防止循環

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
        renderedContent = renderCoreWidget(
          config,
          theme,
          timeFrame,
          data || [],
          loading,
          error,
          renderLazyComponent
        );
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
      console.warn('[Deprecated] ProductUpdateWidget is deprecated, use ProductUpdateWidgetV2');
    // fallthrough
    case 'ProductUpdateWidgetV2':
      return renderLazyComponent('ProductUpdateWidgetV2', getComponentProps(data));

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
