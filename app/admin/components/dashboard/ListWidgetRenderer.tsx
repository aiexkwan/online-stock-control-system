/**
 * List Widget Renderer
 * 處理所有列表和表格類型的 Widget 渲染  
 */

'use client';

import React from 'react';
import { DatabaseRecord } from '@/lib/types/database';
import { 
  BaseWidgetRendererProps,
  createErrorFallback,
  getComponentPropsFactory 
} from './widget-renderer-shared';
import {
  DocumentArrowDownIcon,
  TruckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export const ListWidgetRenderer: React.FC<BaseWidgetRendererProps> = ({
  config,
  theme,
  timeFrame,
  data,
  loading,
  error,
  renderLazyComponent
}) => {
  const getComponentProps = getComponentPropsFactory(config, timeFrame, theme);
  
  if (loading) {
    return <div>Loading list...</div>;
  }
  
  if (error) {
    return createErrorFallback(config.type, error);
  }

  try {
    switch (config.type) {
      case 'OrderStateListWidget':
        return renderLazyComponent('OrderStateListWidgetV2', getComponentProps(data));
        
      case 'WarehouseTransferListWidget':
        return renderLazyComponent('WarehouseTransferListWidget', getComponentProps(data));
        
      case 'StockInventoryTable':
        return renderLazyComponent('StockInventoryTable', getComponentProps(data));
        
      case 'orders-list':
        return renderLazyComponent('OrdersListWidgetV2', getComponentProps(data));
        
      case 'other-files-list':
        return renderLazyComponent('OtherFilesListWidgetV2', getComponentProps(data));
        
      case 'activity-feed':
        return (
          <div className="h-full w-full p-4">
            <h3 className="mb-4 text-lg font-semibold">活動動態</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {(data || []).map((item: DatabaseRecord, index: number) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <TruckIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{item.title || `活動 ${index + 1}`}</p>
                    <p className="text-xs text-gray-500">{item.description || '詳細描述'}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.time || '剛剛'}</p>
                  </div>
                </div>
              ))}
              {(!data || data.length === 0) && (
                <div className="text-center text-gray-500 py-8">
                  暫無活動記錄
                </div>
              )}
            </div>
          </div>
        );
        
      case 'table':
        // 通用表格處理
        const tableData = data || [];
        const columns = config.metrics || ['name', 'value'];
        
        return (
          <div className="h-full w-full p-4">
            <h3 className="mb-4 text-lg font-semibold">{config.title || '數據表格'}</h3>
            <div className="overflow-auto max-h-80">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    {columns.map((col: string) => (
                      <th key={col} className="px-3 py-2 text-left font-medium text-gray-900">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row: DatabaseRecord, index: number) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      {columns.map((col: string) => (
                        <td key={col} className="px-3 py-2 text-gray-600">
                          {row[col as string] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {tableData.length === 0 && (
                    <tr>
                      <td colSpan={columns.length} className="px-3 py-8 text-center text-gray-500">
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
        const listData = data || [];
        
        return (
          <div className="h-full w-full p-4">
            <h3 className="mb-4 text-lg font-semibold">{config.title || '數據列表'}</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {listData.map((item: DatabaseRecord, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <div className="flex items-center space-x-3">
                    <DocumentArrowDownIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">
                      {typeof item === 'object' ? (item.name || item.title || `項目 ${index + 1}`) : item}
                    </span>
                  </div>
                  {typeof item === 'object' && item.value && (
                    <span className="text-sm text-gray-600">{item.value}</span>
                  )}
                </div>
              ))}
              {listData.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  暫無列表項目
                </div>
              )}
            </div>
          </div>
        );
        
      default:
        return createErrorFallback(`Unknown list type: ${config.type}`);
    }
  } catch (err) {
    console.error('ListWidgetRenderer error:', err);
    return createErrorFallback(config.type, err instanceof Error ? (err as { message: string }).message : 'Unknown error');
  }
};