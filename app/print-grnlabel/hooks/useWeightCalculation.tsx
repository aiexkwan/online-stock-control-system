'use client';

import { useMemo, useCallback } from 'react';
import { 
  PALLET_WEIGHTS, 
  PACKAGE_WEIGHTS,
  calculateNetWeight,
  type PalletTypeKey,
  type PackageTypeKey 
} from '@/app/constants/grnConstants';

interface UseWeightCalculationProps {
  grossWeights: string[];
  palletType: Record<PalletTypeKey, string>;
  packageType: Record<PackageTypeKey, string>;
}

interface UseWeightCalculationReturn {
  // 計算結果
  totalGrossWeight: number;
  totalNetWeight: number;
  averageNetWeight: number;
  validWeightsCount: number;
  selectedPalletType: PalletTypeKey;
  selectedPackageType: PackageTypeKey;
  
  // 輔助函數
  getNetWeightForPallet: (grossWeight: number) => number;
  getTotalPalletWeight: () => number;
  getTotalPackageWeight: () => number;
  isWeightValid: (weight: string) => boolean;
}

/**
 * Hook for handling weight calculations
 * 處理重量計算邏輯
 */
export const useWeightCalculation = ({
  grossWeights,
  palletType,
  packageType
}: UseWeightCalculationProps): UseWeightCalculationReturn => {
  
  // 獲取選中的托盤類型
  const selectedPalletType = useMemo(() => {
    const entry = Object.entries(palletType).find(([_, value]) => 
      value && parseInt(value) > 0
    );
    return (entry?.[0] as PalletTypeKey) || 'notIncluded';
  }, [palletType]);

  // 獲取選中的包裝類型
  const selectedPackageType = useMemo(() => {
    const entry = Object.entries(packageType).find(([_, value]) => 
      value && parseInt(value) > 0
    );
    return (entry?.[0] as PackageTypeKey) || 'notIncluded';
  }, [packageType]);

  // 有效重量列表
  const validWeights = useMemo(() => {
    return grossWeights
      .map(w => parseFloat(w))
      .filter(w => !isNaN(w) && w > 0);
  }, [grossWeights]);

  // 計算總毛重
  const totalGrossWeight = useMemo(() => {
    return validWeights.reduce((sum, weight) => sum + weight, 0);
  }, [validWeights]);

  // 計算總淨重
  const totalNetWeight = useMemo(() => {
    return validWeights.reduce((sum, weight) => {
      const netWeight = calculateNetWeight(weight, selectedPalletType, selectedPackageType);
      return sum + netWeight;
    }, 0);
  }, [validWeights, selectedPalletType, selectedPackageType]);

  // 計算平均淨重
  const averageNetWeight = useMemo(() => {
    if (validWeights.length === 0) return 0;
    return totalNetWeight / validWeights.length;
  }, [totalNetWeight, validWeights.length]);

  // 獲取單個托盤的淨重
  const getNetWeightForPallet = useCallback((grossWeight: number) => {
    return calculateNetWeight(grossWeight, selectedPalletType, selectedPackageType);
  }, [selectedPalletType, selectedPackageType]);

  // 獲取總托盤重量
  const getTotalPalletWeight = useCallback(() => {
    const palletCount = parseInt(palletType[selectedPalletType] || '0');
    return palletCount * PALLET_WEIGHTS[selectedPalletType];
  }, [palletType, selectedPalletType]);

  // 獲取總包裝重量
  const getTotalPackageWeight = useCallback(() => {
    const packageCount = parseInt(packageType[selectedPackageType] || '0');
    return packageCount * PACKAGE_WEIGHTS[selectedPackageType];
  }, [packageType, selectedPackageType]);

  // 驗證重量是否有效
  const isWeightValid = useCallback((weight: string) => {
    const numWeight = parseFloat(weight);
    return !isNaN(numWeight) && numWeight > 0;
  }, []);

  return {
    totalGrossWeight,
    totalNetWeight,
    averageNetWeight,
    validWeightsCount: validWeights.length,
    selectedPalletType,
    selectedPackageType,
    getNetWeightForPallet,
    getTotalPalletWeight,
    getTotalPackageWeight,
    isWeightValid
  };
};

export default useWeightCalculation;