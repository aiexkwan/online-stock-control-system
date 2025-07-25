/**
 * Card Migration Wrapper
 * 
 * 使用 Feature Flag 控制 Widget 到 Card 的遷移
 * 
 * @created 2025-07-25
 */

'use client';

import React, { Suspense } from 'react';
import { useFeatureFlag } from '@/lib/feature-flags';
import { shouldUseCard } from '@/lib/feature-flags/configs/cards-migration';
import { BrowserPerformanceCollector } from '@/lib/monitoring/cards-migration-monitor';

interface CardMigrationWrapperProps {
  cardType: string;
  cardId: string;
  userId?: string;
  children: React.ReactNode; // Widget 組件
  cardComponent: React.ComponentType<any>; // Card 組件
  cardProps?: Record<string, any>;
  fallbackComponent?: React.ComponentType<any>;
}

/**
 * Card Migration Wrapper Component
 * 
 * 根據 Feature Flag 決定是否使用新的 Card 組件或舊的 Widget 組件
 */
export const CardMigrationWrapper: React.FC<CardMigrationWrapperProps> = ({
  cardType,
  cardId,
  userId,
  children,
  cardComponent: CardComponent,
  cardProps = {},
  fallbackComponent: FallbackComponent,
}) => {
  // 檢查是否啟用 Cards 系統
  const useCardsSystem = useFeatureFlag('use_cards_system');
  
  // 檢查特定 Card 是否啟用
  const shouldUseSpecificCard = userId ? shouldUseCard(cardType, userId) : false;
  
  // 決定使用哪個組件
  const shouldRenderCard = useCardsSystem && shouldUseSpecificCard;

  React.useEffect(() => {
    // 記錄 Feature Flag 使用情況
    console.log('CardMigrationWrapper:', {
      cardType,
      cardId,
      userId,
      useCardsSystem,
      shouldUseSpecificCard,
      shouldRenderCard,
    });
  }, [cardType, cardId, userId, useCardsSystem, shouldUseSpecificCard, shouldRenderCard]);

  if (shouldRenderCard) {
    return (
      <Suspense fallback={<CardLoadingFallback cardType={cardType} />}>
        <PerformanceWrapper cardType={cardType} cardId={cardId}>
          <CardComponent {...cardProps} />
        </PerformanceWrapper>
      </Suspense>
    );
  }

  // 如果有 Fallback 組件，使用它；否則使用原始的 Widget
  if (FallbackComponent) {
    return <FallbackComponent {...cardProps} />;
  }

  return (
    <PerformanceWrapper cardType={`widget-${cardType}`} cardId={cardId}>
      {children}
    </PerformanceWrapper>
  );
};

/**
 * Performance Wrapper - 測量組件渲染性能
 */
const PerformanceWrapper: React.FC<{
  cardType: string;
  cardId: string;
  children: React.ReactNode;
}> = ({ cardType, cardId, children }) => {
  const performanceCollector = React.useMemo(() => new BrowserPerformanceCollector(), []);

  React.useEffect(() => {
    // 標記渲染開始
    performanceCollector.markCardRenderStart(cardType, cardId);

    return () => {
      // 標記渲染結束
      const duration = performanceCollector.markCardRenderEnd(cardType, cardId);
      
      // 記錄性能數據
      if (duration > 0) {
        console.log(`${cardType}-${cardId} render time: ${duration.toFixed(2)}ms`);
        
        // 如果渲染時間過長，發出警告
        if (duration > 200) {
          console.warn(`⚠️ Slow render detected: ${cardType}-${cardId} took ${duration.toFixed(2)}ms`);
        }
      }
    };
  }, [cardType, cardId, performanceCollector]);

  return <>{children}</>;
};

/**
 * Card Loading Fallback
 */
const CardLoadingFallback: React.FC<{ cardType: string }> = ({ cardType }) => (
  <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
      <svg
        className="animate-spin h-5 w-5"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span>Loading {cardType} card...</span>
    </div>
  </div>
);

/**
 * Higher-Order Component for automatic Card migration
 */
export function withCardMigration<P extends Record<string, any>>(
  cardType: string,
  CardComponent: React.ComponentType<P>,
  WidgetComponent: React.ComponentType<P>
) {
  return function MigratedComponent(props: P & { userId?: string }) {
    const { userId, ...componentProps } = props;
    
    return (
      <CardMigrationWrapper
        cardType={cardType}
        cardId={`${cardType}-${Math.random().toString(36).substr(2, 9)}`}
        userId={userId}
        cardComponent={CardComponent}
        cardProps={componentProps}
      >
        <WidgetComponent {...(componentProps as P)} />
      </CardMigrationWrapper>
    );
  };
}

/**
 * Hook for Card migration logic
 */
export function useCardMigration(cardType: string, userId?: string) {
  const useCardsSystem = useFeatureFlag('use_cards_system');
  const shouldUseSpecificCard = userId ? shouldUseCard(cardType, userId) : false;
  
  return {
    shouldUseCard: useCardsSystem && shouldUseSpecificCard,
    useCardsSystem,
    shouldUseSpecificCard,
  };
}

/**
 * Migration Status Component - 顯示當前遷移狀態
 */
export const MigrationStatus: React.FC<{ cardType: string; userId?: string }> = ({
  cardType,
  userId,
}) => {
  const { shouldUseCard, useCardsSystem, shouldUseSpecificCard } = useCardMigration(cardType, userId);

  if (process.env.NODE_ENV !== 'development') {
    return null; // 只在開發環境顯示
  }

  return (
    <div className="fixed bottom-4 right-4 bg-blue-100 dark:bg-blue-900 p-2 rounded text-xs">
      <div className="font-semibold">Migration Status: {cardType}</div>
      <div>Cards System: {useCardsSystem ? '✅' : '❌'}</div>
      <div>Specific Card: {shouldUseSpecificCard ? '✅' : '❌'}</div>
      <div>Using: {shouldUseCard ? 'Card' : 'Widget'}</div>
    </div>
  );
};

export default CardMigrationWrapper;