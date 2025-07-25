/**
 * List Widget Renderer
 * 處理所有列表和表格類型的 Widget 渲染
 */

'use client';

import React from 'react';
import { DatabaseRecord } from '@/types/database/tables';
import { WidgetComponentProps as SharedWidgetComponentProps } from './widget-renderer-shared';
import {
  BaseWidgetRendererProps,
  createErrorFallback,
  getComponentPropsFactory,
} from './widget-renderer-shared';
import {
  DocumentArrowDownIcon,
  TruckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

// 類型守衛函數
function isArrayData(data: unknown): data is unknown[] {
  return Array.isArray(data);
}

function isDatabaseRecord(item: unknown): item is DatabaseRecord {
  return typeof item === 'object' && item !== null;
}

function hasStringProperty(obj: unknown, prop: string): obj is Record<string, unknown> {
  return typeof obj === 'object' && obj !== null && prop in obj;
}

export const ListWidgetRenderer: React.FC<BaseWidgetRendererProps> = ({
  config,
  theme,
  timeFrame,
  data,
  loading,
  error,
  renderLazyComponent,
}) => {
  const getComponentProps = getComponentPropsFactory(config, timeFrame, theme);

  // 創建符合 SharedWidgetComponentProps 的 props 對象
  const createWidgetProps = (widgetData?: unknown): SharedWidgetComponentProps => {
    return {
      config,
      timeFrame,
      theme,
      data: widgetData as Record<string, unknown>,
    };
  };

  if (loading) {
    return <div>Loading list...</div>;
  }

  if (error) {
    return createErrorFallback(config.type, error);
  }

  try {
    switch (config.type) {
      case 'OrderStateListWidget':
        return renderLazyComponent('OrderStateListWidgetV2', createWidgetProps(data));

      case 'WarehouseTransferListWidget':
        return renderLazyComponent('WarehouseTransferListWidget', createWidgetProps(data));

      case 'StockInventoryTable':
        return renderLazyComponent('StockInventoryTable', createWidgetProps(data));

      case 'orders-list':
        return renderLazyComponent('OrdersListWidgetV2', createWidgetProps(data));

      case 'other-files-list':
        return renderLazyComponent('OtherFilesListWidgetV2', createWidgetProps(data));

      case 'activity-feed':
        const activityData = isArrayData(data) ? data : [];
        return (
          <div className='h-full w-full p-4'>
            <h3 className='mb-4 text-lg font-semibold'>活動動態</h3>
            <div className='max-h-80 space-y-3 overflow-y-auto'>
              {activityData.map((item: unknown, index: number) => {
                const record = isDatabaseRecord(item) ? (item as DatabaseRecord) : {};
                const title = hasStringProperty(record, 'title')
                  ? String(record.title)
                  : `活動 ${index + 1}`;
                const description = hasStringProperty(record, 'description')
                  ? String(record.description)
                  : '詳細描述';
                const time = hasStringProperty(record, 'time') ? String(record.time) : '剛剛';

                return (
                  <div key={index} className='flex items-start space-x-3 rounded-lg bg-gray-50 p-3'>
                    <div className='flex-shrink-0'>
                      <TruckIcon className='h-5 w-5 text-blue-600' />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='text-sm font-medium text-gray-900'>{title}</p>
                      <p className='text-xs text-gray-500'>{description}</p>
                      <p className='mt-1 text-xs text-gray-400'>{time}</p>
                    </div>
                  </div>
                );
              })}
              {activityData.length === 0 && (
                <div className='py-8 text-center text-gray-500'>暫無活動記錄</div>
              )}
            </div>
          </div>
        );

      case 'table':
        // 通用表格處理
        const tableData = isArrayData(data) ? data : [];
        const columns = Array.isArray(config.metrics) ? config.metrics : ['name', 'value'];

        return (
          <div className='h-full w-full p-4'>
            <h3 className='mb-4 text-lg font-semibold'>{config.title || '數據表格'}</h3>
            <div className='max-h-80 overflow-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b bg-gray-50'>
                    {columns.map((col: unknown) => (
                      <th
                        key={String(col)}
                        className='px-3 py-2 text-left font-medium text-gray-900'
                      >
                        {String(col)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row: unknown, index: number) => {
                    const record = isDatabaseRecord(row) ? (row as DatabaseRecord) : {};
                    return (
                      <tr key={index} className='border-b hover:bg-gray-50'>
                        {columns.map((col: unknown) => {
                          const colKey = String(col);
                          const cellValue = hasStringProperty(record, colKey)
                            ? String(record[colKey])
                            : '-';
                          return (
                            <td key={colKey} className='px-3 py-2 text-gray-600'>
                              {cellValue}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  {tableData.length === 0 && (
                    <tr>
                      <td colSpan={columns.length} className='px-3 py-8 text-center text-gray-500'>
                        暫無數據
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'list':
        // 通用列表處理
        const listData = isArrayData(data) ? data : [];

        return (
          <div className='h-full w-full p-4'>
            <h3 className='mb-4 text-lg font-semibold'>{config.title || '數據列表'}</h3>
            <div className='max-h-80 space-y-2 overflow-y-auto'>
              {listData.map((item: unknown, index: number) => {
                let displayText: string;
                let displayValue: string | null = null;

                if (isDatabaseRecord(item)) {
                  const record = item as DatabaseRecord;
                  if (hasStringProperty(record, 'name')) {
                    displayText = String((record as Record<string, unknown>).name);
                  } else if (hasStringProperty(record, 'title')) {
                    displayText = String((record as Record<string, unknown>).title);
                  } else {
                    displayText = `項目 ${index + 1}`;
                  }
                  if (hasStringProperty(record, 'value')) {
                    displayValue = String((record as Record<string, unknown>).value);
                  }
                } else {
                  displayText = String(item);
                }

                return (
                  <div
                    key={index}
                    className='flex items-center justify-between rounded-lg bg-gray-50 p-3 hover:bg-gray-100'
                  >
                    <div className='flex items-center space-x-3'>
                      <DocumentArrowDownIcon className='h-4 w-4 text-gray-400' />
                      <span className='text-sm font-medium'>{displayText}</span>
                    </div>
                    {displayValue && <span className='text-sm text-gray-600'>{displayValue}</span>}
                  </div>
                );
              })}
              {listData.length === 0 && (
                <div className='py-8 text-center text-gray-500'>暫無列表項目</div>
              )}
            </div>
          </div>
        );

      case 'history-tree':
        return renderLazyComponent('HistoryTreeV2', createWidgetProps(data));

      case 'analysis':
        return renderLazyComponent('AnalysisExpandableCards', createWidgetProps(data));

      default:
        return createErrorFallback(`Unknown list type: ${config.type}`);
    }
  } catch (err) {
    console.error('ListWidgetRenderer error:', err);
    return createErrorFallback(
      config.type,
      err instanceof Error ? (err as { message: string }).message : 'Unknown error'
    );
  }
};
