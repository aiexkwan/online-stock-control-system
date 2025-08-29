'use client';

import React, { useMemo } from 'react';
import { ClipboardDocumentListIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { DataCard } from '@/lib/card-system/EnhancedGlassmorphicCard';
import {
  getCardTheme,
  cardTextStyles,
  cardStatusColors,
  // cardContainerStyles, // Removed - not used
} from '@/lib/card-system/theme';
import { cn } from '@/lib/utils';
import { useStockCount } from '../hooks/useStockCount';
import StockCountForm from './components/StockCountForm';
import StockCountResult from './components/StockCountResult';
import StockCountErrorBoundary from './components/StockCountErrorBoundary';

export interface StockCountCardProps {
  className?: string;
  compact?: boolean; // Support different card sizes
}

export const StockCountCard: React.FC<StockCountCardProps> = ({ className, compact = false }) => {
  const {
    state,
    countData,
    countedQuantity,
    isLoading,
    error,
    mode,
    setMode,
    setCountedQuantity,
    handleFormSubmit,
    handleQuantitySubmit,
    handleReset,
    clearError,
  } = useStockCount();

  // Determine if card is in compact mode based on className
  const isCompactMode = useMemo(() => {
    return compact || (className && className.includes('h-64')) || false;
  }, [className, compact]);

  return (
    <div className={`h-full ${className || ''}`}>
      <DataCard
        variant='glass'
        isHoverable={false}
        borderGlow={false}
        className='h-full overflow-hidden'
      >
        <StockCountErrorBoundary>
          <div className='flex h-full flex-col'>
            {/* Header */}
            <div className={cn('border-b p-4', getCardTheme('operation').border)}>
              <div className='flex items-center justify-between'>
                <div className='flex items-center'>
                  <ClipboardDocumentListIcon
                    className={cn('mr-2 h-5 w-5', getCardTheme('operation').icon)}
                  />
                  <h2 className={cardTextStyles.title}>Stock Count</h2>
                </div>
                {state === 'result' && (
                  <span
                    className={cn(
                      'rounded-full px-2 py-1',
                      cardTextStyles.labelSmall,
                      cardStatusColors.online.bg,
                      cardStatusColors.online.text
                    )}
                  >
                    Completed
                  </span>
                )}
                {state === 'input' && (
                  <span
                    className={cn(
                      'rounded-full px-2 py-1',
                      cardTextStyles.labelSmall,
                      cardStatusColors.warning.bg,
                      cardStatusColors.warning.text
                    )}
                  >
                    In Progress
                  </span>
                )}
              </div>
              {!isCompactMode && (
                <p className={cn('mt-1', cardTextStyles.subtitle)}>
                  Perform stock counting and inventory checks
                </p>
              )}
            </div>

            {/* Content Area */}
            <div className='flex-1 overflow-y-auto p-4'>
              {/* Error Display */}
              {error && (
                <div
                  className={cn(
                    'mb-4 rounded-lg border p-3',
                    cardStatusColors.error.bg,
                    cardStatusColors.error.border
                  )}
                >
                  <div className='flex items-start'>
                    <ExclamationTriangleIcon
                      className={cn('mr-2 h-5 w-5 flex-shrink-0', cardStatusColors.error.text)}
                    />
                    <div className='flex-1'>
                      <p className={cn(cardTextStyles.bodySmall, cardStatusColors.error.text)}>
                        {error}
                      </p>
                      <button
                        onClick={clearError}
                        className={cn(
                          'mt-1 hover:opacity-80',
                          cardTextStyles.labelSmall,
                          cardStatusColors.error.text
                        )}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Form State */}
              {state === 'form' && (
                <StockCountForm
                  mode={mode}
                  onModeChange={setMode}
                  onSubmit={handleFormSubmit}
                  isLoading={isLoading}
                  compact={isCompactMode}
                />
              )}

              {/* Input/Result State */}
              {(state === 'input' || state === 'result') && countData && (
                <StockCountResult
                  data={countData}
                  countedQuantity={countedQuantity}
                  onQuantityChange={setCountedQuantity}
                  onQuantitySubmit={handleQuantitySubmit}
                  onReset={handleReset}
                  isLoading={isLoading}
                  compact={isCompactMode}
                />
              )}
            </div>

            {/* Footer Status Bar (optional) */}
            {!isCompactMode && isLoading && (
              <div
                className={cn(
                  'border-t bg-slate-900/50 px-4 py-2',
                  getCardTheme('operation').border
                )}
              >
                <div className='flex items-center justify-center'>
                  <div
                    className={cn(
                      'mr-2 h-3 w-3 animate-spin rounded-full border-2 border-t-transparent',
                      'border-blue-400'
                    )}
                  />
                  <p className={cn(cardTextStyles.labelSmall, 'text-slate-400')}>Processing...</p>
                </div>
              </div>
            )}
          </div>
        </StockCountErrorBoundary>
      </DataCard>
    </div>
  );
};

export default StockCountCard;
