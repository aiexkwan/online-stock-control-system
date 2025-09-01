'use client';

import React from 'react';
import { Calendar, Package, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface QuickActionsProps {
  /** 發送消息回調 */
  onSendMessage: (message: string) => void;
  /** 顯示變體 - 完整版或精簡版 */
  variant?: 'full' | 'compact';
  /** 自定義className */
  className?: string;
}

// 快速操作按鈕配置
const quickActionButtons = [
  {
    id: 'today-summary',
    label: "Today's Summary",
    icon: Calendar,
    query: "Show today's summary",
  },
  {
    id: 'await-status',
    label: 'Await Status',
    icon: Package,
    query: 'Show current Await pallets',
  },
  {
    id: 'pending-shipments',
    label: 'Pending Shipments',
    icon: Truck,
    query: 'Show pending shipments',
  },
];

/**
 * QuickActions 組件 - 快速操作按鈕
 *
 * 職責：
 * - 獨立快速操作按鈕組件
 * - 實現快速查詢功能
 * - 保持使用者體驗的即時性
 * - 支援不同顯示變體
 */
export const QuickActions: React.FC<QuickActionsProps> = ({
  onSendMessage,
  variant = 'full',
  className,
}) => {
  const handleQuickAction = (query: string) => {
    onSendMessage(query);
  };

  const buttonStyle = cn(
    'border-none bg-white/10 text-xs text-white hover:bg-white/20',
    variant === 'compact' ? 'h-8 px-3' : 'px-4 py-2'
  );

  const containerStyle = cn('flex flex-wrap gap-2', variant === 'full' ? 'pt-2' : '', className);

  return (
    <div className={containerStyle}>
      {quickActionButtons.map(({ id, label, icon: Icon, query }) => (
        <Button
          key={id}
          variant='outline'
          size='sm'
          onClick={() => handleQuickAction(query)}
          className={buttonStyle}
          title={`Quick query: ${query}`}
        >
          <Icon className='mr-1 h-3 w-3' />
          {label}
        </Button>
      ))}
    </div>
  );
};

export default QuickActions;
