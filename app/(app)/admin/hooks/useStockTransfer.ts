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
  // getTransferHistory, // Unused import
  validateTransferDestination,
  validateClockNumber,
  // TransferHistoryItem, // Unused import
  OptimisticTransfer,
} from '@/app/actions/stockTransferActions';
// Removed unused import: LOCATION_DESTINATIONS
import { LocationStandardizer } from '../utils/locationStandardizer';
import type { SearchInputRef } from '@/components/compatibility';

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
  // 組件狀態管理，包括記憶體洩漏防護
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());

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

  // 安全的 setTimeout wrapper，自動追蹤並在組件卸載時清理
  const safeSetTimeout = useCallback((fn: () => void, delay: number) => {
    if (!mountedRef.current) return;

    const timeoutId = setTimeout(() => {
      if (mountedRef.current) {
        try {
          fn();
        } catch (error) {
          console.error('SafeSetTimeout error:', error);
        }
      }
      timeoutsRef.current.delete(timeoutId);
    }, delay);

    timeoutsRef.current.add(timeoutId);
    return timeoutId;
  }, []);

  // 組件卸載時的強化版清理函式
  useEffect(() => {
    const currentTimeouts = timeoutsRef.current;
    const currentAbortController = abortControllerRef.current;

    return () => {
      mountedRef.current = false;

      // 清理所有 AbortController
      if (currentAbortController) {
        currentAbortController.abort();
      }

      // 清理所有追蹤的定時器
      if (currentTimeouts) {
        currentTimeouts.forEach(timeoutId => {
          clearTimeout(timeoutId);
        });
        currentTimeouts.clear();
      }
    };
  }, []);

  // Focus search input helper
  const focusSearchInput = useCallback(() => {
    safeSetTimeout(() => {
      if (searchInputRef?.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  }, [searchInputRef, safeSetTimeout]);

  // API 請求去重緩存機制
  const transferRequestCache = useRef<Map<string, Promise<boolean>>>(new Map());
  const pendingRequestsRef = useRef<Set<string>>(new Set());

  // Execute stock transfer 優化版：支援請求去重、緩存和防止並發
  const executeStockTransfer = useCallback(
    async (palletInfo: PalletInfo, toLocation: string, operatorId: string): Promise<boolean> => {
      // 檢查組件是否仍然掛載
      if (!mountedRef.current) return false;

      // 生成請求唯一鍵（用於去重）
      const requestKey = `${palletInfo.plt_num}-${toLocation}-${operatorId}`;

      // 防止重複請求：檢查是否有相同的請求正在進行
      if (pendingRequestsRef.current.has(requestKey)) {
        console.log(`[API優化] 防止重複請求: ${requestKey}`);
        toast.warning(`Transfer for ${palletInfo.plt_num} is already in progress`);
        return false;
      }

      // 檢查請求緩存（短期緩存，防止快速重複點擊）
      const cachedPromise = transferRequestCache.current.get(requestKey);
      if (cachedPromise) {
        console.log(`[API優化] 使用緩存請求: ${requestKey}`);
        return cachedPromise;
      }

      const transferId = `${palletInfo.plt_num}-${Date.now()}`;
      const fromLocation = palletInfo.current_plt_loc || palletInfo.location || 'Unknown';

      // 檢查樂觀更新狀態，防止重複
      let hasPending = false;
      setOptimisticTransfers(prev => {
        hasPending = prev.some(t => t.pltNum === palletInfo.plt_num && t.status === 'pending');
        return prev;
      });

      if (hasPending) {
        toast.warning(`Pallet ${palletInfo.plt_num} has a pending transfer. Please wait.`);
        return false;
      }

      // 創建樂觀更新項目
      const optimisticEntry: OptimisticTransfer = {
        id: transferId,
        pltNum: palletInfo.plt_num,
        fromLocation,
        toLocation,
        status: 'pending',
        timestamp: Date.now(),
      };

      // 創建請求 Promise（用於去重和緩存）
      const transferPromise = (async (): Promise<boolean> => {
        // 標記請求為進行中
        pendingRequestsRef.current.add(requestKey);

        setOptimisticTransfers(prev => [...prev, optimisticEntry]);
        setIsTransferring(true);

        // 創建新的 AbortController 用於這次轉移操作
        const transferAbortController = new AbortController();
        abortControllerRef.current = transferAbortController;

        try {
          // 檢查是否已被中斷
          if (transferAbortController.signal.aborted || !mountedRef.current) {
            return false;
          }

          // 驗證轉移目的地
          const validation = await validateTransferDestination(palletInfo.plt_num, toLocation);

          // 再次檢查中斷狀態
          if (transferAbortController.signal.aborted || !mountedRef.current) {
            return false;
          }

          if (!validation.valid) {
            const errorMessage = validation.message || 'Invalid transfer';

            // 優化錯誤處理：批量更新狀態
            if (mountedRef.current) {
              setIsTransferring(false);
              setOptimisticTransfers(prev =>
                prev.map(t => (t.id === transferId ? { ...t, status: 'failed' } : t))
              );
            }

            toast.error(errorMessage);
            if (onTransferError) {
              onTransferError(errorMessage);
            }
            return false;
          }

          // 執行實際的轉移操作
          const result = await transferPallet(palletInfo.plt_num, toLocation);

          // 操作完成後再次檢查中斷狀態
          if (transferAbortController.signal.aborted || !mountedRef.current) {
            return false;
          }

          if (result.success) {
            // 成功處理
            if (mountedRef.current) {
              setOptimisticTransfers(prev =>
                prev.map(t => (t.id === transferId ? { ...t, status: 'success' } : t))
              );
            }

            toast.success(result.message);

            // 成功回調
            if (onTransferComplete) {
              onTransferComplete(palletInfo, toLocation);
            }

            return true;
          } else {
            // 失敗處理
            if (mountedRef.current) {
              setOptimisticTransfers(prev =>
                prev.map(t => (t.id === transferId ? { ...t, status: 'failed' } : t))
              );
            }

            const errorMessage = result.error || 'Transfer failed';
            toast.error(errorMessage);

            if (onTransferError) {
              onTransferError(errorMessage);
            }

            return false;
          }
        } catch (error) {
          // 錯誤處理：區分不同類型的錯誤
          if (error instanceof Error && error.name === 'AbortError') {
            // 被取消的請求，靜默處理
            return false;
          }

          if (mountedRef.current) {
            setOptimisticTransfers(prev =>
              prev.map(t => (t.id === transferId ? { ...t, status: 'failed' } : t))
            );
          }

          const errorMessage = error instanceof Error ? error.message : 'Transfer failed';
          toast.error(errorMessage);

          if (onTransferError) {
            onTransferError(errorMessage);
          }

          return false;
        } finally {
          // 清理工作
          if (abortControllerRef.current === transferAbortController) {
            abortControllerRef.current = null;
          }

          if (mountedRef.current) {
            setIsTransferring(false);
          }

          // 從進行中請求集合中移除
          pendingRequestsRef.current.delete(requestKey);

          // 清理緩存（3秒後過期）
          setTimeout(() => {
            transferRequestCache.current.delete(requestKey);
          }, 3000);
        }
      })();

      // 將 Promise 加入緩存
      transferRequestCache.current.set(requestKey, transferPromise);

      return transferPromise;
    },
    [onTransferComplete, onTransferError]
  );

  // Clock number validation 強化版，支援中斷和記憶體洩漏防護
  const validateClockNumberLocal = useCallback(async (clockNum: string): Promise<boolean> => {
    // 檢查組件是否仍然掛載
    if (!mountedRef.current) return false;

    try {
      const result = await validateClockNumber(clockNum);

      // 檢查組件是否在異步操作期間被卸載
      if (!mountedRef.current) return false;

      if (!result.success) {
        if (mountedRef.current) {
          setClockError(result.error || 'Clock number not found');
        }
        return false;
      }
      if (result.data) {
        if (mountedRef.current) {
          setClockError('');
          setVerifiedClockNumber(clockNum);
          setVerifiedName(result.data.name);
        }
        return true;
      }
      if (mountedRef.current) {
        setClockError('No user data received');
      }
      return false;
    } catch (error) {
      if (mountedRef.current) {
        setClockError('Validation error occurred');
      }
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

  // 搜索請求去重緩存
  const searchRequestCache = useRef<Map<string, Promise<void>>>(new Map());
  const searchPendingRef = useRef<Set<string>>(new Set());

  // Handle search result selection 優化版：支援請求去重和增強錯誤處理
  const handleSearchSelect = useCallback((result: SearchResult) => {
    // 檢查組件是否仍然掛載
    if (!mountedRef.current) return;

    const searchValueExtracted =
      Array.isArray(result.data) && result.data.length > 0
        ? typeof result.data[0]?.value === 'string'
          ? result.data[0].value
          : result.title
        : result.title || '';

    if (!searchValueExtracted || !mountedRef.current) return;

    // 防止重複搜索相同的值
    if (searchPendingRef.current.has(searchValueExtracted)) {
      console.log(`[API優化] 防止重複搜索: ${searchValueExtracted}`);
      return;
    }

    // 檢查搜索緩存
    const cachedSearch = searchRequestCache.current.get(searchValueExtracted);
    if (cachedSearch) {
      console.log(`[API優化] 使用緩存搜索: ${searchValueExtracted}`);
      return;
    }

    // 創建搜索 Promise
    const searchPromise = (async (): Promise<void> => {
      // 標記搜索為進行中
      searchPendingRef.current.add(searchValueExtracted);
      setIsSearching(true);

      // 創建專用的 AbortController 用於搜索操作
      const searchAbortController = new AbortController();
      abortControllerRef.current = searchAbortController;

      try {
        const searchResult = await searchPalletAuto(searchValueExtracted);

        // 檢查是否已被中斷或組件已卸載
        if (searchAbortController.signal.aborted || !mountedRef.current) {
          return;
        }

        if (searchResult.success && searchResult.data) {
          if (mountedRef.current) {
            setSelectedPallet(searchResult.data);
            // 清空搜索值，表示搜索完成
            setSearchValue('');
          }
        } else {
          // 增強錯誤處理：提供更具體的錯誤信息
          const errorMessage = searchResult.error || `Pallet "${searchValueExtracted}" not found`;
          toast.error(errorMessage);

          // 保留搜索值以便用戶修改
          if (mountedRef.current) {
            setSearchValue(searchValueExtracted);
          }
        }
      } catch (error) {
        // 區分不同類型的錯誤
        if (error instanceof Error && error.name === 'AbortError') {
          // 被取消的請求，靜默處理
          return;
        }

        if (mountedRef.current) {
          // 網絡錯誤或其他錯誤
          const errorMessage =
            error instanceof Error
              ? `Search failed: ${error.message}`
              : 'Search failed: Unknown error';
          toast.error(errorMessage);

          // 保留搜索值以便用戶重試
          setSearchValue(searchValueExtracted);
        }
      } finally {
        // 清理工作
        if (abortControllerRef.current === searchAbortController) {
          abortControllerRef.current = null;
        }

        if (mountedRef.current) {
          setIsSearching(false);
        }

        // 從進行中集合中移除
        searchPendingRef.current.delete(searchValueExtracted);

        // 清理緩存（2秒後過期）
        setTimeout(() => {
          searchRequestCache.current.delete(searchValueExtracted);
        }, 2000);
      }
    })();

    // 將 Promise 加入緩存
    searchRequestCache.current.set(searchValueExtracted, searchPromise);
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
    safeSetTimeout(() => {
      if (searchInputRef?.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  }, [searchInputRef, safeSetTimeout]); // Include safeSetTimeout dependency

  // API 調用優化：使用更簡潔的執行狀態管理與防重複調用機制
  const [transferExecutionState, setTransferExecutionState] = useState({
    isExecuting: false,
    lastExecutedKey: '',
    executionLock: false, // 防止並發執行
  });

  // 自動執行邏輯簡化：使用 useEffect 監聽依賴變化
  useEffect(() => {
    // 生成唯一的轉移識別鍵
    const transferKey = `${selectedPallet?.plt_num}-${selectedDestination}-${verifiedClockNumber}`;

    // 優化條件檢查：簡化邏輯，防止重複調用
    if (
      selectedPallet &&
      selectedDestination &&
      verifiedClockNumber &&
      !transferExecutionState.isExecuting && // 防止正在執行時重複調用
      !transferExecutionState.executionLock && // 防止並發執行
      transferExecutionState.lastExecutedKey !== transferKey // 防止相同轉移重複執行
    ) {
      // 設置執行鎖，防止並發執行
      setTransferExecutionState({
        isExecuting: true,
        lastExecutedKey: transferKey,
        executionLock: true,
      });

      // 使用 AbortController 支援請求取消
      const transferController = new AbortController();
      abortControllerRef.current = transferController;

      // 執行轉移操作，with enhanced error handling
      executeStockTransfer(selectedPallet, selectedDestination, verifiedClockNumber)
        .then(success => {
          // 檢查是否被取消
          if (transferController.signal.aborted || !mountedRef.current) {
            return;
          }

          if (success) {
            // 成功處理：優化狀態更新
            setStatusMessage({
              type: 'success',
              message: `✓ Pallet ${selectedPallet.plt_num} successfully moved to ${selectedDestination}`,
            });

            // 批量狀態更新，減少重新渲染
            setSearchValue('');
            setSelectedPallet(null);

            // 重置執行狀態，但保留 lastExecutedKey 防止重複執行
            setTransferExecutionState(prev => ({
              ...prev,
              isExecuting: false,
              executionLock: false,
            }));

            // 優化焦點管理
            safeSetTimeout(() => {
              if (searchInputRef?.current && mountedRef.current) {
                searchInputRef.current.focus();
              }
            }, 100);
          } else {
            // 錯誤處理：保留錯誤狀態，允許重試
            setStatusMessage({
              type: 'error',
              message: `✗ Failed to transfer pallet ${selectedPallet.plt_num}`,
            });

            // 重置執行狀態，清除 lastExecutedKey 允許重試
            setTransferExecutionState({
              isExecuting: false,
              lastExecutedKey: '', // 允許重試相同的轉移
              executionLock: false,
            });
          }
        })
        .catch(error => {
          // 錯誤處理優化：區分不同類型的錯誤
          if (error instanceof Error && error.name === 'AbortError') {
            // 被取消的請求，靜默處理
            return;
          }

          if (mountedRef.current) {
            // 網絡或其他錯誤，顯示錯誤消息
            const errorMessage = error instanceof Error ? error.message : 'Transfer failed';
            setStatusMessage({
              type: 'error',
              message: `✗ ${errorMessage}`,
            });

            // 重置執行狀態，允許重試
            setTransferExecutionState({
              isExecuting: false,
              lastExecutedKey: '', // 允許重試
              executionLock: false,
            });
          }
        })
        .finally(() => {
          // 清理 AbortController
          if (abortControllerRef.current === transferController) {
            abortControllerRef.current = null;
          }

          // 最終清理執行鎖（增加安全性）
          if (mountedRef.current) {
            setTransferExecutionState(prev => ({
              ...prev,
              executionLock: false,
            }));
          }
        });
    }

    // 當條件不滿足時，重置執行狀態
    if (!selectedPallet || !selectedDestination || !verifiedClockNumber) {
      // 只在執行中或有鎖時才重置，避免不必要的更新
      if (transferExecutionState.isExecuting || transferExecutionState.executionLock) {
        setTransferExecutionState(prev => ({
          ...prev,
          isExecuting: false,
          executionLock: false,
        }));
      }
    }
  }, [
    selectedPallet,
    selectedDestination,
    verifiedClockNumber,
    transferExecutionState.isExecuting,
    transferExecutionState.lastExecutedKey,
    transferExecutionState.executionLock,
    executeStockTransfer,
    searchInputRef,
    safeSetTimeout,
  ]);

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
