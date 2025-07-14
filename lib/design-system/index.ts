/**
 * Design System Main Export
 * 設計系統主要導出
 */

// 導出所有設計系統模塊
export * from './colors';
export * from './typography';
export * from './spacing';

// 導入各模塊以便組合
import { cssVariables as colorVars } from './colors';
import { typographyCssVariables as typeVars } from './typography';
import { spacingCssVariables as spacingVars } from './spacing';

/**
 * 組合所有 CSS 變量
 */
export const designSystemCssVariables = `
${colorVars}
${typeVars}
${spacingVars}
`;

/**
 * 設計系統主題配置
 */
export const designSystemTheme = {
  // 擴展 Tailwind 配置
  extend: {
    colors: {
      // 品牌色
      primary: {
        50: '#fff7ed',
        100: '#ffedd5',
        200: '#fed7aa',
        300: '#fdba74',
        400: '#fb923c',
        500: '#f97316',
        600: '#ea580c',
        700: '#c2410c',
        800: '#9a3412',
        900: '#7c2d12',
      },
      secondary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
      },
    },
    fontFamily: {
      sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      display: ['Inter', '-apple-system', 'sans-serif'],
    },
    spacing: {
      // 自定義間距值將自動從 spacing.ts 導入
    },
  },
} as const;

/**
 * 設計系統使用指南
 */
export const designSystemGuidelines = {
  colors: {
    primary: 'Use for primary actions, key interactive elements',
    secondary: 'Use for secondary actions, supporting elements',
    semantic: 'Use semantic colors for status indicators',
    neutral: 'Use neutral colors for text and backgrounds',
  },
  typography: {
    headings: 'Use heading presets for consistent hierarchy',
    body: 'Use body presets for readable content',
    labels: 'Use label presets for form elements and buttons',
  },
  spacing: {
    rule: 'Follow the 8px grid system',
    components: 'Use componentSpacing for consistent component spacing',
    layout: 'Use layoutSpacing for page-level spacing',
  },
} as const;