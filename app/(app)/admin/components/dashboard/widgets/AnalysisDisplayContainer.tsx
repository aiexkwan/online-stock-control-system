/**
 * Analysis Display Container - 新的分析顯示容器
 * 替換 AnalysisExpandableCards 的展開選擇功能
 *
 * 重構決策 (2025-07-22):
 * - 從7個自定義圖表改為11個 UnifiedWidget
 * - 從內部選擇改為外部控制
 * - 簡化架構，提高可維護性
 *
 * 🚨 緊急修復 (2025-07-22): 專家會議決策
 * - 使用 UnifiedWidget 系統替代 ANALYSIS_WIDGETS_CONFIG
 * - 解決 "Widget loader not configured" 錯誤
 * - 符合原始設計意圖和用戶需求
 */

'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { textClasses } from '@/lib/design-system/typography';
import { UNIFIED_WIDGET_CONFIG } from '@/lib/widgets/unified-widget-config';
import { UnifiedWidgetProps } from '@/lib/widgets/types/enhanced-widget-types';

// Widget Props 類型定義
interface WidgetProps {
  widget?: {
    title?: string;
    [key: string]: unknown;
  };
  isEditMode?: boolean;
  [key: string]: unknown;
}

/**
 * 分析頁面專用的11個 UnifiedWidget 選擇
 * 基於業務需求和使用頻率從 UNIFIED_WIDGET_CONFIG 中選擇
 *
 * 🚨 緊急修復：使用 UnifiedWidget 系統解決 loader 問題
 */
export const ANALYSIS_WIDGET_SELECTION = [
  'HistoryTreeV2',
  'InventoryOrderedAnalysisWidget',
  'StockDistributionChartV2',
  'StockLevelHistoryChart',
  'TopProductsByQuantityWidget',
  'TopProductsDistributionWidget',
  'TransferTimeDistributionWidget',
  'WarehouseWorkLevelAreaChart',
  'WarehouseTransferListWidget',
  'TransactionReportWidget',
  'AnalysisExpandableCards',
] as const;

export type AnalysisWidgetId = (typeof ANALYSIS_WIDGET_SELECTION)[number];

interface AnalysisDisplayContainerProps {
  selectedWidget: AnalysisWidgetId;
  onWidgetError?: (widgetId: string, error: Error) => void;
  className?: string;
}

/**
 * 動態 Widget 載入器組件
 */
const DynamicWidgetLoader: React.FC<{
  widgetId: string;
  loader: () => Promise<{ default: React.ComponentType<UnifiedWidgetProps> }>;
}> = ({ widgetId, loader }) => {
  const [WidgetComponent, setWidgetComponent] =
    React.useState<React.ComponentType<UnifiedWidgetProps> | null>(null);
  const [loadError, setLoadError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    loader()
      .then(module => {
        if (isMounted) {
          setWidgetComponent(() => module.default);
        }
      })
      .catch(error => {
        if (isMounted) {
          setLoadError(error);
          console.error(`Failed to load widget ${widgetId}:`, error);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [widgetId, loader]);

  if (loadError) {
    return (
      <div className='flex h-48 items-center justify-center text-destructive'>
        <div className='text-center'>
          <AlertTriangle className='mx-auto mb-2 h-8 w-8' />
          <p className='text-sm'>Failed to load widget</p>
          <p className='mt-1 text-xs text-muted-foreground'>{widgetId}</p>
        </div>
      </div>
    );
  }

  if (!WidgetComponent) {
    return (
      <div className='flex h-48 items-center justify-center'>
        <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
      </div>
    );
  }

  return (
    <WidgetComponent
      widget={{ id: widgetId, type: 'analysis', title: `Widget ${widgetId}`, config: {} }}
      mode='traditional'
      widgetId={widgetId}
    />
  );
};

/**
 * Widget 錯誤邊界組件
 */
const WidgetErrorBoundary: React.FC<{
  widgetId: string;
  children: React.ReactNode;
  onError?: (widgetId: string, error: Error) => void;
}> = ({ widgetId, children, onError }) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      setHasError(true);
      onError?.(widgetId, new Error(error.message));
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [widgetId, onError]);

  if (hasError) {
    return (
      <div
        className={cn(
          'flex h-48 flex-col items-center justify-center',
          'rounded-lg border border-destructive/20 bg-destructive/5',
          'text-destructive'
        )}
      >
        <AlertTriangle className='mb-2 h-8 w-8' />
        <p className={cn(textClasses['body-small'], 'font-medium')}>Widget Load Error</p>
        <p className={cn(textClasses['label-small'], 'mt-1 opacity-70')}>{widgetId}</p>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * 動畫變量配置
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
};

// 移除網格佈局相關代碼，改為單一widget全屏顯示

export const AnalysisDisplayContainer: React.FC<AnalysisDisplayContainerProps> = ({
  selectedWidget,
  onWidgetError,
  className,
}) => {
  // 驗證選中的 widget 配置
  const widgetConfig = useMemo(() => {
    // 檢查是否為分析頁面支援的 widget
    const isAnalysisWidget = ANALYSIS_WIDGET_SELECTION.includes(selectedWidget);
    const config = UNIFIED_WIDGET_CONFIG[selectedWidget];

    return config && isAnalysisWidget ? { config } : null;
  }, [selectedWidget]);

  // 如果 widget 配置無效
  if (!widgetConfig) {
    return (
      <div
        className={cn(
          'flex h-64 flex-col items-center justify-center',
          'text-muted-foreground',
          className
        )}
      >
        <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
          <AlertTriangle className='h-6 w-6' />
        </div>
        <h3 className={cn(textClasses['body-base'], 'mb-2 font-medium')}>
          Widget Configuration Error
        </h3>
        <p className={cn(textClasses['body-small'], 'max-w-sm text-center')}>
          The selected widget &quot;{selectedWidget}&quot; is not properly configured.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className={cn('w-full', className)}
      initial='hidden'
      animate='visible'
      variants={containerVariants}
    >
      {/* 標題區域 */}
      <div className='mb-6'>
        <h2 className={cn(textClasses['heading-small'], 'font-bold text-foreground')}>
          {widgetConfig.config.name}
        </h2>
        <p className={cn(textClasses['body-small'], 'mt-1 text-muted-foreground')}>
          {widgetConfig.config.description || 'Analysis Widget Display'}
        </p>
      </div>

      {/* 單一 Widget 顯示區域 */}
      <motion.div className='w-full' variants={itemVariants}>
        <WidgetErrorBoundary widgetId={selectedWidget} onError={onWidgetError}>
          <div
            className={cn(
              'h-[1000px] max-h-[1000px] min-h-[1000px] w-full rounded-lg border bg-card p-6',
              'shadow-sm transition-shadow duration-200 hover:shadow-md',
              'flex flex-col overflow-hidden'
            )}
          >
            {/* Widget 內容 - 全屏顯示 */}
            <div className='min-h-0 flex-1'>
              <React.Suspense
                fallback={
                  <div className='flex h-full items-center justify-center'>
                    <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
                  </div>
                }
              >
                {/* 動態載入 Widget 組件 */}
                {widgetConfig.config.loader ? (
                  <DynamicWidgetLoader
                    widgetId={selectedWidget}
                    loader={widgetConfig.config.loader}
                  />
                ) : (
                  <div className='flex h-full items-center justify-center text-muted-foreground'>
                    <p>Widget loader not configured for: {selectedWidget}</p>
                    <p className='mt-2 text-xs'>
                      Available in UNIFIED_WIDGET_CONFIG but missing loader function
                    </p>
                  </div>
                )}
              </React.Suspense>
            </div>
          </div>
        </WidgetErrorBoundary>
      </motion.div>
    </motion.div>
  );
};

export default AnalysisDisplayContainer;

/**
 * 使用範例：
 *
 * ```tsx
 * const [selectedWidget, setSelectedWidget] = useState<AnalysisWidgetId>('HistoryTreeV2');
 *
 * <AnalysisDisplayContainer
 *   selectedWidget={selectedWidget}
 *   onWidgetError={(widgetId, error) => {
 *     console.error(`Widget ${widgetId} failed:`, error);
 *   }}
 * />
 * ```
 */
