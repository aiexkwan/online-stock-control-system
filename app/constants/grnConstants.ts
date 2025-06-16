/**
 * GRN Label 系統常量定義
 * 將所有硬編碼的值提取為常量，提高可維護性
 */

// 托盤重量常量 (單位: kg)
export const PALLET_WEIGHTS = {
  whiteDry: 14,
  whiteWet: 18,
  chepDry: 26,
  chepWet: 38,
  euro: 22,
  notIncluded: 0,
} as const;

// 包裝重量常量 (單位: kg)
export const PACKAGE_WEIGHTS = {
  still: 50,
  bag: 1,
  tote: 10,
  octo: 20,
  notIncluded: 0,
} as const;

// 系統限制常量
export const SYSTEM_LIMITS = {
  MAX_PALLETS: 22,
  MIN_PALLETS: 1,
  MAX_WEIGHT: 9999,
  MIN_WEIGHT: 0,
  MAX_QUANTITY: 99999,
  MIN_QUANTITY: 1,
} as const;

// 標籤模式常量
export const LABEL_MODES = {
  QUANTITY: 'qty',
  WEIGHT: 'weight',
} as const;

// 托盤類型選項
export const PALLET_TYPE_OPTIONS = [
  { key: 'whiteDry', label: 'White Dry', weight: PALLET_WEIGHTS.whiteDry },
  { key: 'whiteWet', label: 'White Wet', weight: PALLET_WEIGHTS.whiteWet },
  { key: 'chepDry', label: 'Chep Dry', weight: PALLET_WEIGHTS.chepDry },
  { key: 'chepWet', label: 'Chep Wet', weight: PALLET_WEIGHTS.chepWet },
  { key: 'euro', label: 'Euro', weight: PALLET_WEIGHTS.euro },
  { key: 'notIncluded', label: 'Not Included', weight: PALLET_WEIGHTS.notIncluded },
] as const;

// 包裝類型選項
export const PACKAGE_TYPE_OPTIONS = [
  { key: 'still', label: 'Still', weight: PACKAGE_WEIGHTS.still },
  { key: 'bag', label: 'Bag', weight: PACKAGE_WEIGHTS.bag },
  { key: 'tote', label: 'Tote', weight: PACKAGE_WEIGHTS.tote },
  { key: 'octo', label: 'Octo', weight: PACKAGE_WEIGHTS.octo },
  { key: 'notIncluded', label: 'Not Included', weight: PACKAGE_WEIGHTS.notIncluded },
] as const;

// 類型定義
export type PalletTypeKey = keyof typeof PALLET_WEIGHTS;
export type PackageTypeKey = keyof typeof PACKAGE_WEIGHTS;
export type LabelMode = typeof LABEL_MODES[keyof typeof LABEL_MODES];

// 輔助函數
export const getPalletLabel = (index: number): string => {
  const n = index + 1;
  if (n === 1) return '1st Pallet';
  if (n === 2) return '2nd Pallet';
  if (n === 3) return '3rd Pallet';
  if (n === 21) return '21st Pallet';
  if (n === 22) return '22nd Pallet';
  return `${n}th Pallet`;
};

// 計算淨重
export const calculateNetWeight = (
  grossWeight: number,
  palletType: PalletTypeKey,
  packageType: PackageTypeKey
): number => {
  const palletWeight = PALLET_WEIGHTS[palletType] || 0;
  const packageWeight = PACKAGE_WEIGHTS[packageType] || 0;
  return Math.max(0, grossWeight - palletWeight - packageWeight);
};

// 驗證重量輸入
export const validateWeight = (weight: string): boolean => {
  const numWeight = parseFloat(weight);
  return !isNaN(numWeight) && 
         numWeight > SYSTEM_LIMITS.MIN_WEIGHT && 
         numWeight <= SYSTEM_LIMITS.MAX_WEIGHT;
};

// 驗證數量輸入
export const validateQuantity = (quantity: string): boolean => {
  const numQuantity = parseInt(quantity);
  return !isNaN(numQuantity) && 
         numQuantity >= SYSTEM_LIMITS.MIN_QUANTITY && 
         numQuantity <= SYSTEM_LIMITS.MAX_QUANTITY;
};