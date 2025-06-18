/**
 * Finished Product Widget
 * 支援三種尺寸：
 * - Small (1x1): 只顯示選定時間範圍的finished product總板數
 * - Medium (3x3): 顯示選定時間範圍頭5的product code及各自總板數
 * - Large (5x5): 顯示選定時間範圍頭5的product code、總板數及總qty
 */

'use client';

import React from 'react';
import { CardContent } from '@/components/ui/card';
import { WidgetCard } from '../WidgetCard';
import { CubeIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import FinishedProduct from '@/app/components/PrintHistory';

export function FinishedProductWidget({ widget, isEditMode }: WidgetComponentProps) {
  const size = widget.config.size || WidgetSize.SMALL;

  // All sizes render the same component with different display modes
  return (
    <WidgetCard widgetType="FINISHED_PRODUCT" isEditMode={isEditMode}>
      <CardContent className={`h-full ${size === WidgetSize.SMALL ? 'p-2' : 'p-3'}`}>
        <FinishedProduct widgetSize={size} />
      </CardContent>
    </WidgetCard>
  );
}