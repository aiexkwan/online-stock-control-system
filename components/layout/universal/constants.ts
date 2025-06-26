/**
 * Universal Layout System Constants
 * 統一佈局系統常量定義
 */

import { UniversalTheme, ResponsiveBreakpoints } from './types';

// 響應式斷點 (與 Tailwind 一致)
export const BREAKPOINTS: ResponsiveBreakpoints = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// 間距對應表
export const SPACING_MAP = {
  none: '0',
  xs: '0.25rem',    // 1
  sm: '0.5rem',     // 2
  md: '1rem',       // 4
  lg: '1.5rem',     // 6
  xl: '2rem',       // 8
  '2xl': '3rem',    // 12
} as const;

// Tailwind 間距類名對應
export const SPACING_CLASSES = {
  none: '0',
  xs: '1',
  sm: '2', 
  md: '4',
  lg: '6',
  xl: '8',
  '2xl': '12',
} as const;

// 最大寬度對應表
export const MAX_WIDTH_CLASSES = {
  sm: 'max-w-sm',      // 384px
  md: 'max-w-md',      // 448px
  lg: 'max-w-lg',      // 512px
  xl: 'max-w-xl',      // 576px
  '2xl': 'max-w-2xl',  // 672px
  '3xl': 'max-w-3xl',  // 768px
  '4xl': 'max-w-4xl',  // 896px
  '5xl': 'max-w-5xl',  // 1024px
  '6xl': 'max-w-6xl',  // 1152px
  '7xl': 'max-w-7xl',  // 1280px
  full: 'max-w-full',
} as const;

// 預定義主題
export const THEMES: Record<string, UniversalTheme> = {
  admin: {
    name: 'Admin Dashboard',
    colors: {
      primary: '#3B82F6',     // blue-500
      secondary: '#8B5CF6',   // violet-500
      accent: '#06B6D4',      // cyan-500
      background: 'from-slate-900 via-slate-800 to-slate-900',
      surface: 'bg-white/3 backdrop-blur-md',
      text: {
        primary: '#FFFFFF',
        secondary: '#E2E8F0',
        muted: '#94A3B8',
      },
      border: 'border-slate-600/30',
      shadow: 'shadow-xl shadow-black/20',
    },
    effects: {
      blur: true,
      glow: true,
      gradient: true,
      animation: true,
    },
  },
  
  warehouse: {
    name: 'Warehouse Operations',
    colors: {
      primary: '#10B981',     // emerald-500
      secondary: '#059669',   // emerald-600
      accent: '#34D399',      // emerald-400
      background: 'from-emerald-900 via-slate-800 to-emerald-900',
      surface: 'bg-emerald-50/5 backdrop-blur-md',
      text: {
        primary: '#FFFFFF',
        secondary: '#D1FAE5',
        muted: '#A7F3D0',
      },
      border: 'border-emerald-600/30',
      shadow: 'shadow-xl shadow-emerald-900/20',
    },
    effects: {
      blur: true,
      glow: true,
      gradient: true,
      animation: true,
    },
  },
  
  production: {
    name: 'Production Management',
    colors: {
      primary: '#F59E0B',     // amber-500
      secondary: '#D97706',   // amber-600
      accent: '#FCD34D',      // amber-300
      background: 'from-amber-900 via-slate-800 to-amber-900',
      surface: 'bg-amber-50/5 backdrop-blur-md',
      text: {
        primary: '#FFFFFF',
        secondary: '#FEF3C7',
        muted: '#FBBF24',
      },
      border: 'border-amber-600/30',
      shadow: 'shadow-xl shadow-amber-900/20',
    },
    effects: {
      blur: true,
      glow: true,
      gradient: true,
      animation: true,
    },
  },
  
  qc: {
    name: 'Quality Control',
    colors: {
      primary: '#3B82F6',     // blue-500
      secondary: '#1E40AF',   // blue-700
      accent: '#60A5FA',      // blue-400
      background: 'from-slate-800/60 via-slate-800/40 to-blue-900/30',
      surface: 'bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-blue-900/30 backdrop-blur-xl',
      text: {
        primary: '#FFFFFF',
        secondary: '#DBEAFE',
        muted: '#93C5FD',
      },
      border: 'border-slate-600/30',
      shadow: 'shadow-2xl shadow-blue-900/10 hover:shadow-blue-800/20',
    },
    effects: {
      blur: true,
      glow: true,
      gradient: true,
      animation: true,
    },
  },
  
  grn: {
    name: 'Goods Receipt Note',
    colors: {
      primary: '#8B5CF6',     // violet-500
      secondary: '#7C3AED',   // violet-600
      accent: '#A78BFA',      // violet-400
      background: 'from-violet-900 via-slate-800 to-violet-900',
      surface: 'bg-violet-50/5 backdrop-blur-md',
      text: {
        primary: '#FFFFFF',
        secondary: '#DDD6FE',
        muted: '#C4B5FD',
      },
      border: 'border-violet-600/30',
      shadow: 'shadow-xl shadow-violet-900/20',
    },
    effects: {
      blur: true,
      glow: true,
      gradient: true,
      animation: true,
    },
  },
  
  neutral: {
    name: 'Neutral Theme',
    colors: {
      primary: '#6B7280',     // gray-500
      secondary: '#4B5563',   // gray-600
      accent: '#9CA3AF',      // gray-400
      background: 'from-gray-900 via-slate-800 to-gray-900',
      surface: 'bg-gray-50/5 backdrop-blur-md',
      text: {
        primary: '#FFFFFF',
        secondary: '#E5E7EB',
        muted: '#D1D5DB',
      },
      border: 'border-gray-600/30',
      shadow: 'shadow-xl shadow-gray-900/20',
    },
    effects: {
      blur: true,
      glow: false,
      gradient: false,
      animation: false,
    },
  },
};

// 佈局變體預設
export const LAYOUT_VARIANTS = {
  page: {
    container: 'page' as const,
    background: 'starfield' as const,
    padding: 'lg' as const,
    margin: 'none' as const,
    maxWidth: '7xl' as const,
    responsive: true,
  },
  
  section: {
    container: 'section' as const,
    background: 'transparent' as const,
    padding: 'md' as const,
    margin: 'md' as const,
    maxWidth: 'full' as const,
    responsive: true,
  },
  
  widget: {
    container: 'widget' as const,
    background: 'glass' as const,
    padding: 'md' as const,
    margin: 'none' as const,
    maxWidth: 'full' as const,
    responsive: true,
  },
  
  modal: {
    container: 'modal' as const,
    background: 'glass' as const,
    padding: 'lg' as const,
    margin: 'md' as const,
    maxWidth: 'lg' as const,
    responsive: true,
  },
  
  card: {
    container: 'card' as const,
    background: 'glass' as const,
    padding: 'md' as const,
    margin: 'sm' as const,
    maxWidth: 'full' as const,
    responsive: true,
  },
  
  form: {
    container: 'form' as const,
    background: 'glass' as const,
    padding: 'lg' as const,
    margin: 'md' as const,
    maxWidth: '2xl' as const,
    responsive: true,
  },
} as const;

// 網格預設配置
export const GRID_PRESETS = {
  // 1列網格 (手機)
  single: {
    columns: { xs: 1, sm: 1, md: 1, lg: 1, xl: 1, '2xl': 1 },
    gap: 'md' as const,
  },
  
  // 響應式雙列 (平板 2 列，桌面 2 列)
  responsive: {
    columns: { xs: 1, sm: 1, md: 2, lg: 2, xl: 2, '2xl': 2 },
    gap: 'lg' as const,
  },
  
  // QC/GRN 表單專用 (兼容現有)
  qcForm: {
    columns: { sm: 1, md: 2, lg: 2, xl: 3 },
    gap: 'lg' as const,
  },
  
  // Admin dashboard 網格
  admin: {
    columns: { xs: 1, sm: 2, md: 3, lg: 4, xl: 6, '2xl': 6 },
    gap: 'md' as const,
  },
  
  // 3 列網格
  triple: {
    columns: { xs: 1, sm: 2, md: 3, lg: 3, xl: 3, '2xl': 3 },
    gap: 'lg' as const,
  },
  
  // 4 列網格
  quad: {
    columns: { xs: 1, sm: 2, md: 2, lg: 4, xl: 4, '2xl': 4 },
    gap: 'md' as const,
  },
} as const;