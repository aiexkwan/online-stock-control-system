'use client';

import React from 'react';
import { Package, ClipboardList, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cardTextStyles } from '@/lib/card-system/theme';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface SuggestionCategory {
  category: string;
  icon: React.ReactNode;
  queries: string[];
}

export interface SuggestionCategoriesProps {
  /** 選中的分類 */
  selectedCategory: string | null;
  /** 分類選擇回調 */
  onCategorySelect: (category: string | null) => void;
  /** 發送消息回調 */
  onSendMessage: (message: string) => void;
  /** 自定義className */
  className?: string;
}

// 查詢建議分類數據
const suggestionCategories: SuggestionCategory[] = [
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
];

/**
 * SuggestionCategories 組件 - 建議分類展示
 *
 * 職責：
 * - 分離建議分類的展示和交互
 * - 實現分類展開/收縮邏輯
 * - 保持現有的查詢類別結構
 * - 提供清晰的分類界面
 */
export const SuggestionCategories: React.FC<SuggestionCategoriesProps> = ({
  selectedCategory,
  onCategorySelect,
  onSendMessage,
  className,
}) => {
  const handleCategoryClick = (category: string) => {
    onCategorySelect(selectedCategory === category ? null : category);
  };

  const handleQueryClick = (e: React.MouseEvent, query: string) => {
    e.stopPropagation();
    onSendMessage(query);
  };

  return (
    <div className={cn('grid grid-cols-1 gap-3 md:grid-cols-2', className)}>
      {suggestionCategories.map(cat => (
        <Card
          key={cat.category}
          className='cursor-pointer border-none bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10'
          onClick={() => handleCategoryClick(cat.category)}
        >
          <div className='p-3'>
            <h3 className='mb-2 flex items-center gap-2 font-medium text-white'>
              {cat.icon}
              {cat.category}
              {selectedCategory === cat.category ? (
                <ChevronUp className='ml-auto h-4 w-4' />
              ) : (
                <ChevronDown className='ml-auto h-4 w-4' />
              )}
            </h3>

            {selectedCategory === cat.category && (
              <div className='mt-3 space-y-1'>
                {cat.queries.map((query, index) => (
                  <Button
                    key={index}
                    variant='ghost'
                    size='sm'
                    onClick={e => handleQueryClick(e, query)}
                    className='w-full justify-start rounded border-none bg-white/10 px-3 py-2 text-left text-sm text-white transition-all hover:bg-white/20'
                  >
                    {query}
                  </Button>
                ))}
              </div>
            )}

            {selectedCategory !== cat.category && (
              <p className={cn(cardTextStyles.labelSmall, 'text-slate-400')}>
                Click to view {cat.queries.length} suggestions
              </p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default SuggestionCategories;
