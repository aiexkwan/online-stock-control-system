'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { GlassmorphicCard } from '../components/GlassmorphicCard';
import { StatusMessage } from '@/components/ui/universal-stock-movement-layout';
import { Input } from '@/components/ui/input';
import { SearchInput, SearchInputRef, FormInputGroup, FormOption } from '../components/shared';
import { Label } from '@/components/ui/label';
import { 
  getCardTheme, 
  cardTextStyles, 
  cardStatusColors,
  cardContainerStyles 
} from '@/lib/card-system/theme';
import { cn } from '@/lib/utils';
import {
  Loader2,
  Package,
  Package2,
  ArrowLeftRight,
  AlertTriangle,
  X,
} from 'lucide-react';
import { LOCATION_DESTINATIONS, DESTINATION_CONFIG } from '../constants/stockTransfer';
import { useStockTransfer } from '../hooks/useStockTransfer';
import { LocationStandardizer } from '../utils/locationStandardizer';
import { getTransferHistory } from '@/app/actions/stockTransferActions';

export interface StockTransferCardProps {
  className?: string;
}


// Import types from actions
import type { TransferHistoryItem } from '@/app/actions/stockTransferActions';
import type { PalletInfo } from '../hooks/useStockTransfer';

// Error overlay component for illegal transfers
const ErrorOverlay: React.FC<{
  show: boolean;
  message: string;
  details: string;
  onConfirm: () => void;
}> = ({ show, message, details, onConfirm }) => {
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className={cn(
        "relative w-full max-w-md rounded-lg border p-6 shadow-2xl",
        cardStatusColors.error.border,
        "bg-slate-900 shadow-red-500/20"
      )}>
        <div className="mb-4 flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <h2 className={cn("text-2xl font-bold", cardStatusColors.error.text)}>Error</h2>
        </div>
        <div className="space-y-3">
          <p className={cn("text-lg font-medium", "text-white")}>Reason: {message}</p>
          <p className="text-base text-gray-300">Details: {details}</p>
        </div>
        <button
          onClick={onConfirm}
          className="mt-6 w-full rounded-lg bg-red-600 px-4 py-3 font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
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
      minute: '2-digit'
    });
  };

  return (
    <div className={cn(
      "flex items-start space-x-2 rounded-lg border p-2",
      getCardTheme('operation').border,
      getCardTheme('operation').bg
    )}>
      <div className={cn(
        "mt-2 h-2 w-2 flex-shrink-0 rounded-full",
        "bg-blue-400"
      )} />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="font-mono text-xs text-slate-400">
            {formatTime(record.time)}
          </span>
          <span className="text-xs text-slate-500">by {record.id}</span>
        </div>
        <p className="text-sm text-white">
          {record.plt_num} → {record.loc}
          {record.remark && record.remark !== '-' && (
            <span className="ml-2 text-xs text-slate-400">({record.remark})</span>
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
      <div className="text-xs text-red-400">
        <div>⚠️ No valid destinations available</div>
        <div className="text-xs text-gray-500 mt-1">
          Location: &quot;{debugInfo.original}&quot; → &quot;{debugInfo.standardized}&quot;
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-600 mt-1">
            Debug: {JSON.stringify(debugInfo, null, 2)}
          </div>
        )}
      </div>
    );
  }

  return (
    <FormInputGroup
      type="radio"
      label="Select Destination"
      options={destinationOptions}
      value={selectedDestination}
      onChange={(value) => onDestinationChange(value as string)}
      disabled={disabled}
      size="sm"
      layout="horizontal"
      className="flex flex-wrap gap-2"
    />
  );
};

export const StockTransferCard: React.FC<StockTransferCardProps> = ({ className }) => {
  // Refs
  const searchInputRef = useRef<SearchInputRef>(null);
  const clockNumberRef = useRef<HTMLInputElement>(null);
  
  // Simplified state management
  const [transferState, setTransferState] = useState<{
    isLoading: boolean;
    selectedPallet: PalletInfo | null;
    selectedDestination: string;
    currentLocation: string;
  }>({
    isLoading: false,
    selectedPallet: null,
    selectedDestination: '',
    currentLocation: 'Await',
  });
  
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
  
  // Use the stock transfer hook for core functionality
  const { state, actions } = useStockTransfer({
    searchInputRef,
    onTransferComplete: (pallet, destination) => {
      console.log('Transfer completed:', pallet.plt_num, 'to', destination);
      loadTransferHistory(); // Refresh history after transfer
    },
    onTransferError: (error) => {
      console.error('Transfer error:', error);
      // Check if it's an illegal transfer
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
  
  // Load transfer history from database
  const loadTransferHistory = useCallback(async () => {
    try {
      const history = await getTransferHistory(20); // Get latest 20 records
      setUiState(prev => ({ ...prev, transferHistory: history }));
    } catch (error) {
      console.error('Failed to load transfer history:', error);
    }
  }, []);
  
  // Load history on mount
  useEffect(() => {
    loadTransferHistory();
  }, [loadTransferHistory]);
  
  // Sync with hook state - use specific dependencies to avoid infinite loops
  useEffect(() => {
    setTransferState(prev => ({
      ...prev,
      isLoading: state.isLoading || state.isSearching || state.isTransferring,
      selectedPallet: state.selectedPallet,
      selectedDestination: state.selectedDestination,
      currentLocation: state.currentLocation,
    }));
  }, [state.isLoading, state.isSearching, state.isTransferring, state.selectedPallet, state.selectedDestination, state.currentLocation]);
  
  useEffect(() => {
    setOperatorState(prev => ({
      ...prev,
      clockNumber: state.clockNumber,
      verifiedClockNumber: state.verifiedClockNumber,
      verifiedName: state.verifiedName,
      isVerifying: state.isVerifying,
      error: state.clockError,
    }));
  }, [state.clockNumber, state.verifiedClockNumber, state.verifiedName, state.isVerifying, state.clockError]);
  
  useEffect(() => {
    // Only update if values actually changed to prevent loops
    setUiState(prev => {
      const updates: Partial<typeof prev> = {};
      
      // Only update statusMessage if it's different
      if (JSON.stringify(prev.statusMessage) !== JSON.stringify(state.statusMessage)) {
        updates.statusMessage = state.statusMessage;
      }
      
      // Only update searchValue if it's different
      if (prev.searchValue !== state.searchValue) {
        updates.searchValue = state.searchValue;
      }
      
      // Only return new state if there are updates
      if (Object.keys(updates).length > 0) {
        return { ...prev, ...updates };
      }
      return prev;
    });
  }, [state.statusMessage, state.searchValue]);

  // Get destination-based theme colors
  const getDestinationTheme = () => {
    if (!transferState.selectedDestination) return {
      borderColor: 'border-slate-700/50',
      headerBg: 'bg-gradient-to-r from-slate-800 to-slate-700',
      accentColor: 'text-blue-400',
      glowColor: '',
    };

    const config = DESTINATION_CONFIG[transferState.selectedDestination as keyof typeof DESTINATION_CONFIG];
    if (!config) return {
      borderColor: 'border-slate-700/50',
      headerBg: 'bg-gradient-to-r from-slate-800 to-slate-700',
      accentColor: 'text-blue-400',
      glowColor: '',
    };

    // Define theme based on destination
    switch (transferState.selectedDestination) {
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
  };

  const theme = getDestinationTheme();


  return (
    <div className={`h-full ${className || ''}`}>
      <GlassmorphicCard
        variant="default"
        hover={false}
        borderGlow={false}
        className={`h-full overflow-hidden transition-all duration-300 ${theme.borderColor} ${theme.glowColor}`}
        padding="small"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className={`border-b border-slate-700/50 p-4 transition-all duration-300 ${theme.headerBg}`}>
            <div className="flex items-center gap-2">
              <ArrowLeftRight className={`h-6 w-6 ${theme.accentColor}`} />
              <h2 className={cn("text-xl", cardTextStyles.title)}>Stock Transfer</h2>
              {transferState.selectedDestination && (
                <span className={`ml-auto text-base font-medium ${theme.accentColor}`}>
                  → {transferState.selectedDestination}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-300">Transfer stock between locations</p>
          </div>

          {/* Status Message */}
          {uiState.statusMessage && (
            <div className="p-2">
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
          <div className="flex flex-1 flex-col gap-4 p-3">
            {/* Top Row: Destination and Operator side by side */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Step 1: Destination Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full ${transferState.selectedDestination ? theme.headerBg : 'bg-blue-500'} text-xs font-bold text-white`}>1</span>
                  <h3 className={cardTextStyles.subtitle}>Select Destination</h3>
                </div>
                <TransferDestinationSelector
                  currentLocation={transferState.currentLocation}
                  selectedDestination={transferState.selectedDestination}
                  onDestinationChange={actions.onDestinationChange}
                  disabled={transferState.isLoading}
                />
              </div>

              {/* Step 2: Operator Verification */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full ${operatorState.verifiedClockNumber ? 'bg-green-500' : theme.headerBg} text-xs font-bold text-white`}>2</span>
                  <h3 className={cardTextStyles.subtitle}>Verify Operator</h3>
                </div>
                <div className="space-y-2">
                  <Input
                    ref={clockNumberRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={operatorState.clockNumber}
                    onChange={actions.handleClockNumberChange}
                    placeholder="Enter 4-digit clock number"
                    className={`w-full border-gray-600 bg-gray-700 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 ${
                      operatorState.error ? 'border-red-500 focus:ring-red-500' : ''
                    } ${operatorState.isVerifying ? 'opacity-50' : ''}`}
                    disabled={!transferState.selectedDestination || transferState.isLoading}
                    autoComplete="off"
                    maxLength={4}
                  />
                  {operatorState.isVerifying && (
                    <p className={`flex items-center gap-1 text-xs ${theme.accentColor}`}>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Verifying...
                    </p>
                  )}
                  {operatorState.error && !operatorState.isVerifying && <p className="text-xs text-red-400">{operatorState.error}</p>}
                  {operatorState.verifiedName && !operatorState.isVerifying && (
                    <p className="text-xs text-green-400">
                      ✓ Verified: <span className="font-medium">{operatorState.verifiedName}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3: Pallet Search - Only show after operator is verified */}
            {transferState.selectedDestination && operatorState.verifiedClockNumber && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full ${transferState.selectedPallet ? 'bg-green-500' : theme.headerBg} text-xs font-bold text-white`}>3</span>
                  <h3 className={cardTextStyles.subtitle}>Scan/Search Pallet</h3>
                </div>
                <div 
                  onBlur={(e) => {
                    // Check if blur event is leaving the search input area
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      // Trigger search on blur if value exists
                      if (uiState.searchValue.trim()) {
                        actions.handleSearchSelect({ 
                          id: uiState.searchValue, 
                          title: uiState.searchValue, 
                          subtitle: '', 
                          data: [{value: uiState.searchValue}] 
                        });
                      }
                    }
                  }}
                >
                  <SearchInput
                    ref={searchInputRef}
                    value={uiState.searchValue}
                    onChange={(value) => actions.setSearchValue(value)}
                    placeholder="Enter or scan pallet number"
                    searchType="pallet"
                    autoDetect={true}
                    showTypeIndicator={false}
                    searchOnEnter={true}
                    isLoading={transferState.isLoading}
                    disabled={transferState.isLoading}
                  />
                </div>
                
                {/* Selected Pallet Info */}
                {transferState.selectedPallet && (
                  <div className={`rounded-lg border ${theme.borderColor} bg-slate-900/30 p-3`}>
                    <div className="mb-2 flex items-center gap-2">
                      <Package className={`h-4 w-4 ${theme.accentColor}`} />
                      <h4 className={`text-sm font-medium ${theme.accentColor}`}>Selected Pallet</h4>
                      {transferState.isLoading && (
                        <span className="ml-auto flex items-center gap-1 text-xs text-amber-400">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Transferring...
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Pallet:</span>
                        <span className="ml-1 font-medium text-white">{transferState.selectedPallet.plt_num}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Product:</span>
                        <span className="ml-1 font-medium text-white">{transferState.selectedPallet.product_code}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Quantity:</span>
                        <span className="ml-1 font-medium text-white">{transferState.selectedPallet.product_qty}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">From:</span>
                        <span className="ml-1 font-medium text-white">
                          {transferState.selectedPallet.current_plt_loc || 'Await'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">To:</span>
                        <span className={`ml-1 font-medium ${theme.accentColor}`}>{transferState.selectedDestination}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Transfer Log - Always visible with real database records */}
            <div className="flex-1">
              <h3 className={cn("mb-2", cardTextStyles.subtitle)}>Transfer Log</h3>
              <div className={`h-40 space-y-2 overflow-y-auto rounded-lg border ${theme.borderColor} bg-slate-900/50 p-3`}>
                {uiState.transferHistory.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    <p className="text-sm">No transfer records</p>
                  </div>
                ) : (
                  uiState.transferHistory.map((record) => (
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
      </GlassmorphicCard>
    </div>
  );
};

export default StockTransferCard;