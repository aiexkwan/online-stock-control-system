/**
 * Product Done History Widget
 * Shows history of completed products in a table
 */

'use client';

import React, { useState } from 'react';
import { BaseWidget, WidgetLayouts } from '../../widgets/BaseWidget';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { useWidgetData } from '@/app/admin/hooks/useWidgetData';
import { createClient } from '@/app/utils/supabase/client';
import { format } from 'date-fns';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface ProductHistory {
  records: Array<{
    date: string;
    productCode: string;
    quantity: number;
    status: 'completed' | 'pending' | 'cancelled';
  }>;
  totalQuantity: number;
}

export const ProductDoneHistoryWidget = React.memo(function ProductDoneHistoryWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [sortBy, setSortBy] = useState<'date' | 'productCode' | 'quantity'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProductHistory>({
    records: [],
    totalQuantity: 0
  });

  const loadHistoryData = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      
      // Mock data for demonstration
      const mockData = Array.from({ length: 20 }, (_, i) => ({
        date: format(new Date(Date.now() - i * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        productCode: `PRD${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
        quantity: Math.floor(Math.random() * 500) + 100,
        status: Math.random() > 0.1 ? 'completed' : Math.random() > 0.5 ? 'pending' : 'cancelled' as any
      }));
      
      const totalQuantity = mockData
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + r.quantity, 0);
      
      setData({ records: mockData, totalQuantity });
    } catch (err) {
      setError('Failed to load history data');
    } finally {
      setLoading(false);
    }
  };

  useWidgetData({
    loadFunction: loadHistoryData,
    dependencies: [],
    isEditMode
  });

  const sortedData = [...data.records].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    const modifier = sortOrder === 'asc' ? 1 : -1;
    
    if (typeof aVal === 'string') {
      return aVal.localeCompare(bVal as string) * modifier;
    }
    return ((aVal as number) - (bVal as number)) * modifier;
  });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ column }: { column: typeof sortBy }) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' 
      ? <ArrowUpIcon className="w-3 h-3 inline ml-1" />
      : <ArrowDownIcon className="w-3 h-3 inline ml-1" />;
  };

  return (
    <BaseWidget
      title="Product Done History"
      subtitle={`Total: ${data.totalQuantity.toLocaleString()} units`}
      theme="production"
    >
      <WidgetLayouts.FullTable>
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
          </div>
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center text-red-400">
            Error loading data
          </div>
        ) : (
          <div className="w-full h-full overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#18181C] z-10">
                <tr className="border-b border-[#23232A]/30">
                  <th 
                    className="text-left py-3 px-2 text-[#8E8EA0] cursor-pointer hover:text-[#EAEAEA]"
                    onClick={() => handleSort('date')}
                  >
                    Date <SortIcon column="date" />
                  </th>
                  <th 
                    className="text-left py-3 px-2 text-[#8E8EA0] cursor-pointer hover:text-[#EAEAEA]"
                    onClick={() => handleSort('productCode')}
                  >
                    Product Code <SortIcon column="productCode" />
                  </th>
                  <th 
                    className="text-right py-3 px-2 text-[#8E8EA0] cursor-pointer hover:text-[#EAEAEA]"
                    onClick={() => handleSort('quantity')}
                  >
                    Qty <SortIcon column="quantity" />
                  </th>
                  <th className="text-center py-3 px-2 text-[#8E8EA0]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((record, index) => (
                  <tr 
                    key={index} 
                    className="border-b border-[#23232A]/20 hover:bg-[#22222A]/50 transition-colors"
                  >
                    <td className="py-2 px-2 text-[#EAEAEA]">
                      {format(new Date(record.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-2 px-2 text-[#EAEAEA] font-mono">
                      {record.productCode}
                    </td>
                    <td className="py-2 px-2 text-right text-[#EAEAEA]">
                      {record.quantity.toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className={`
                        inline-block px-2 py-1 rounded-full text-xs font-medium
                        ${record.status === 'completed' ? 'bg-green-500/20 text-green-400' : ''}
                        ${record.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                        ${record.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : ''}
                      `}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </WidgetLayouts.FullTable>
    </BaseWidget>
  );
});