import React from 'react';
import { UnifiedSearch } from '@/components/ui/unified-search';
import { CARD_STYLES, TEXT_STYLES } from '../constants/styles';

// 策略2: DTO/自定義 type interface - 統一 SearchResult 類型
interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  metadata?: string;
  data: Array<Record<string, unknown>>;
}

interface PalletSearchSectionProps {
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onSearchSelect: (result: SearchResult) => void;
  isLoading: boolean;
  searchInputRef?: React.RefObject<HTMLInputElement>;
  disabled?: boolean;
  disabledMessage?: string;
}

/**
 * 托盤搜尋區域組件
 * 負責處理托盤搜尋輸入和顯示
 */
export const PalletSearchSection: React.FC<PalletSearchSectionProps> = ({
  searchValue,
  onSearchValueChange,
  onSearchSelect,
  isLoading,
  searchInputRef,
  disabled = false,
  disabledMessage = 'Please select destination and verify operator first',
}) => {
  return (
    <div className={CARD_STYLES.wrapper}>
      {/* 卡片背景 */}
      <div className={CARD_STYLES.backgroundBlur}></div>

      <div className={CARD_STYLES.card}>
        {/* 卡片內部光效 */}
        <div className={CARD_STYLES.hoverGradient}></div>

        {/* 頂部邊框光效 */}
        <div className={CARD_STYLES.topBorder}></div>

        <div className={CARD_STYLES.content}>
          <div className='mb-6 flex items-center justify-between'>
            <h2 className={TEXT_STYLES.sectionTitle}>Pallet Search</h2>
          </div>

          {disabled && (
            <div className='mb-4 rounded-lg border border-yellow-700 bg-yellow-900/20 p-4'>
              <p className='flex items-center gap-2 text-sm text-yellow-400'>
                <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                  />
                </svg>
                {disabledMessage}
              </p>
            </div>
          )}

          <UnifiedSearch
            ref={searchInputRef}
            searchType='pallet'
            placeholder='Enter pallet number or series - auto-detection enabled'
            onSelect={onSearchSelect}
            value={searchValue}
            onChange={onSearchValueChange}
            isLoading={isLoading}
            disabled={disabled || isLoading}
            enableAutoDetection={true}
            aria-label='Search for pallet by number or series'
            aria-describedby='pallet-search-help'
          />

          <span id='pallet-search-help' className='sr-only'>
            Enter a pallet number in format 240615/1 or a series code like PM-240615
          </span>
        </div>
      </div>
    </div>
  );
};
