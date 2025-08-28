'use client';

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { OperationCard } from '@/lib/card-system/EnhancedGlassmorphicCard';
import { StatusMessage } from '@/components/ui/universal-stock-movement-layout';
import { Input } from '@/components/ui/input';
import { SearchInput, SearchInputRef, FormInputGroup, FormOption } from '../components/shared';
import { getCardTheme, cardTextStyles, cardStatusColors } from '@/lib/card-system/theme';
import { cn } from '@/lib/utils';
import { Loader2, Package, Package2, ArrowLeftRight, AlertTriangle } from 'lucide-react';
import { SoundSettingsToggle } from '@/app/(app)/order-loading/components/SoundSettingsToggle';
import { useSoundFeedback, useSoundSettings } from '@/app/hooks/useSoundFeedback';
import { LOCATION_DESTINATIONS, DESTINATION_CONFIG } from '../constants/stockTransfer';
import { useStockTransfer } from '../hooks/useStockTransfer';
import { LocationStandardizer } from '../utils/locationStandardizer';
import { getTransferHistory } from '@/app/actions/stockTransferActions';
import StockTransferErrorBoundary from './components/StockTransferErrorBoundary';

export interface StockTransferCardProps {
  className?: string;
}

// Import types
import type { TransferHistoryItem } from '@/app/actions/stockTransferActions';
import type { PalletInfo, SearchResult } from '../hooks/useStockTransfer';

// Error overlay component for illegal transfers
const ErrorOverlay: React.FC<{
  show: boolean;
  message: string;
  details: string;
  onConfirm: () => void;
}> = ({ show, message, details, onConfirm }) => {
  if (!show) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm'>
      <div
        className={cn(
          'relative w-full max-w-md rounded-lg border p-6 shadow-2xl',
          cardStatusColors.error.border,
          'bg-slate-900 shadow-red-500/20'
        )}
      >
        <div className='mb-4 flex items-center gap-3'>
          <AlertTriangle className='h-8 w-8 text-red-500' />
          <h2 className={cn('text-2xl font-bold', cardStatusColors.error.text)}>Error</h2>
        </div>
        <div className='space-y-3'>
          <p className={cn('text-lg font-medium', 'text-white')}>Reason: {message}</p>
          <p className='text-base text-gray-300'>Details: {details}</p>
        </div>
        <button
          onClick={onConfirm}
          className='mt-6 w-full rounded-lg bg-red-600 px-4 py-3 font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500'
        >
          Confirm
        </button>
      </div>
    </div>
  );
};

// Optimized time formatter with caching
const formatTimeCache = new Map<string, string>();

const formatTime = (time: string): string => {
  if (!time) return '';

  if (formatTimeCache.has(time)) {
    return formatTimeCache.get(time)!;
  }

  const date = new Date(time);
  const formatted = date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Cache with size limit to prevent memory leaks
  if (formatTimeCache.size > 100) {
    const firstKey = formatTimeCache.keys().next().value;
    if (firstKey) formatTimeCache.delete(firstKey);
  }
  formatTimeCache.set(time, formatted);

  return formatted;
};

// Transfer log item component - Optimized with cached time formatting
const TransferLogItem: React.FC<{
  record: TransferHistoryItem;
}> = React.memo(({ record }) => {
  return (
    <div
      className={cn(
        'flex items-start space-x-2 rounded-lg border p-2',
        getCardTheme('operation').border,
        getCardTheme('operation').bg
      )}
    >
      <div className={cn('mt-2 h-2 w-2 flex-shrink-0 rounded-full', 'bg-blue-400')} />
      <div className='min-w-0 flex-1'>
        <div className='mb-1 flex items-center gap-2'>
          <span className='font-mono text-xs text-slate-400'>{formatTime(record.time)}</span>
          <span className='text-xs text-slate-500'>by {record.id}</span>
        </div>
        <p className='text-sm text-white'>
          {record.plt_num} → {record.loc}
          {record.remark && record.remark !== '-' && (
            <span className='ml-2 text-xs text-slate-400'>({record.remark})</span>
          )}
        </p>
      </div>
    </div>
  );
});

TransferLogItem.displayName = 'TransferLogItem';

// Optimized destination options cache with LocationStandardizer support
const destinationOptionsStdCache = new Map<string, FormOption[]>();

const getDestinationOptions = (currentLocation: string): FormOption[] => {
  if (!currentLocation) return [];

  if (destinationOptionsStdCache.has(currentLocation)) {
    return destinationOptionsStdCache.get(currentLocation)!;
  }

  // Use standardized location for consistent mapping
  const standardizedLocation = LocationStandardizer.standardizeForUI(currentLocation);
  const availableDestinations = LocationStandardizer.getValidDestinations(currentLocation);
  const filteredDestinations = availableDestinations.filter(dest => dest !== standardizedLocation);

  const options = filteredDestinations.map(destination => {
    const config = DESTINATION_CONFIG[destination as keyof typeof DESTINATION_CONFIG];
    return {
      value: destination,
      label: destination,
      icon: config?.icon || Package2,
      color: config?.color,
      bgColor: config?.bgColor,
      borderColor: config?.borderColor,
    };
  });

  // Cache with size limit to prevent memory leaks
  if (destinationOptionsStdCache.size > 50) {
    const firstKey = destinationOptionsStdCache.keys().next().value;
    if (firstKey) destinationOptionsStdCache.delete(firstKey);
  }
  destinationOptionsStdCache.set(currentLocation, options);

  return options;
};

// Destination selector component - Changed to horizontal layout
const TransferDestinationSelector: React.FC<{
  currentLocation: string;
  selectedDestination: string;
  onDestinationChange: (destination: string) => void;
  disabled?: boolean;
}> = ({ currentLocation, selectedDestination, onDestinationChange, disabled = false }) => {
  const destinationOptions = getDestinationOptions(currentLocation);

  if (destinationOptions.length === 0) {
    const debugInfo = LocationStandardizer.getLocationDebugInfo(currentLocation);
    return (
      <div className='text-xs text-red-400'>
        <div>⚠️ No valid destinations available</div>
        <div className='mt-1 text-xs text-gray-500'>
          Location: &quot;{debugInfo.original}&quot; → &quot;{debugInfo.standardized}&quot;
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className='mt-1 text-xs text-gray-600'>
            Debug: {JSON.stringify(debugInfo, null, 2)}
          </div>
        )}
      </div>
    );
  }

  return (
    <FormInputGroup
      type='radio'
      label='Select Destination'
      options={destinationOptions}
      value={selectedDestination}
      onChange={value => onDestinationChange(value as string)}
      disabled={disabled}
      size='sm'
      layout='horizontal'
      className='flex flex-wrap gap-2'
    />
  );
};

const StockTransferCardInternal: React.FC<StockTransferCardProps> = ({ className }) => {
  // Refs
  const searchInputRef = useRef<SearchInputRef>(null);
  const clockNumberRef = useRef<HTMLInputElement>(null);

  // Sound setup with cleanup tracking and safety checks
  const soundSettings = useSoundSettings();
  const soundEnabled = soundSettings?.getSoundEnabled?.() ?? false;
  const soundVolume = soundSettings?.getSoundVolume?.() ?? 0.5;

  const sound = useSoundFeedback({
    enabled: soundEnabled,
    volume: soundVolume,
  });

  // Component lifecycle tracking - 強化版記憶體洩漏防護
  const cleanupRef = useRef<(() => void)[]>([]);
  const mountedRef = useRef(true);
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());

  const [operatorState, setOperatorState] = useState({
    clockNumber: '',
    verifiedClockNumber: null as string | null,
    verifiedName: null as string | null,
    isVerifying: false,
    error: '',
  });

  const [uiState, setUiState] = useState<{
    statusMessage: { type: 'success' | 'error' | 'warning' | 'info'; message: string } | null;
    searchValue: string;
    transferHistory: TransferHistoryItem[];
    showErrorOverlay: boolean;
    errorMessage: string;
    errorDetails: string;
  }>({
    statusMessage: null,
    searchValue: '',
    transferHistory: [],
    showErrorOverlay: false,
    errorMessage: '',
    errorDetails: '',
  });

  // Use the stock transfer hook for core functionality with safety checks
  const stockTransferHook = useStockTransfer({
    searchInputRef,
    onTransferComplete: (pallet, destination) => {
      if (sound?.playSuccess) {
        sound.playSuccess();
      }
      const refreshController = new AbortController();
      loadTransferHistory(refreshController.signal);
    },
    onTransferError: error => {
      if (sound?.playError) {
        sound.playError();
      }
      if (error.includes('Voided') || error.includes('already at location')) {
        setUiState(prev => ({
          ...prev,
          showErrorOverlay: true,
          errorMessage: 'Invalid Transfer',
          errorDetails: error,
        }));
      }
    },
  });

  // 穩定化狀態引用 - 使用 useMemo 優化狀態提取，防止不必要的重新渲染
  const state = useMemo(() => {
    if (!stockTransferHook?.state) {
      return {
        isLoading: false,
        isSearching: false,
        isTransferring: false,
        searchValue: '',
        statusMessage: null,
        selectedPallet: null,
        selectedDestination: '',
        verifiedClockNumber: null,
        verifiedName: null,
        clockNumber: '',
        clockError: '',
        isVerifying: false,
        currentLocation: 'Await',
      };
    }

    // 僅在實際需要的狀態屬性發生變化時才返回新對象
    const {
      isLoading,
      isSearching,
      isTransferring,
      searchValue,
      statusMessage,
      selectedPallet,
      selectedDestination,
      verifiedClockNumber,
      verifiedName,
      clockNumber,
      clockError,
      isVerifying,
      currentLocation,
    } = stockTransferHook.state;

    return {
      isLoading,
      isSearching,
      isTransferring,
      searchValue,
      statusMessage,
      selectedPallet,
      selectedDestination,
      verifiedClockNumber,
      verifiedName,
      clockNumber,
      clockError,
      isVerifying,
      currentLocation,
    };
  }, [stockTransferHook?.state]);

  // 穩定化 actions 引用 - 使用 useMemo 包裹 actions，防止作為 props 傳遞時觸發子組件渲染
  const actions = useMemo(() => {
    if (!stockTransferHook?.actions) {
      return {
        setIsLoading: () => {},
        setSearchValue: () => {},
        setSelectedDestination: () => {},
        setClockNumber: () => {},
        setStatusMessage: () => {},
        executeStockTransfer: async () => false,
        validateClockNumberLocal: async () => false,
        handleSearchSelect: () => {},
        handleClockNumberChange: () => {},
        handleVerifyClockNumber: async () => {},
        focusSearchInput: () => {},
        resetToSearch: () => {},
        onDestinationChange: () => {},
      };
    }

    return stockTransferHook.actions;
  }, [stockTransferHook?.actions]);

  // 事件處理函數優化 - 使用 useCallback 穩定化事件處理函數引用
  const handleDestinationChange = useCallback(
    (value: string | string[]) => {
      if (!mountedRef.current) return;

      const stringValue = Array.isArray(value) ? value[0] : value;
      if (!stringValue) return;

      // 防止重複值更新以避免潛在的循環
      if (stringValue === state?.selectedDestination) return;

      try {
        actions?.onDestinationChange?.(stringValue);
      } catch (error) {
        console.error('Error in destination change:', error);
      }
    },
    [state?.selectedDestination, actions]
  );

  // 搜索值變更處理函數 - 穩定化引用，依賴於穩定的 state 和 actions
  const handleSearchValueChange = useCallback(
    (value: string) => {
      actions?.setSearchValue?.(value);
    },
    [actions]
  );

  // 搜索選擇處理函數 - 穩定化引用
  const handleSearchSelect = useCallback(
    (result: SearchResult) => {
      try {
        actions?.handleSearchSelect?.(result);
      } catch (error) {
        console.error('Error in search select:', error);
      }
    },
    [actions]
  );

  // 狀態訊息清除處理函數 - 穩定化引用
  const handleStatusMessageDismiss = useCallback(() => {
    actions?.setStatusMessage?.(null);
  }, [actions]);

  // 錯誤覆蓋確認處理函數 - 穩定化引用
  const handleErrorOverlayConfirm = useCallback(() => {
    setUiState(prev => ({ ...prev, showErrorOverlay: false }));
  }, []);

  // 搜索區域失焦處理函數 - 穩定化引用
  const handleSearchBlur = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      // 檢查失焦事件是否離開搜索輸入區域
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        // 如果值存在，觸發搜索
        if (uiState.searchValue?.trim()) {
          handleSearchSelect({
            id: uiState.searchValue,
            title: uiState.searchValue,
            subtitle: '',
            data: [{ value: uiState.searchValue }],
          });
        }
      }
    },
    [uiState.searchValue, handleSearchSelect]
  );

  // Load transfer history with enhanced error handling and AbortController support
  const loadTransferHistory = useCallback(async (signal?: AbortSignal) => {
    if (!mountedRef.current) return;

    try {
      // Check if request was aborted before making the call
      if (signal?.aborted) {
        return;
      }

      const history = await getTransferHistory(20); // Get latest 20 records

      // Check again after async operation completes
      if (signal?.aborted || !mountedRef.current) {
        return;
      }

      // Ensure history is always an array to prevent render errors
      const safeHistory = Array.isArray(history) ? history : [];

      setUiState(prev => ({
        ...prev,
        transferHistory: safeHistory,
        // Clear any previous error messages on successful load
        statusMessage: null,
      }));
    } catch (error) {
      // Only handle non-abort errors
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Failed to load transfer history:', error);

        if (mountedRef.current) {
          setUiState(prev => ({
            ...prev,
            // Preserve existing transfer history on error
            transferHistory: prev.transferHistory || [],
            statusMessage: {
              type: 'warning',
              message: 'Unable to refresh transfer history. Previous data shown.',
            },
          }));
        }
      }
    }
  }, []);

  // Safe transfer history with fallback and optimized key generation
  const safeTransferHistory = useMemo(() => {
    return Array.isArray(uiState.transferHistory) ? uiState.transferHistory : [];
  }, [uiState.transferHistory]);

  // Load history on mount with cleanup and AbortController
  useEffect(() => {
    const abortController = new AbortController();

    // Load history with abort signal
    loadTransferHistory(abortController.signal);

    // Component cleanup - 強化版記憶體洩漏防護
    return () => {
      // Abort any pending history load request
      abortController.abort();

      mountedRef.current = false;

      // 清理所有追蹤的定時器
      timeoutsRef.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      timeoutsRef.current.clear();

      // Execute all registered cleanup functions
      cleanupRef.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.error('Cleanup error in StockTransferCard:', error);
        }
      });
      cleanupRef.current = [];
    };
  }, [loadTransferHistory]);

  // Optimized loading state calculation with memoization
  const isLoading = useMemo(
    () => Boolean(state?.isLoading || state?.isSearching || state?.isTransferring),
    [state?.isLoading, state?.isSearching, state?.isTransferring]
  );

  // Play sound when pallet is found - using ref to avoid sound loop with safety checks
  const lastSelectedPalletRef = useRef<string | null>(null);
  useEffect(() => {
    if (state?.selectedPallet && state.selectedPallet.plt_num !== lastSelectedPalletRef.current) {
      if (sound?.playScan) {
        sound.playScan(); // Play scan sound when pallet is successfully found
      }
      lastSelectedPalletRef.current = state.selectedPallet.plt_num;
    } else if (!state?.selectedPallet) {
      lastSelectedPalletRef.current = null;
    }
  }, [state?.selectedPallet, sound]);

  const prevVerifiedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!state) return;

    const prevVerified = prevVerifiedRef.current;

    // Only update if values have actually changed to prevent infinite loops
    setOperatorState(prev => {
      const clockNumber = state.clockNumber || '';
      const verifiedClockNumber = state.verifiedClockNumber;
      const verifiedName = state.verifiedName;
      const isVerifying = state.isVerifying || false;
      const error = state.clockError || '';

      // Skip update if values haven't changed
      if (
        prev.clockNumber === clockNumber &&
        prev.verifiedClockNumber === verifiedClockNumber &&
        prev.verifiedName === verifiedName &&
        prev.isVerifying === isVerifying &&
        prev.error === error
      ) {
        return prev;
      }

      return {
        ...prev,
        clockNumber,
        verifiedClockNumber,
        verifiedName,
        isVerifying,
        error,
      };
    });

    // Play success sound when clock number is verified
    if (state.verifiedClockNumber && !prevVerified) {
      if (sound?.playSuccess) {
        sound.playSuccess();
      }
    }
    // Play error sound when verification fails
    if (state.clockError && !state.isVerifying) {
      if (sound?.playWarning) {
        sound.playWarning();
      }
    }

    // Update the ref after processing
    prevVerifiedRef.current = state.verifiedClockNumber;
  }, [state, sound]);

  // Removed complex state comparison refs - using direct state sync instead

  // Simplified state synchronization to prevent loops
  useEffect(() => {
    if (!mountedRef.current) return;

    // Direct state updates without complex comparison logic
    setUiState(prevState => {
      if (!mountedRef.current) return prevState;

      const needsUpdate =
        prevState.statusMessage !== state?.statusMessage ||
        prevState.searchValue !== state?.searchValue;

      if (!needsUpdate) return prevState;

      return {
        ...prevState,
        statusMessage: state?.statusMessage || null,
        searchValue: state?.searchValue || '',
      };
    });
  }, [state?.statusMessage, state?.searchValue]);

  // Map-based theme cache for O(1) theme lookup performance
  const THEME_CACHE = useMemo(
    () =>
      new Map([
        [
          '',
          {
            borderColor: 'border-slate-700/50',
            headerBg: 'bg-gradient-to-r from-slate-800 to-slate-700',
            accentColor: 'text-blue-400',
            glowColor: '',
          },
        ],
        [
          'Fold Mill',
          {
            borderColor: 'border-blue-500/50',
            headerBg: 'bg-gradient-to-r from-blue-900 to-blue-800',
            accentColor: 'text-blue-400',
            glowColor: 'shadow-lg shadow-blue-500/20',
          },
        ],
        [
          'Production',
          {
            borderColor: 'border-green-500/50',
            headerBg: 'bg-gradient-to-r from-green-900 to-green-800',
            accentColor: 'text-green-400',
            glowColor: 'shadow-lg shadow-green-500/20',
          },
        ],
        [
          'PipeLine',
          {
            borderColor: 'border-purple-500/50',
            headerBg: 'bg-gradient-to-r from-purple-900 to-purple-800',
            accentColor: 'text-purple-400',
            glowColor: 'shadow-lg shadow-purple-500/20',
          },
        ],
        [
          'default',
          {
            borderColor: 'border-amber-500/50',
            headerBg: 'bg-gradient-to-r from-amber-900 to-amber-800',
            accentColor: 'text-amber-400',
            glowColor: 'shadow-lg shadow-amber-500/20',
          },
        ],
      ]),
    []
  );

  // O(1) theme lookup using Map cache
  const theme = useMemo(() => {
    const destination = state?.selectedDestination || '';
    return THEME_CACHE.get(destination) || THEME_CACHE.get('default')!;
  }, [state?.selectedDestination, THEME_CACHE]);

  // Optimized class names for frequent UI elements with memoization
  const uiClassNames = useMemo(
    () => ({
      stepNumberActive: `flex h-6 w-6 items-center justify-center rounded-full ${theme.headerBg} text-xs font-bold text-white`,
      stepNumberDefault:
        'flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white',
      stepNumberCompleted:
        'flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white',
      palletInfoContainer: `rounded-lg border ${theme.borderColor} bg-slate-900/30 p-3`,
      transferLogContainer: `h-40 space-y-2 overflow-y-auto rounded-lg border ${theme.borderColor} bg-slate-900/50 p-3`,
      cardContainer: `h-full overflow-hidden transition-all duration-300 ${theme.borderColor} ${theme.glowColor}`,
      headerContainer: `border-b border-slate-700/50 p-4 transition-all duration-300 ${theme.headerBg}`,
      clockInput: `w-full border-gray-600 bg-gray-700 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 ${
        operatorState.error ? 'border-red-500 focus:ring-red-500' : ''
      } ${operatorState.isVerifying ? 'opacity-50' : ''}`,
    }),
    [theme, operatorState.error, operatorState.isVerifying]
  );

  // Map-based destination options cache for efficient O(1) lookup
  const destinationOptionsCache = useMemo(() => {
    const cache = new Map<string, FormOption[]>();

    Object.keys(LOCATION_DESTINATIONS).forEach(location => {
      const destinations = LOCATION_DESTINATIONS[location] || [];
      const options = destinations.map(destination => {
        const config = DESTINATION_CONFIG[destination as keyof typeof DESTINATION_CONFIG];
        return {
          value: destination,
          label: destination,
          description: config?.description || `Transfer to ${destination}`,
          // Don't include icon to avoid reference issues
          color: config?.color,
          bgColor: config?.bgColor,
          borderColor: config?.borderColor,
        };
      });
      cache.set(location, options);
    });

    return cache;
  }, []);

  // O(1) destination options lookup using Map cache
  const destinationOptions = useMemo((): FormOption[] => {
    const currentLoc = state?.currentLocation || 'Await';
    return destinationOptionsCache.get(currentLoc) || [];
  }, [state?.currentLocation, destinationOptionsCache]);

  // Memoized description to avoid string template recreation
  const destinationDescription = useMemo(
    () => `Moving from: ${state?.currentLocation || 'Await'}`,
    [state?.currentLocation]
  );

  // Early return if critical dependencies are not available
  if (!state || !actions || !soundSettings) {
    return (
      <div className={`h-full ${className || ''}`}>
        <OperationCard
          variant='glass'
          isHoverable={false}
          borderGlow={false}
          className='h-full border-slate-700/50'
          padding='small'
        >
          <div className='flex h-full flex-col'>
            <div className='border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-700 p-4'>
              <div className='flex items-center gap-2'>
                <ArrowLeftRight className='h-6 w-6 text-blue-400' />
                <h2 className={cn('text-xl', cardTextStyles.title)}>Stock Transfer</h2>
              </div>
              <p className='text-sm text-slate-300'>Transfer stock between locations</p>
            </div>
            <div className='flex flex-1 items-center justify-center'>
              <div className='space-y-4 text-center'>
                <div className='flex justify-center'>
                  <Loader2 className='h-8 w-8 animate-spin text-blue-400' />
                </div>
                <p className='text-white'>Initializing stock transfer...</p>
              </div>
            </div>
          </div>
        </OperationCard>
      </div>
    );
  }

  return (
    <div className={`h-full ${className || ''}`}>
      <OperationCard
        variant='glass'
        isHoverable={false}
        borderGlow={false}
        className={uiClassNames.cardContainer}
        padding='small'
      >
        <div className='flex h-full flex-col'>
          {/* Header */}
          <div className={uiClassNames.headerContainer}>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <ArrowLeftRight className={`h-6 w-6 ${theme.accentColor}`} />
                <h2 className={cn('text-xl', cardTextStyles.title)}>Stock Transfer</h2>
                {state?.selectedDestination && (
                  <span className={`ml-2 text-base font-medium ${theme.accentColor}`}>
                    → {state.selectedDestination}
                  </span>
                )}
              </div>
              <SoundSettingsToggle />
            </div>
            <p className='text-sm text-slate-300'>Transfer stock between locations</p>
          </div>

          {/* Status Message */}
          {uiState.statusMessage && (
            <div className='p-2'>
              <StatusMessage
                type={uiState.statusMessage.type}
                message={uiState.statusMessage.message}
                onDismiss={handleStatusMessageDismiss}
              />
            </div>
          )}

          {/* Error Overlay for illegal transfers */}
          <ErrorOverlay
            show={uiState.showErrorOverlay}
            message={uiState.errorMessage}
            details={uiState.errorDetails}
            onConfirm={handleErrorOverlayConfirm}
          />

          {/* Main Content */}
          <div className='flex flex-1 flex-col gap-4 p-3'>
            {/* Top Row: Destination and Operator side by side */}
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
              {/* Step 1: Destination Selection */}
              <div className='space-y-3'>
                <div className='flex items-center gap-2'>
                  <span
                    className={
                      state?.selectedDestination
                        ? uiClassNames.stepNumberActive
                        : uiClassNames.stepNumberDefault
                    }
                  >
                    1
                  </span>
                  <h3 className={cardTextStyles.subtitle}>Select Destination</h3>
                </div>
                <FormInputGroup
                  type='radio'
                  label='Select Destination'
                  description={destinationDescription}
                  options={destinationOptions}
                  value={state?.selectedDestination || ''}
                  onChange={handleDestinationChange}
                  disabled={isLoading || destinationOptions.length === 0}
                  loading={isLoading}
                  layout='vertical'
                  size='sm'
                  showValidationIcons={true}
                  className='w-full'
                />
              </div>

              {/* Step 2: Operator Verification */}
              <div className='space-y-3'>
                <div className='flex items-center gap-2'>
                  <span
                    className={
                      operatorState.verifiedClockNumber
                        ? uiClassNames.stepNumberCompleted
                        : uiClassNames.stepNumberActive
                    }
                  >
                    2
                  </span>
                  <h3 className={cardTextStyles.subtitle}>Verify Operator</h3>
                </div>
                <div className='space-y-2'>
                  <Input
                    ref={clockNumberRef}
                    type='text'
                    inputMode='numeric'
                    pattern='[0-9]*'
                    value={operatorState.clockNumber}
                    onChange={actions.handleClockNumberChange}
                    placeholder='Enter 4-digit clock number'
                    className={uiClassNames.clockInput}
                    disabled={!state?.selectedDestination || isLoading}
                    autoComplete='off'
                    maxLength={4}
                  />
                  {operatorState.isVerifying && (
                    <p className={`flex items-center gap-1 text-xs ${theme.accentColor}`}>
                      <Loader2 className='h-3 w-3 animate-spin' />
                      Verifying...
                    </p>
                  )}
                  {operatorState.error && !operatorState.isVerifying && (
                    <p className='text-xs text-red-400'>{operatorState.error}</p>
                  )}
                  {operatorState.verifiedName && !operatorState.isVerifying && (
                    <p className='text-xs text-green-400'>
                      ✓ Verified: <span className='font-medium'>{operatorState.verifiedName}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3: Pallet Search - Only show after operator is verified */}
            {state?.selectedDestination && operatorState.verifiedClockNumber && (
              <div className='space-y-3'>
                <div className='flex items-center gap-2'>
                  <span
                    className={
                      state?.selectedPallet
                        ? uiClassNames.stepNumberCompleted
                        : uiClassNames.stepNumberActive
                    }
                  >
                    3
                  </span>
                  <h3 className={cardTextStyles.subtitle}>Scan/Search Pallet</h3>
                </div>
                <div onBlur={handleSearchBlur}>
                  <SearchInput
                    ref={searchInputRef}
                    value={uiState.searchValue}
                    onChange={handleSearchValueChange}
                    placeholder='Enter or scan pallet number'
                    searchType='pallet'
                    autoDetect={true}
                    showTypeIndicator={false}
                    searchOnEnter={true}
                    isLoading={isLoading}
                    disabled={isLoading}
                  />
                </div>

                {/* Selected Pallet Info */}
                {state?.selectedPallet && (
                  <div className={uiClassNames.palletInfoContainer}>
                    <div className='mb-2 flex items-center gap-2'>
                      <Package className={`h-4 w-4 ${theme.accentColor}`} />
                      <h4 className={`text-sm font-medium ${theme.accentColor}`}>
                        Selected Pallet
                      </h4>
                      {isLoading && (
                        <span className='ml-auto flex items-center gap-1 text-xs text-amber-400'>
                          <Loader2 className='h-3 w-3 animate-spin' />
                          Transferring...
                        </span>
                      )}
                    </div>
                    <div className='grid grid-cols-2 gap-2 text-xs'>
                      <div>
                        <span className='text-gray-500'>Pallet:</span>
                        <span className='ml-1 font-medium text-white'>
                          {state?.selectedPallet?.plt_num || ''}
                        </span>
                      </div>
                      <div>
                        <span className='text-gray-500'>Product:</span>
                        <span className='ml-1 font-medium text-white'>
                          {state?.selectedPallet?.product_code || ''}
                        </span>
                      </div>
                      <div>
                        <span className='text-gray-500'>Quantity:</span>
                        <span className='ml-1 font-medium text-white'>
                          {state?.selectedPallet?.product_qty || 0}
                        </span>
                      </div>
                      <div>
                        <span className='text-gray-500'>From:</span>
                        <span className='ml-1 font-medium text-white'>
                          {state?.selectedPallet?.current_plt_loc || 'Await'}
                        </span>
                      </div>
                      <div className='col-span-2'>
                        <span className='text-gray-500'>To:</span>
                        <span className={`ml-1 font-medium ${theme.accentColor}`}>
                          {state?.selectedDestination || ''}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Transfer Log - Always visible with real database records */}
            <div className='flex-1'>
              <h3 className={cn('mb-2', cardTextStyles.subtitle)}>Transfer Log</h3>
              <div className={uiClassNames.transferLogContainer}>
                {safeTransferHistory.length === 0 ? (
                  <div className='flex h-full items-center justify-center text-slate-400'>
                    <p className='text-sm'>No transfer records</p>
                  </div>
                ) : (
                  safeTransferHistory.map(record => (
                    <TransferLogItem
                      key={`${record.time}-${record.plt_num}-${record.uuid}`}
                      record={record}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </OperationCard>
    </div>
  );
};

// Main component wrapped with error boundary
export const StockTransferCard: React.FC<StockTransferCardProps> = ({ className }) => {
  return (
    <StockTransferErrorBoundary>
      <StockTransferCardInternal className={className} />
    </StockTransferErrorBoundary>
  );
};

export default StockTransferCard;
