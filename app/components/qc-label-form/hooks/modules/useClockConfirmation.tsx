/**
 * useClockConfirmation Hook
 * 處理時鐘編號確認對話框和冷卻期管理
 */

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { isProduction } from '../../../../../lib/utils/env';
import { COOLDOWN_PERIOD_PROD, COOLDOWN_PERIOD_DEV } from '../../constants';

/**
 * 列印事件類型定義
 * @description DTO 用於處理列印相關事件的資料結構
 */
export interface PrintEvent {
  /** 事件類型 */
  type: string;
  /** 事件相關資料 */
  data?: Record<string, unknown>;
  /** 事件完成後的回調函數 */
  callback?: () => void;
  /** 其他擴展屬性 */
  [key: string]: unknown;
}

/**
 * useClockConfirmation Hook 回傳類型
 */
interface UseClockConfirmationReturn {
  /** 時鐘編號確認對話框是否開啟 */
  isClockConfirmOpen: boolean;
  /** 設定時鐘編號確認對話框開啟狀態 */
  setIsClockConfirmOpen: (open: boolean) => void;
  /** 待處理的列印事件 */
  printEventToProceed: PrintEvent | null;
  /** 設定待處理的列印事件 */
  setPrintEventToProceed: (event: PrintEvent | null) => void;
  /** 取消時鐘編號確認 */
  handleClockNumberCancel: () => void;
  /** 檢查是否在冷卻期內 */
  checkCooldownPeriod: () => boolean;
  /** 設置冷卻期計時器 */
  setCooldownTimer: () => void;
}

export const useClockConfirmation = (): UseClockConfirmationReturn => {
  // 時鐘編號確認對話框狀態
  const [isClockConfirmOpen, setIsClockConfirmOpen] = useState(false);
  const [printEventToProceed, setPrintEventToProceed] = useState<PrintEvent | null>(null);

  // 冷卻期管理
  const lastConfirmationTimeRef = useRef<number | null>(null);

  // 取消時鐘編號確認
  const handleClockNumberCancel = useCallback(() => {
    setIsClockConfirmOpen(false);
    setPrintEventToProceed(null);
  }, []);

  // 檢查是否在冷卻期內
  const checkCooldownPeriod = useCallback((): boolean => {
    if (!lastConfirmationTimeRef.current) {
      return false; // 沒有上次確認時間，不在冷卻期
    }

    const now = Date.now();
    const cooldownPeriod = isProduction() ? COOLDOWN_PERIOD_PROD : COOLDOWN_PERIOD_DEV;

    const timeSinceLastConfirmation = now - lastConfirmationTimeRef.current;
    const isInCooldown = timeSinceLastConfirmation < cooldownPeriod;

    if (isInCooldown) {
      const remainingTime = Math.ceil((cooldownPeriod - timeSinceLastConfirmation) / 1000);
      toast.warning(`Please wait ${remainingTime} seconds before generating another label`);
    }

    return isInCooldown;
  }, []);

  // 設置冷卻期計時器
  const setCooldownTimer = useCallback(() => {
    lastConfirmationTimeRef.current = Date.now();
  }, []);

  return {
    isClockConfirmOpen,
    setIsClockConfirmOpen,
    printEventToProceed,
    setPrintEventToProceed,
    handleClockNumberCancel,
    checkCooldownPeriod,
    setCooldownTimer,
  };
};
