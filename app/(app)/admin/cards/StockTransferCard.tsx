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

// Transfer log item component - Simplified to show database records
const TransferLogItem: React.FC<{
  record: TransferHistoryItem;
}> = React.memo(({ record }) => {
  const formatTime = (time: string) => {
    const date = new Date(time);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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

// Helper function to convert destination config to form options
const getDestinationOptions = (currentLocation: string): FormOption[] => {
  // Use standardized location for consistent mapping
  const standardizedLocation = LocationStandardizer.standardizeForUI(currentLocation);
  const availableDestinations = LocationStandardizer.getValidDestinations(currentLocation);
  const filteredDestinations = availableDestinations.filter(dest => dest !== standardizedLocation);

  return filteredDestinations.map(destination => {
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

  // Component lifecycle tracking
  const cleanupRef = useRef<(() => void)[]>([]);
  const mountedRef = useRef(true);

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

  // Extract state and actions with safety checks using useMemo
  const state = useMemo(
    () =>
      stockTransferHook?.state ?? {
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
      },
    [stockTransferHook?.state]
  );

  const actions = stockTransferHook?.actions ?? {
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

  // Create stable destination change handler using useRef to avoid dependency cycles
  const actionsRef = useRef(actions);
  const selectedDestinationRef = useRef(state?.selectedDestination);

  // Update refs on each render
  actionsRef.current = actions;
  selectedDestinationRef.current = state?.selectedDestination;

  const handleDestinationChange = useCallback((value: string | string[]) => {
    if (!mountedRef.current || !actionsRef.current?.onDestinationChange) return;

    const stringValue = Array.isArray(value) ? value[0] : value;
    if (!stringValue) return;

    // Prevent same value updates to avoid potential loops
    if (stringValue === selectedDestinationRef.current) return;

    try {
      actionsRef.current.onDestinationChange(stringValue);
    } catch (error) {
      console.error('Error in destination change:', error);
    }
  }, []); // No dependencies for completely stable reference

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

  // Safe transfer history with fallback
  const safeTransferHistory = useMemo(() => {
    return Array.isArray(uiState.transferHistory) ? uiState.transferHistory : [];
  }, [uiState.transferHistory]);

  // Load history on mount with cleanup and AbortController
  useEffect(() => {
    const abortController = new AbortController();

    // Load history with abort signal
    loadTransferHistory(abortController.signal);

    // Component cleanup
    return () => {
      // Abort any pending history load request
      abortController.abort();

      mountedRef.current = false;
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

  // Calculate loading state with safe fallbacks
  const isLoading = Boolean(state?.isLoading || state?.isSearching || state?.isTransferring);

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

  // Memoized destination-based theme colors to prevent recalculation on every render
  const theme = useMemo(() => {
    if (!state?.selectedDestination)
      return {
        borderColor: 'border-slate-700/50',
        headerBg: 'bg-gradient-to-r from-slate-800 to-slate-700',
        accentColor: 'text-blue-400',
        glowColor: '',
      };

    const config = DESTINATION_CONFIG[state.selectedDestination as keyof typeof DESTINATION_CONFIG];
    if (!config)
      return {
        borderColor: 'border-slate-700/50',
        headerBg: 'bg-gradient-to-r from-slate-800 to-slate-700',
        accentColor: 'text-blue-400',
        glowColor: '',
      };

    // Define theme based on destination
    switch (state.selectedDestination) {
      case 'Fold Mill':
        return {
          borderColor: 'border-blue-500/50',
          headerBg: 'bg-gradient-to-r from-blue-900 to-blue-800',
          accentColor: 'text-blue-400',
          glowColor: 'shadow-lg shadow-blue-500/20',
        };
      case 'Production':
        return {
          borderColor: 'border-green-500/50',
          headerBg: 'bg-gradient-to-r from-green-900 to-green-800',
          accentColor: 'text-green-400',
          glowColor: 'shadow-lg shadow-green-500/20',
        };
      case 'PipeLine':
        return {
          borderColor: 'border-purple-500/50',
          headerBg: 'bg-gradient-to-r from-purple-900 to-purple-800',
          accentColor: 'text-purple-400',
          glowColor: 'shadow-lg shadow-purple-500/20',
        };
      default:
        return {
          borderColor: 'border-amber-500/50',
          headerBg: 'bg-gradient-to-r from-amber-900 to-amber-800',
          accentColor: 'text-amber-400',
          glowColor: 'shadow-lg shadow-amber-500/20',
        };
    }
  }, [state?.selectedDestination]);

  // Memoized destination options based on current location - with stable references
  const destinationOptions = useMemo((): FormOption[] => {
    const currentLoc = state?.currentLocation || 'Await';
    const availableDestinations = LOCATION_DESTINATIONS[currentLoc] || [];

    // Create stable options to prevent unnecessary re-renders
    return availableDestinations.map(destination => {
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
  }, [state?.currentLocation]);

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
        className={`h-full overflow-hidden transition-all duration-300 ${theme.borderColor} ${theme.glowColor}`}
        padding='small'
      >
        <div className='flex h-full flex-col'>
          {/* Header */}
          <div
            className={`border-b border-slate-700/50 p-4 transition-all duration-300 ${theme.headerBg}`}
          >
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
                onDismiss={() => actions.setStatusMessage(null)}
              />
            </div>
          )}

          {/* Error Overlay for illegal transfers */}
          <ErrorOverlay
            show={uiState.showErrorOverlay}
            message={uiState.errorMessage}
            details={uiState.errorDetails}
            onConfirm={() => setUiState(prev => ({ ...prev, showErrorOverlay: false }))}
          />

          {/* Main Content */}
          <div className='flex flex-1 flex-col gap-4 p-3'>
            {/* Top Row: Destination and Operator side by side */}
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
              {/* Step 1: Destination Selection */}
              <div className='space-y-3'>
                <div className='flex items-center gap-2'>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${state?.selectedDestination ? theme.headerBg : 'bg-blue-500'} text-xs font-bold text-white`}
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
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${operatorState.verifiedClockNumber ? 'bg-green-500' : theme.headerBg} text-xs font-bold text-white`}
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
                    className={`w-full border-gray-600 bg-gray-700 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 ${
                      operatorState.error ? 'border-red-500 focus:ring-red-500' : ''
                    } ${operatorState.isVerifying ? 'opacity-50' : ''}`}
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
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${state?.selectedPallet ? 'bg-green-500' : theme.headerBg} text-xs font-bold text-white`}
                  >
                    3
                  </span>
                  <h3 className={cardTextStyles.subtitle}>Scan/Search Pallet</h3>
                </div>
                <div
                  onBlur={e => {
                    // Check if blur event is leaving the search input area
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      // Trigger search on blur if value exists
                      if (uiState.searchValue.trim()) {
                        actions.handleSearchSelect({
                          id: uiState.searchValue,
                          title: uiState.searchValue,
                          subtitle: '',
                          data: [{ value: uiState.searchValue }],
                        });
                      }
                    }
                  }}
                >
                  <SearchInput
                    ref={searchInputRef}
                    value={uiState.searchValue}
                    onChange={value => actions.setSearchValue(value)}
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
                  <div className={`rounded-lg border ${theme.borderColor} bg-slate-900/30 p-3`}>
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
              <div
                className={`h-40 space-y-2 overflow-y-auto rounded-lg border ${theme.borderColor} bg-slate-900/50 p-3`}
              >
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
