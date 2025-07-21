import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Package,
  ClipboardList,
  TrendingUp,
  AlertCircle,
  Search,
  Calendar,
  Truck,
  Database,
} from 'lucide-react';
import { AnomalyDetectionButton } from './AnomalyDetectionButton';
import { useAuth } from '@/app/hooks/useAuth';

interface QuerySuggestionsProps {
  onSelect: (query: string) => void;
  currentContext?: string;
  recentQueries?: string[];
}

interface SuggestionCategory {
  category: string;
  icon: React.ReactNode;
  queries: string[];
}

export function QuerySuggestions({
  onSelect,
  currentContext,
  recentQueries = [],
}: QuerySuggestionsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { user } = useAuth();

  // 檢查是否有 Anomaly Detection 權限
  const hasAnomalyDetectionAccess = user?.email === 'akwan@pennineindustries.com';

  // 基於實際業務嘅常用查詢
  const allSuggestions: SuggestionCategory[] = [
    {
      category: 'Real-time Inventory',
      icon: <Package className='h-4 w-4' />,
      queries: [
        'Show all pallets in Await location',
        'What is the total stock for product code MH001?',
        'How many pallets arrived today?',
        'Which warehouse has the most available space?',
        'Show products with stock below 100 units',
        'List all pallets that have been in Await for more than 7 days',
      ],
    },
    {
      category: 'Order Status',
      icon: <ClipboardList className='h-4 w-4' />,
      queries: [
        'Show all pending orders',
        'How many items need to be shipped today?',
        'What is the status of order REF001?',
        'Show all unprocessed ACO orders',
        'List orders that are overdue',
        'Which orders are partially loaded?',
      ],
    },
    {
      category: 'Efficiency Analysis',
      icon: <TrendingUp className='h-4 w-4' />,
      queries: [
        'How many pallets were produced today?',
        'Show monthly shipping statistics',
        'What is the average transfer time?',
        'Show work level by department today',
        'Compare this week vs last week production',
        'Show most active products today',
      ],
    },
    {
      category: 'Anomaly Detection',
      icon: <AlertCircle className='h-4 w-4' />,
      queries: [
        'Show pallets that have not moved for 30 days',
        'Find duplicate pallet numbers',
        'Show products with inventory discrepancies',
        'List any errors recorded today',
        'Show pallets with missing information',
        'Find orders without customer details',
      ],
    },
  ];

  // 根據權限過濾建議分類
  const suggestions = hasAnomalyDetectionAccess
    ? allSuggestions
    : allSuggestions.filter(cat => cat.category !== 'Anomaly Detection');

  // 基於上下文嘅動態建議
  const contextualSuggestions = useMemo(() => {
    if (!currentContext) return [];

    const suggestions: string[] = [];

    // 分析上下文並生成相關建議
    if (
      currentContext.toLowerCase().includes('stock') ||
      currentContext.toLowerCase().includes('inventory')
    ) {
      suggestions.push(
        'Show stock movement history for this product',
        'Compare current stock with last month',
        'Show location distribution for this product'
      );
    }

    if (currentContext.toLowerCase().includes('order')) {
      suggestions.push(
        'Show all items in this order',
        'Check loading progress for this order',
        'Show similar orders from the same customer'
      );
    }

    if (currentContext.toLowerCase().includes('pallet')) {
      suggestions.push(
        'Show movement history for this pallet',
        'Find pallets with the same product',
        'Check QC status for this pallet'
      );
    }

    return suggestions;
  }, [currentContext]);

  // 最近查詢（去重）
  const uniqueRecentQueries = useMemo(() => {
    return Array.from(new Set(recentQueries)).slice(0, 5);
  }, [recentQueries]);

  return (
    <div className='space-y-4'>
      {/* 最近查詢 */}
      {uniqueRecentQueries.length > 0 && (
        <div className='rounded-lg border border-slate-700 bg-slate-800 p-4'>
          <h3 className='mb-3 flex items-center gap-2 text-sm font-medium text-slate-300'>
            <Calendar className='h-4 w-4' />
            Recent Queries
          </h3>
          <div className='space-y-1'>
            {uniqueRecentQueries.map((query, index) => (
              <Button
                key={index}
                variant='ghost'
                size='sm'
                onClick={() => onSelect(query)}
                className='w-full justify-start rounded border border-slate-600 bg-slate-700 text-left text-white transition-all hover:bg-slate-600'
              >
                <Search className='mr-2 h-3 w-3 opacity-50' />
                {query}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 上下文建議 */}
      {contextualSuggestions.length > 0 && (
        <div className='rounded-lg border border-blue-600 bg-blue-900/50 p-4'>
          <h3 className='mb-3 flex items-center gap-2 text-sm font-medium text-blue-300'>
            <Database className='h-4 w-4' />
            Related Queries
          </h3>
          <div className='space-y-1'>
            {contextualSuggestions.map((query, index) => (
              <Button
                key={index}
                variant='ghost'
                size='sm'
                onClick={() => onSelect(query)}
                className='w-full justify-start rounded border border-blue-600 bg-blue-700 text-left text-white transition-all hover:bg-blue-600'
              >
                {query}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 分類建議 */}
      <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
        {suggestions.map(cat => (
          <Card
            key={cat.category}
            className='cursor-pointer border border-slate-600 bg-slate-800 transition-all hover:border-purple-500/50'
            onClick={() =>
              setSelectedCategory(selectedCategory === cat.category ? null : cat.category)
            }
          >
            <div className='p-3'>
              <h3 className='mb-2 flex items-center gap-2 font-medium text-white'>
                {cat.icon}
                {cat.category}
              </h3>

              {selectedCategory === cat.category && (
                <div className='mt-3 space-y-1'>
                  {cat.queries.map((query, index) => (
                    <Button
                      key={index}
                      variant='ghost'
                      size='sm'
                      onClick={e => {
                        e.stopPropagation();
                        onSelect(query);
                      }}
                      className='w-full justify-start rounded border border-slate-600 bg-slate-700 px-3 py-2 text-left text-sm text-white transition-all hover:bg-slate-600'
                    >
                      {query}
                    </Button>
                  ))}
                </div>
              )}

              {selectedCategory !== cat.category && (
                <p className='text-xs text-slate-400'>
                  Click to view {cat.queries.length} suggestions
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* 快速操作 */}
      <div className='flex flex-wrap gap-2 pt-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => onSelect("Show today's summary")}
          className='border-slate-600 bg-slate-700 text-xs text-white hover:border-slate-500 hover:bg-slate-600'
        >
          <Calendar className='mr-1 h-3 w-3' />
          Today&apos;s Summary
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={() => onSelect('Show current Await pallets')}
          className='border-slate-600 bg-slate-700 text-xs text-white hover:border-slate-500 hover:bg-slate-600'
        >
          <Package className='mr-1 h-3 w-3' />
          Await Status
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={() => onSelect('Show pending shipments')}
          className='border-slate-600 bg-slate-700 text-xs text-white hover:border-slate-500 hover:bg-slate-600'
        >
          <Truck className='mr-1 h-3 w-3' />
          Pending Shipments
        </Button>
      </div>

      {/* 異常檢測 - 只有授權用戶可見 */}
      {hasAnomalyDetectionAccess && (
        <div className='mt-4'>
          <AnomalyDetectionButton className='w-full' />
        </div>
      )}
    </div>
  );
}
