/**
 * Loading Context
 * 載入狀態 Context 管理
 *
 * 提供全局載入狀態管理和智能載入策略
 */

'use client';

import { createContext, useContext } from 'react';
import { LoadingContextValue } from '../types';

// 創建 Loading Context
export const LoadingContext = createContext<LoadingContextValue | null>(null);

// Loading Context Hook
export function useLoadingContext(): LoadingContextValue {
  const context = useContext(LoadingContext);

  if (!context) {
    throw new Error('useLoadingContext must be used within a LoadingProvider');
  }

  return context;
}

// 檢查是否在 Loading Provider 內
export function useIsInLoadingProvider(): boolean {
  const context = useContext(LoadingContext);
  return context !== null;
}
