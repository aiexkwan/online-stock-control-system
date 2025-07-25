/**
 * GRN Constants Type Definitions
 * Type definitions extracted from grnConstants.ts
 */

// 托盤重量常量類型
export type PalletWeights = {
  readonly whiteDry: number;
  readonly whiteWet: number;
  readonly chepDry: number;
  readonly chepWet: number;
  readonly euro: number;
  readonly notIncluded: number;
};

// 包裝重量常量類型
export type PackageWeights = {
  readonly still: number;
  readonly bag: number;
  readonly tote: number;
  readonly octo: number;
  readonly notIncluded: number;
};

// 系統限制常量類型
export type SystemLimits = {
  readonly MAX_PALLETS: number;
  readonly MIN_PALLETS: number;
  readonly MAX_WEIGHT: number;
  readonly MIN_WEIGHT: number;
  readonly MAX_QUANTITY: number;
  readonly MIN_QUANTITY: number;
};

// 標籤模式常量類型
export type LabelModes = {
  readonly QUANTITY: string;
  readonly WEIGHT: string;
};

// 托盤類型選項介面
export interface PalletTypeOption {
  readonly key: string;
  readonly label: string;
  readonly weight: number;
}

// 包裝類型選項介面
export interface PackageTypeOption {
  readonly key: string;
  readonly label: string;
  readonly weight: number;
}

// 類型定義
export type PalletTypeKey =
  | 'whiteDry'
  | 'whiteWet'
  | 'chepDry'
  | 'chepWet'
  | 'euro'
  | 'notIncluded';
export type PackageTypeKey = 'still' | 'bag' | 'tote' | 'octo' | 'notIncluded';
export type LabelMode = 'qty' | 'weight';
