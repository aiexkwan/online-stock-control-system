/**
 * useStockTransfer Hook
 *
 * Extracted from StockTransferCard component for better reusability and testability
 * Handles stock transfer business logic, validation, and state management
 *
 * Features:
 * - Pallet search and validation
 * - Transfer execution with optimistic updates
 * - Clock number validation
 * - Activity logging
 * - Automatic transfer execution
 * - Error handling and status management
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import {
  searchPalletAuto,
  transferPallet,
  getTransferHistory,
  validateTransferDestination,
  validateClockNumber,
  TransferHistoryItem,
  OptimisticTransfer,
} from '@/app/actions/stockTransferActions';
import { LOCATION_DESTINATIONS } from '../constants/stockTransfer';
import { LocationStandardizer } from '../utils/locationStandardizer';
import type { SearchInputRef } from '../components/shared';

// Types
export interface PalletInfo {
  plt_num: string;
  product_code: string;
  product_desc?: string;
  product_qty: number;
  plt_remark?: string | null;
  current_plt_loc?: string | null;
  location?: string | null;
  generate_time?: string;
  series?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  metadata?: string;
  data: Array<Record<string, unknown>>;
}

export interface StockTransferState {
  isLoading: boolean;
  isSearching: boolean;
  isTransferring: boolean;
  optimisticTransfers: OptimisticTransfer[];
  searchValue: string;
  statusMessage: {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null;
  selectedPallet: PalletInfo | null;
  selectedDestination: string;
  verifiedClockNumber: string | null;
  verifiedName: string | null;
  clockNumber: string;
  clockError: string;
  isVerifying: boolean;
  currentLocation: string;
}

export interface StockTransferActions {
  setIsLoading: (loading: boolean) => void;
  setSearchValue: (value: string) => void;
  setSelectedDestination: (destination: string) => void;
  setClockNumber: (number: string) => void;
  setStatusMessage: (message: StockTransferState['statusMessage']) => void;
  executeStockTransfer: (
    palletInfo: PalletInfo,
    toLocation: string,
    operatorId: string
  ) => Promise<boolean>;
  validateClockNumberLocal: (clockNum: string) => Promise<boolean>;
  handleSearchSelect: (result: SearchResult) => void;
  handleClockNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleVerifyClockNumber: (numberToVerify?: string) => Promise<void>;
  focusSearchInput: () => void;
  resetToSearch: () => void;
  onDestinationChange: (destination: string) => void;
}

export interface UseStockTransferProps {
  searchInputRef?: React.RefObject<SearchInputRef>;
  onTransferComplete?: (pallet: PalletInfo, destination: string) => void;
  onTransferError?: (error: string) => void;
}

export interface UseStockTransferReturn {
  state: StockTransferState;
  actions: StockTransferActions;
}

export const useStockTransfer = ({
  searchInputRef,
  onTransferComplete,
  onTransferError,
}: UseStockTransferProps = {}): UseStockTransferReturn => {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [optimisticTransfers, setOptimisticTransfers] = useState<OptimisticTransfer[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [statusMessage, setStatusMessage] = useState<StockTransferState['statusMessage']>(null);
  const [selectedPallet, setSelectedPallet] = useState<PalletInfo | null>(null);
  const [selectedDestination, setSelectedDestination] = useState('');
  const [verifiedClockNumber, setVerifiedClockNumber] = useState<string | null>(null);
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [clockNumber, setClockNumber] = useState('');
  const [clockError, setClockError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('Await');

  // Focus search input helper
  const focusSearchInput = useCallback(() => {
    setTimeout(() => {
      if (searchInputRef?.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  }, [searchInputRef]);

  // Execute stock transfer
  const executeStockTransfer = useCallback(
    async (palletInfo: PalletInfo, toLocation: string, operatorId: string): Promise<boolean> => {
      const transferId = `${palletInfo.plt_num}-${Date.now()}`;
      const fromLocation = palletInfo.current_plt_loc || palletInfo.location || 'Unknown';

      // Use functional update to avoid dependency on optimisticTransfers
      let hasPending = false;
      setOptimisticTransfers(prev => {
        hasPending = prev.some(t => t.pltNum === palletInfo.plt_num && t.status === 'pending');
        return prev;
      });

      if (hasPending) {
        toast.warning(`Pallet ${palletInfo.plt_num} has a pending transfer. Please wait.`);
        return false;
      }

      const optimisticEntry: OptimisticTransfer = {
        id: transferId,
        pltNum: palletInfo.plt_num,
        fromLocation,
        toLocation,
        status: 'pending',
        timestamp: Date.now(),
      };

      setOptimisticTransfers(prev => [...prev, optimisticEntry]);
      setIsTransferring(true);

      try {
        const validation = await validateTransferDestination(palletInfo.plt_num, toLocation);
        if (!validation.valid) {
          const errorMessage = validation.message || 'Invalid transfer';
          toast.error(errorMessage);
          setIsTransferring(false);
          if (onTransferError) {
            onTransferError(errorMessage);
          }
          return false; // Return false for validation failure
        }

        const result = await transferPallet(palletInfo.plt_num, toLocation);

        if (result.success) {
          setOptimisticTransfers(prev =>
            prev.map(t => (t.id === transferId ? { ...t, status: 'success' } : t))
          );

          toast.success(result.message);

          // Callback for successful transfer
          if (onTransferComplete) {
            onTransferComplete(palletInfo, toLocation);
          }

          return true;
        } else {
          setOptimisticTransfers(prev =>
            prev.map(t => (t.id === transferId ? { ...t, status: 'failed' } : t))
          );

          const errorMessage = result.error || 'Transfer failed';
          toast.error(errorMessage);

          if (onTransferError) {
            onTransferError(errorMessage);
          }

          return false;
        }
      } catch (error) {
        setOptimisticTransfers(prev =>
          prev.map(t => (t.id === transferId ? { ...t, status: 'failed' } : t))
        );

        const errorMessage = error instanceof Error ? error.message : 'Transfer failed';
        toast.error(errorMessage);

        if (onTransferError) {
          onTransferError(errorMessage);
        }

        return false;
      } finally {
        setIsTransferring(false);
      }
    },
    [onTransferComplete, onTransferError]
  );

  // Clock number validation
  const validateClockNumberLocal = useCallback(async (clockNum: string): Promise<boolean> => {
    try {
      const result = await validateClockNumber(clockNum);
      if (!result.success) {
        setClockError(result.error || 'Clock number not found');
        return false;
      }
      if (result.data) {
        setClockError('');
        setVerifiedClockNumber(clockNum);
        setVerifiedName(result.data.name);
        return true;
      }
      setClockError('No user data received');
      return false;
    } catch (error) {
      setClockError('Validation error occurred');
      return false;
    }
  }, []);

  // Handle clock number verification
  const handleVerifyClockNumber = useCallback(
    async (numberToVerify?: string) => {
      const clockNum = numberToVerify || clockNumber;
      if (!clockNum || clockNum.length !== 4) {
        return;
      }
      setIsVerifying(true);
      await validateClockNumberLocal(clockNum);
      setIsVerifying(false);
    },
    [clockNumber, validateClockNumberLocal]
  );

  // Handle clock number input change
  const handleClockNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (/^\d*$/.test(value) && value.length <= 4) {
        setClockNumber(value);
        if (clockError) {
          setClockError('');
        }
        if (verifiedClockNumber && value !== verifiedClockNumber) {
          setVerifiedClockNumber('');
          setVerifiedName('');
        }
        if (value.length === 4) {
          handleVerifyClockNumber(value);
        }
      }
    },
    [clockError, verifiedClockNumber, handleVerifyClockNumber]
  );

  // Handle search result selection
  const handleSearchSelect = useCallback((result: SearchResult) => {
    const searchValueExtracted =
      Array.isArray(result.data) && result.data.length > 0
        ? typeof result.data[0]?.value === 'string'
          ? result.data[0].value
          : result.title
        : result.title || '';

    if (searchValueExtracted) {
      setIsSearching(true);

      searchPalletAuto(searchValueExtracted)
        .then(searchResult => {
          if (searchResult.success && searchResult.data) {
            setSelectedPallet(searchResult.data);
            // Found pallet successfully
          } else {
            toast.error(searchResult.error || 'Pallet not found');
          }
        })
        .catch(error => {
          toast.error('Search failed');
        })
        .finally(() => {
          setIsSearching(false);
        });
    }
  }, []);

  // Destination change handler with enhanced stability
  const destinationChangeRef = useRef(selectedDestination);
  destinationChangeRef.current = selectedDestination;

  const onDestinationChange = useCallback((destination: string) => {
    // Prevent unnecessary updates and potential loops
    if (destination !== destinationChangeRef.current && destination) {
      setSelectedDestination(destination);
    }
  }, []); // Empty dependencies for maximum stability

  // Reset to search state
  const resetToSearch = useCallback(() => {
    setSearchValue('');
    setSelectedPallet(null);
    setStatusMessage(null);
    setVerifiedClockNumber(null);
    setVerifiedName(null);
    setClockNumber('');
    setClockError('');
    setSelectedDestination('');
    // Direct focus without dependency
    setTimeout(() => {
      if (searchInputRef?.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  }, [searchInputRef]); // Include searchInputRef dependency

  // Auto-execute transfer when all conditions are met with enhanced guards
  const executeTransferRef = useRef<boolean>(false);
  const lastExecutedTransferRef = useRef<string>('');

  useEffect(() => {
    const transferKey = `${selectedPallet?.plt_num || ''}-${selectedDestination}-${verifiedClockNumber}`;
    const shouldExecute =
      selectedPallet &&
      selectedDestination &&
      verifiedClockNumber &&
      !isTransferring &&
      !executeTransferRef.current &&
      lastExecutedTransferRef.current !== transferKey; // Prevent duplicate executions

    if (shouldExecute) {
      executeTransferRef.current = true;
      lastExecutedTransferRef.current = transferKey;

      executeStockTransfer(selectedPallet, selectedDestination, verifiedClockNumber)
        .then(success => {
          executeTransferRef.current = false;

          if (success) {
            setStatusMessage({
              type: 'success',
              message: `✓ Pallet ${selectedPallet.plt_num} successfully moved to ${selectedDestination}`,
            });
            setSearchValue('');
            setSelectedPallet(null);
            // Reset transfer key after successful transfer
            lastExecutedTransferRef.current = '';
            // Direct focus without dependency
            setTimeout(() => {
              if (searchInputRef?.current) {
                searchInputRef.current.focus();
              }
            }, 100);
          } else {
            setStatusMessage({
              type: 'error',
              message: `✗ Failed to transfer pallet ${selectedPallet.plt_num}`,
            });
          }
        })
        .catch(() => {
          // Ensure refs are reset even on error
          executeTransferRef.current = false;
          lastExecutedTransferRef.current = '';
        });
    } else if (!selectedPallet || !selectedDestination || !verifiedClockNumber) {
      // Reset refs when conditions are not met
      executeTransferRef.current = false;
    }
  }, [
    selectedPallet,
    selectedDestination,
    verifiedClockNumber,
    isTransferring,
    executeStockTransfer,
    searchInputRef,
  ]); // Include missing dependencies

  // Update current location based on selected pallet
  useEffect(() => {
    if (selectedPallet) {
      const rawLocation = selectedPallet.current_plt_loc || selectedPallet.location || 'Await';
      const standardizedLocation = LocationStandardizer.standardizeForUI(rawLocation);
      setCurrentLocation(standardizedLocation);
    }
  }, [selectedPallet]);

  // Set default destination based on current location - only when currentLocation changes
  // Use refs to avoid circular dependency with selectedDestination
  const lastCurrentLocation = useRef(currentLocation);
  const selectedDestinationRef = useRef(selectedDestination);

  // Update ref on every render to keep it in sync
  selectedDestinationRef.current = selectedDestination;

  useEffect(() => {
    // Only update if current location actually changed and no destination is already selected
    if (lastCurrentLocation.current !== currentLocation && !selectedDestinationRef.current) {
      const getDefaultDestination = (location: string): string => {
        switch (location) {
          case 'Await':
          case 'Await_grn':
            return 'Fold Mill';
          case 'Fold Mill':
          case 'PipeLine':
            return 'Production';
          default:
            return 'Fold Mill';
        }
      };

      const defaultDest = getDefaultDestination(currentLocation);
      // Only update if the new default is different from current selection
      if (defaultDest !== selectedDestinationRef.current) {
        setSelectedDestination(defaultDest);
      }
      lastCurrentLocation.current = currentLocation;
    }
  }, [currentLocation]); // Removed selectedDestination from dependencies to break cycle

  // Cleanup optimistic transfers
  useEffect(() => {
    const interval = setInterval(() => {
      setOptimisticTransfers(prev =>
        prev.filter(t => t.status === 'pending' || Date.now() - t.timestamp < 5000)
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Memoize state object to prevent recreation on every render
  const state: StockTransferState = useMemo(
    () => ({
      isLoading,
      isSearching,
      isTransferring,
      optimisticTransfers,
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
    }),
    [
      isLoading,
      isSearching,
      isTransferring,
      optimisticTransfers,
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
    ]
  );

  // Memoize actions object to prevent recreation on every render
  const actions: StockTransferActions = useMemo(
    () => ({
      setIsLoading,
      setSearchValue,
      setSelectedDestination,
      setClockNumber,
      setStatusMessage,
      executeStockTransfer,
      validateClockNumberLocal,
      handleSearchSelect,
      handleClockNumberChange,
      handleVerifyClockNumber,
      focusSearchInput,
      resetToSearch,
      onDestinationChange,
    }),
    [
      handleSearchSelect,
      handleClockNumberChange,
      handleVerifyClockNumber,
      onDestinationChange,
      executeStockTransfer,
      focusSearchInput,
      resetToSearch,
      validateClockNumberLocal,
    ]
  ); // Include all dependencies

  return { state, actions };
};

export default useStockTransfer;
