/**
 * A/B Testing React Hook
 * 便於在組件中使用 A/B 測試
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { abTestManager } from './ABTestManager';

interface UseABTestOptions {
  testId: string;
  userId: string;
  autoTrack?: boolean; // 自動追蹤組件載入事件
}

interface UseABTestResult {
  variant: string | null;
  isLoading: boolean;
  recordEvent: (eventType: string, metadata?: Record<string, any>) => void;
  isVariant: (variantId: string) => boolean;
}

/**
 * A/B 測試 Hook
 */
export function useABTest({
  testId,
  userId,
  autoTrack = true
}: UseABTestOptions): UseABTestResult {
  const [variant, setVariant] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const assignedVariant = abTestManager.getVariant(testId, userId);
    setVariant(assignedVariant);
    setIsLoading(false);

    // 自動追蹤組件載入
    if (autoTrack && assignedVariant) {
      abTestManager.recordEvent(testId, userId, 'component_loaded', {
        component: 'unknown',
        timestamp: Date.now()
      });
    }
  }, [testId, userId, autoTrack]);

  const recordEvent = useCallback((eventType: string, metadata?: Record<string, any>) => {
    abTestManager.recordEvent(testId, userId, eventType, metadata);
  }, [testId, userId]);

  const isVariant = useCallback((variantId: string) => {
    return variant === variantId;
  }, [variant]);

  return {
    variant,
    isLoading,
    recordEvent,
    isVariant
  };
}

/**
 * Feature Flag Hook (簡化版 A/B 測試)
 */
export function useFeatureFlag(featureId: string, userId: string): {
  enabled: boolean;
  isLoading: boolean;
} {
  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isEnabled = abTestManager.isFeatureEnabled(featureId, userId);
    setEnabled(isEnabled);
    setIsLoading(false);
  }, [featureId, userId]);

  return { enabled, isLoading };
}

/**
 * Widget → Card 遷移專用 Hook
 */
interface UseWidgetMigrationOptions {
  widgetId: string;
  userId: string;
  onCardRender?: () => void;
  onWidgetRender?: () => void;
}

export function useWidgetMigration({
  widgetId,
  userId,
  onCardRender,
  onWidgetRender
}: UseWidgetMigrationOptions): {
  useCard: boolean;
  isLoading: boolean;
  recordInteraction: (action: string, metadata?: Record<string, any>) => void;
} {
  const testId = `widget-migration-${widgetId}`;
  const { variant, isLoading, recordEvent } = useABTest({
    testId,
    userId,
    autoTrack: true
  });

  const useCard = variant === 'card';

  useEffect(() => {
    if (!isLoading) {
      if (useCard) {
        onCardRender?.();
        recordEvent('card_rendered', { widgetId });
      } else {
        onWidgetRender?.();
        recordEvent('widget_rendered', { widgetId });
      }
    }
  }, [useCard, isLoading, widgetId, recordEvent, onCardRender, onWidgetRender]);

  const recordInteraction = useCallback((action: string, metadata?: Record<string, any>) => {
    recordEvent(action, {
      ...metadata,
      widgetId,
      componentType: useCard ? 'card' : 'widget'
    });
  }, [recordEvent, widgetId, useCard]);

  return {
    useCard,
    isLoading,
    recordInteraction
  };
}