// 產品顏色選項
export const PRODUCT_COLOURS = [
  { value: '', label: 'Select colour...' },
  { value: 'Yellow', label: 'Yellow' },
  { value: 'Grey', label: 'Grey' },
  { value: 'Old World Red', label: 'Old World Red' },
  { value: 'Green', label: 'Green' },
  { value: 'Black', label: 'Black' },
] as const;

// 產品類型選項
export const PRODUCT_TYPES = [
  { value: '', label: 'Select type...' },
  { value: 'SupaStack', label: 'SupaStack' },
  { value: 'Manhole', label: 'Manhole' },
  { value: 'Slate', label: 'Slate' },
  { value: 'ACO', label: 'ACO' },
  { value: 'EasyStack', label: 'EasyStack' },
  { value: 'EcoPlus', label: 'EcoPlus' },
  { value: 'EasyLiner', label: 'EasyLiner' },
  { value: 'Easystack Chamber', label: 'Easystack Chamber' },
  { value: 'EasyLadder', label: 'EasyLadder' },
  { value: 'Parts', label: 'Parts' },
  { value: 'Material', label: 'Material' },
  { value: 'Pipes', label: 'Pipes' },
  { value: 'Tools', label: 'Tools' },
] as const;

// 表單驗證規則
export const VALIDATION_RULES = {
  code: {
    required: true,
    message: 'Product Code is required',
    maxLength: 50,
  },
  description: {
    required: true,
    message: 'Product Description is required',
    maxLength: 200,
  },
  colour: {
    required: false,
  },
  standard_qty: {
    required: false,
    type: 'number',
    min: 0,
  },
  type: {
    required: false,
  },
} as const;
