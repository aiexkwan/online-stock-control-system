/**
 * useClockConfirmation Hook
 * 處理時鐘編號確認對話框和冷卻期管理
 */

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  COOLDOWN_PERIOD_PROD,
  COOLDOWN_PERIOD_DEV
} from '../../constants';

interface UseClockConfirmationReturn {
  isClockConfirmOpen: boolean;
  setIsClockConfirmOpen: (open: boolean) => void;
  printEventToProceed: any;
  setPrintEventToProceed: (event: any) => void;
  handleClockNumberCancel: () => void;
  checkCooldownPeriod: () => boolean;
  setCooldownTimer: () => void;
}

export const useClockConfirmation = (): UseClockConfirmationReturn => {
  // 時鐘編號確認對話框狀態
  const [isClockConfirmOpen, setIsClockConfirmOpen] = useState(false);
  const [printEventToProceed, setPrintEventToProceed] = useState<any>(null);
  
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
    const cooldownPeriod = process.env.NODE_ENV === 'production' 
      ? COOLDOWN_PERIOD_PROD 
      : COOLDOWN_PERIOD_DEV;
    
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
    setCooldownTimer
  };
};