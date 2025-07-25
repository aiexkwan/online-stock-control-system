/**
 * Admin Card Renderer - Pure Card Architecture
 * Only handles modern Card components, all legacy widgets removed
 * Renamed from AdminWidgetRenderer to reflect Card-only functionality
 */

'use client';

import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { AdminWidgetConfig } from '@/types/components/dashboard';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';
import {
  MetricType,
  ChartType,
  CategoryType,
  SearchEntity,
  MetricItem,
  PrefilledData,
  safeParseChartType,
  safeParseCategory,
  safeParseSearchEntities,
  migrateMetrics,
  migrateStatsTypes,
  categoryTypeToConfigCategory,
} from '@/lib/types/admin-cards';
import { SearchMode, SearchableEntity } from '@/types/generated/search-types';
import { StatsCard } from './cards/StatsCard';
import { ChartCard } from './cards/ChartCard';
import { TableCard } from './cards/TableCard';
import { AnalysisCard } from './cards/AnalysisCard';
import { ListCard } from './cards/ListCard';
import { FormCard, FormType as FormCardType } from './cards/FormCard';
import { AlertCard } from './cards/AlertCard';
import { ConfigCard } from './cards/ConfigCard';
import { SearchCard } from './cards/SearchCard';
import { NavigationCard } from './cards/NavigationCard';
import { NavigationType } from './cards/NavigationCard';
import {
  NotificationCard,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
} from './cards/NotificationCard';
import { UploadCard } from './cards/UploadCard';
import { UploadType } from '@/types/generated/graphql';
import { ReportCard } from './cards/ReportCard';
import { ListType, AnalysisType, ReportType } from '@/types/generated/graphql';
import { DepartmentSelectorCard } from './cards/DepartmentSelectorCard';
import { HistoryTreeCard } from './cards/HistoryTreeCard';
import { getThemeGlowColor } from './widget-renderer-shared';
import { WidgetSuspenseFallback } from './widgets/common/WidgetStates';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PencilIcon } from '@heroicons/react/24/outline';
import { GlassmorphicCard } from '@/app/components/visual-system/effects/GlassmorphicCard';

interface AdminCardRendererProps {
  config: AdminWidgetConfig;
  theme: string;
  timeFrame: TimeFrame;
  index?: number;
  delay?: number;
}

// 統一的 Card Suspense Fallback 生成器
const createSuspenseFallback = (
  type: 'default' | 'stats' | 'chart' | 'table' | 'list' = 'default'
) => {
  return <WidgetSuspenseFallback type={type} />;
};

// 統一的 Card Wrapper Component
const UnifiedCardWrapper = React.memo<{
  children: React.ReactNode;
  theme: string;
  title?: string;
  isEditMode?: boolean;
  onUpdate?: () => void;
  onRemove?: () => void;
  gridArea?: string;
  style?: React.CSSProperties;
}>(({ children, theme, title, isEditMode, onUpdate, onRemove, gridArea, style }) => {
  const glowColor = getThemeGlowColor(theme);

  return (
    <GlassmorphicCard
      variant='default'
      hover={true}
      borderGlow={false}
      padding='none'
      className={cn(
        'h-full w-full',
        `glow-${glowColor}`,
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
      )}
      style={{
        ...style,
        gridArea: gridArea,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className='h-full w-full'
        data-card-focusable='true'
        tabIndex={-1}
        role='region'
        aria-label={title || 'Dashboard card'}
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

UnifiedCardWrapper.displayName = 'UnifiedCardWrapper';

// Error fallback component
const createErrorFallback = (cardType: string, errorMessage?: string) => (
  <div className='rounded border border-red-300 bg-red-50 p-4 text-red-500'>
    <h4 className='font-semibold'>Card Error</h4>
    <p className='mt-1 text-sm'>Type: {cardType}</p>
    {errorMessage && <p className='mt-2 text-xs text-gray-600'>Error: {errorMessage}</p>}
  </div>
);

const AdminCardRendererComponent: React.FC<AdminCardRendererProps> = ({
  config,
  theme,
  timeFrame,
  index = 0,
  delay = 0,
}) => {
  let renderedContent: JSX.Element = createErrorFallback('Unknown card type');

  try {
    // 只處理 Card 類型
    switch (config.type) {
      // StatsCard 類型
      case 'stats-card':
      case 'stats':
        renderedContent = (
          <StatsCard
            statTypes={config.metrics ? migrateStatsTypes(config.metrics) : []}
            columns={1}
            dateRange={
              timeFrame
                ? {
                    start: new Date(timeFrame.start),
                    end: new Date(timeFrame.end),
                  }
                : undefined
            }
            showTrend={true}
            showComparison={true}
            isEditMode={false}
          />
        );
        break;

      // ChartCard 類型
      case 'chart-card':
      case 'chart':
        renderedContent = (
          <ChartCard
            chartTypes={[safeParseChartType(config.chartType || 'line')]}
            dataSources={[config.dataSource || 'default']}
            dateRange={
              timeFrame
                ? {
                    start: new Date(timeFrame.start),
                    end: new Date(timeFrame.end),
                  }
                : undefined
            }
            isEditMode={false}
          />
        );
        break;

      // TableCard 類型
      case 'table-card':
        renderedContent = (
          <TableCard
            dataSource={config.dataSource || 'default'}
            dateRange={
              timeFrame
                ? {
                    start: new Date(timeFrame.start),
                    end: new Date(timeFrame.end),
                  }
                : undefined
            }
            isEditMode={false}
          />
        );
        break;

      // ListCard 類型
      case 'list-card':
        let listType = ListType.OrderState;
        let pageSize = 50;

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
        }

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
            dateRange={
              timeFrame
                ? {
                    start: new Date(timeFrame.start),
                    end: new Date(timeFrame.end),
                  }
                : undefined
            }
            showHeader={true}
            showMetrics={true}
            showRefreshButton={true}
            isEditMode={false}
          />
        );
        break;

      // AnalysisCard 類型
      case 'analysis-card':
        renderedContent = (
          <AnalysisCard
            analysisType={AnalysisType.TrendForecasting}
            dateRange={
              timeFrame
                ? {
                    start: new Date(timeFrame.start),
                    end: new Date(timeFrame.end),
                  }
                : undefined
            }
            isEditMode={false}
          />
        );
        break;

      // AlertCard 類型
      case 'alert-card':
        renderedContent = (
          <AlertCard
            defaultView={config.metrics?.includes('compact') ? 'compact' : 'full'}
            allowBatchOperations={!config.metrics?.includes('noBatch')}
            showStatistics={!config.metrics?.includes('noStats')}
            refreshInterval={30}
          />
        );
        break;

      // ConfigCard 類型
      case 'config-card':
        let defaultCategory: CategoryType = 'SYSTEM';

        const categorySource = config.dataSource || config.description || config.component;
        if (categorySource) {
          const categoryMap: Record<string, string> = {
            system: 'SYSTEM',
            user: 'USER_PREFERENCES',
            'user-preferences': 'USER_PREFERENCES',
            department: 'DEPARTMENT',
            notification: 'NOTIFICATION',
            api: 'API',
            security: 'SECURITY',
            display: 'DISPLAY',
            workflow: 'WORKFLOW',
          };

          const mappedCategory = categoryMap[categorySource.toLowerCase()];
          if (mappedCategory) {
            defaultCategory = safeParseCategory(mappedCategory);
          }
        }

        // Convert CategoryType to ConfigCategory for ConfigCard component
        const configCategory = categoryTypeToConfigCategory(defaultCategory);

        renderedContent = (
          <ConfigCard
            defaultCategory={configCategory}
            showSearch={!config.metrics?.includes('noSearch')}
            showHistory={!config.metrics?.includes('noHistory')}
            showTemplates={!config.metrics?.includes('noTemplates')}
            refreshInterval={config.metrics?.includes('fastRefresh') ? 10 : 30}
            permissions={config.metrics
              ?.filter(m => m.startsWith('perm:'))
              .map(m => m.substring(5))}
          />
        );
        break;

      // FormCard 類型
      case 'form-card':
        let formType = FormCardType.PRODUCT_EDIT;
        let entityId: string | undefined = undefined;
        let prefilledData: PrefilledData = {};

        const formSourceType = config.dataSource || config.description || config.component;
        switch (formSourceType) {
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
        }

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
            onSubmitSuccess={data => {
              console.log('Form submitted successfully:', data);
            }}
            onSubmitError={error => {
              console.error('Form submission error:', error);
            }}
            onCancel={() => {
              console.log('Form cancelled');
            }}
            onFieldChange={(fieldName, value) => {
              console.log('Field changed:', fieldName, value);
            }}
          />
        );
        break;

      // UploadCard 類型
      case 'upload-card':
      case 'UploadZone':
        renderedContent = (
          <UploadCard
            uploadType={UploadType.GeneralFiles}
            showRecentUploads={true}
            showProgress={true}
            isEditMode={false}
          />
        );
        break;

      // ReportCard 類型
      case 'report-card':
      case 'report-generator':
        renderedContent = (
          <ReportCard
            reportType={ReportType.InventoryReport}
            dateRange={
              timeFrame
                ? {
                    start: new Date(timeFrame.start),
                    end: new Date(timeFrame.end),
                  }
                : undefined
            }
            isEditMode={false}
          />
        );
        break;

      // DepartmentSelectorCard 類型
      case 'department-selector':
        renderedContent = (
          <DepartmentSelectorCard
            config={{
              defaultDepartment: 'All',
              showIcons: true,
              style: 'full',
            }}
            onDepartmentChange={department => {
              console.log('Department changed:', department);
            }}
          />
        );
        break;

      // SearchCard 類型
      case 'search-card':
      case 'search':
        let defaultSearchMode: SearchMode = SearchMode.Global;
        let defaultSearchEntities: SearchableEntity[] = [
          SearchableEntity.Product,
          SearchableEntity.Pallet,
        ];
        let searchPlaceholder = 'Search products, pallets, orders...';

        // Parse search configuration from config.metrics
        if (config.metrics && config.metrics.length > 0) {
          config.metrics.forEach(metric => {
            if (metric.startsWith('mode:')) {
              const mode = metric.split(':')[1].toUpperCase();
              switch (mode) {
                case 'GLOBAL':
                  defaultSearchMode = SearchMode.Global;
                  break;
                case 'ENTITY':
                  defaultSearchMode = SearchMode.Entity;
                  break;
                case 'MIXED':
                  defaultSearchMode = SearchMode.Mixed;
                  break;
                case 'SUGGESTION':
                  defaultSearchMode = SearchMode.Suggestion;
                  break;
              }
            } else if (metric.startsWith('entities:')) {
              try {
                const entitiesStr = metric.substring('entities:'.length);
                const entityNames = entitiesStr.split(',').map(e => e.trim().toUpperCase());
                defaultSearchEntities = entityNames.map(name => {
                  switch (name) {
                    case 'PRODUCT':
                      return SearchableEntity.Product;
                    case 'PALLET':
                      return SearchableEntity.Pallet;
                    case 'ORDER':
                      return SearchableEntity.Order;
                    case 'USER':
                      return SearchableEntity.User;
                    case 'SUPPLIER':
                      return SearchableEntity.Supplier;
                    case 'INVENTORY':
                      return SearchableEntity.Inventory;
                    case 'FILE':
                      return SearchableEntity.File;
                    case 'GRN':
                      return SearchableEntity.Grn;
                    case 'HISTORY':
                      return SearchableEntity.History;
                    case 'TRANSFER':
                      return SearchableEntity.Transfer;
                    default:
                      return SearchableEntity.Product;
                  }
                });
              } catch (e) {
                console.warn('Failed to parse search entities:', e);
              }
            } else if (metric.startsWith('placeholder:')) {
              searchPlaceholder = metric.substring('placeholder:'.length);
            }
          });
        }

        // Parse from config.config object
        if (config.config) {
          if (config.config.searchMode) {
            const mode = config.config.searchMode.toUpperCase();
            switch (mode) {
              case 'GLOBAL':
                defaultSearchMode = SearchMode.Global;
                break;
              case 'ENTITY':
                defaultSearchMode = SearchMode.Entity;
                break;
              case 'MIXED':
                defaultSearchMode = SearchMode.Mixed;
                break;
              case 'SUGGESTION':
                defaultSearchMode = SearchMode.Suggestion;
                break;
            }
          }
          if (config.config.searchEntities) {
            const entities = Array.isArray(config.config.searchEntities)
              ? config.config.searchEntities
              : [config.config.searchEntities];
            defaultSearchEntities = entities.map((name: string) => {
              const upperName = name.toUpperCase();
              switch (upperName) {
                case 'PRODUCT':
                  return SearchableEntity.Product;
                case 'PALLET':
                  return SearchableEntity.Pallet;
                case 'ORDER':
                  return SearchableEntity.Order;
                case 'USER':
                  return SearchableEntity.User;
                case 'SUPPLIER':
                  return SearchableEntity.Supplier;
                case 'INVENTORY':
                  return SearchableEntity.Inventory;
                case 'FILE':
                  return SearchableEntity.File;
                case 'GRN':
                  return SearchableEntity.Grn;
                case 'HISTORY':
                  return SearchableEntity.History;
                case 'TRANSFER':
                  return SearchableEntity.Transfer;
                default:
                  return SearchableEntity.Product;
              }
            });
          }
          if (config.config.placeholder) {
            searchPlaceholder = config.config.placeholder;
          }
        }

        renderedContent = (
          <SearchCard
            placeholder={searchPlaceholder}
            defaultMode={defaultSearchMode}
            defaultEntities={defaultSearchEntities}
            onResultSelect={result => {
              console.log('Search result selected:', result);
            }}
            onSearch={(query, results) => {
              console.log('Search performed:', query, results);
            }}
          />
        );
        break;

      // NavigationCard 類型
      case 'navigation-card':
      case 'navigation':
        let navigationType: NavigationType = NavigationType.SIDEBAR;
        let showSearch = true;
        let showBookmarks = true;
        let collapsible = true;

        const navSourceType = config.dataSource || config.description || config.component;
        switch (navSourceType) {
          case 'SIDEBAR':
          case 'sidebar':
            navigationType = NavigationType.SIDEBAR;
            break;
          case 'BREADCRUMB':
          case 'breadcrumb':
            navigationType = NavigationType.BREADCRUMB;
            showSearch = false;
            break;
          case 'MENU':
          case 'menu':
            navigationType = NavigationType.MENU;
            break;
          case 'QUICK_ACCESS':
          case 'quick-access':
          case 'quick_access':
            navigationType = NavigationType.QUICK_ACCESS;
            break;
        }

        if (config.metrics && config.metrics.length > 0) {
          config.metrics.forEach(metric => {
            if (metric === 'noSearch') showSearch = false;
            if (metric === 'noBookmarks') showBookmarks = false;
            if (metric === 'noCollapse') collapsible = false;
          });
        }

        renderedContent = (
          <NavigationCard
            navigationType={navigationType}
            currentPath={config.config?.currentPath}
            permissions={config.config?.permissions || []}
            showSearch={showSearch}
            showBookmarks={showBookmarks}
            collapsible={collapsible}
            isEditMode={false}
            onNavigate={(path, item) => {
              console.log('Navigation:', path, item);
            }}
            onBookmark={item => {
              console.log('Bookmarked:', item);
            }}
            onSearch={(query, results) => {
              console.log('Search:', query, results);
            }}
          />
        );
        break;

      // NotificationCard 類型
      case 'notification-card':
      case 'notifications':
        let maxItems = 20;
        let showFilters = true;
        let showBulkActions = true;
        let showStats = true;
        let autoRefresh = true;
        let compact = false;
        let defaultTypes = Object.values(NotificationType);
        let defaultPriorities = Object.values(NotificationPriority);
        let defaultStatus = [NotificationStatus.UNREAD, NotificationStatus.READ];

        if (config.metrics && config.metrics.length > 0) {
          config.metrics.forEach(metric => {
            if (metric.startsWith('maxItems:')) {
              const items = parseInt(metric.split(':')[1]);
              if (!isNaN(items)) maxItems = items;
            } else if (metric === 'noFilters') {
              showFilters = false;
            } else if (metric === 'noBulkActions') {
              showBulkActions = false;
            } else if (metric === 'noStats') {
              showStats = false;
            } else if (metric === 'noAutoRefresh') {
              autoRefresh = false;
            } else if (metric === 'compact') {
              compact = true;
            } else if (metric.startsWith('types:')) {
              const types = metric.substring('types:'.length).split(',');
              defaultTypes = types.map(t => t.trim().toUpperCase() as NotificationType);
            }
          });
        }

        if (config.config) {
          if (config.config.maxItems) maxItems = config.config.maxItems;
          if (config.config.showFilters !== undefined) showFilters = config.config.showFilters;
          if (config.config.showBulkActions !== undefined)
            showBulkActions = config.config.showBulkActions;
          if (config.config.showStats !== undefined) showStats = config.config.showStats;
          if (config.config.autoRefresh !== undefined) autoRefresh = config.config.autoRefresh;
          if (config.config.compact !== undefined) compact = config.config.compact;
          if (config.config.defaultTypes) defaultTypes = config.config.defaultTypes;
          if (config.config.defaultPriorities) defaultPriorities = config.config.defaultPriorities;
          if (config.config.defaultStatus) defaultStatus = config.config.defaultStatus;
        }

        renderedContent = (
          <NotificationCard
            maxItems={maxItems}
            showFilters={showFilters}
            showBulkActions={showBulkActions}
            showStats={showStats}
            autoRefresh={autoRefresh}
            defaultTypes={defaultTypes}
            defaultPriorities={defaultPriorities}
            defaultStatus={defaultStatus}
            compact={compact}
            isEditMode={false}
            userId={config.config?.userId || 'current-user'}
            onNotificationClick={notification => {
              console.log('Notification clicked:', notification);
            }}
            onNotificationAction={(notification, action) => {
              console.log('Notification action:', notification, action);
            }}
            onStatsUpdate={stats => {
              console.log('Notification stats updated:', stats);
            }}
          />
        );
        break;

      // HistoryTreeCard 類型
      case 'history-tree':
        renderedContent = <HistoryTreeCard gridArea={config.gridArea} maxEntries={20} />;
        break;

      default:
        renderedContent = createErrorFallback(`Unknown card type: ${config.type}`);
        break;
    }
  } catch (err) {
    console.error('Card rendering error:', err);
    renderedContent = createErrorFallback(
      config.type,
      err instanceof Error ? err.message : 'Unknown error'
    );
  }

  return (
    <UnifiedCardWrapper theme={theme} title={config.title} gridArea={config.gridArea}>
      <Suspense fallback={createSuspenseFallback('default')}>{renderedContent}</Suspense>
    </UnifiedCardWrapper>
  );
};

// Export AdminCardRenderer with React.memo
export const AdminCardRenderer = React.memo(AdminCardRendererComponent, (prevProps, nextProps) => {
  return (
    JSON.stringify(prevProps.config) === JSON.stringify(nextProps.config) &&
    prevProps.theme === nextProps.theme &&
    JSON.stringify(prevProps.timeFrame) === JSON.stringify(nextProps.timeFrame) &&
    prevProps.index === nextProps.index &&
    prevProps.delay === nextProps.delay
  );
});

AdminCardRenderer.displayName = 'AdminCardRenderer';
