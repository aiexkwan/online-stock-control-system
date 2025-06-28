// Component Standards - NewPennine 組件標準規範

export const componentStandards = {
  // 命名規範
  naming: {
    // 組件命名 - 使用 PascalCase
    components: {
      pattern: /^[A-Z][a-zA-Z0-9]*$/,
      examples: ['Button', 'DialogHeader', 'VirtualTable'],
      antiPatterns: ['button', 'dialog-header', 'virtual_table'],
    },
    
    // 文件命名 - 組件文件使用 PascalCase
    files: {
      component: '{ComponentName}.tsx',
      styles: '{ComponentName}.module.css',
      test: '{ComponentName}.test.tsx',
      story: '{ComponentName}.stories.tsx',
    },
    
    // Props 接口命名
    props: {
      pattern: '{ComponentName}Props',
      example: 'ButtonProps',
    },
    
    // 變體命名 - 使用 kebab-case
    variants: {
      pattern: /^[a-z][a-z0-9-]*$/,
      examples: ['primary', 'secondary', 'danger-outline'],
    }
  },
  
  // 目錄結構
  structure: {
    // UI 組件目錄結構
    ui: {
      base: '/components/ui/',
      categories: {
        core: 'core/',         // 核心組件 (Button, Input, etc.)
        layout: 'layout/',     // 佈局組件 (Grid, Stack, etc.)
        feedback: 'feedback/', // 反饋組件 (Dialog, Toast, etc.)
        display: 'display/',   // 展示組件 (Card, Table, etc.)
        navigation: 'navigation/', // 導航組件 (Menu, Tabs, etc.)
        forms: 'forms/',       // 表單組件 (Form, Field, etc.)
        mobile: 'mobile/',     // 移動端組件
      }
    },
    
    // 業務組件目錄結構
    business: {
      base: '/app/components/',
      pattern: '{feature}/{ComponentName}.tsx',
      example: 'inventory/InventoryTable.tsx',
    }
  },
  
  // 組件規範
  component: {
    // 基礎結構
    template: `
import * as React from 'react'
import { cn } from '@/lib/utils'
import { designTokens } from '@/lib/design-system/tokens'

export interface {ComponentName}Props extends React.HTMLAttributes<HTMLDivElement> {
  // Props definition
}

/**
 * {ComponentName} - {Brief description}
 * 
 * @example
 * <{ComponentName} variant="primary">
 *   Content
 * </{ComponentName}>
 */
export const {ComponentName} = React.forwardRef<
  HTMLDivElement,
  {ComponentName}Props
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        // Base styles
        className
      )}
      {...props}
    />
  )
})

{ComponentName}.displayName = '{ComponentName}'
    `.trim(),
    
    // 必須包含
    requirements: [
      'TypeScript 類型定義',
      'JSDoc 註釋',
      'displayName 設置',
      'forwardRef 支持（如適用）',
      '使用 cn 工具合併 className',
      '支持所有原生 HTML 屬性',
    ],
    
    // 最佳實踐
    bestPractices: [
      '優先使用組合而非繼承',
      '保持組件單一職責',
      '提供合理的默認值',
      '避免內聯樣式',
      '使用語義化 HTML',
      '確保鍵盤可訪問性',
      '支持 RTL 佈局',
    ]
  },
  
  // Props 規範
  props: {
    // 通用 props
    common: {
      variant: {
        type: 'string',
        description: '組件變體',
        values: ['primary', 'secondary', 'outline', 'ghost', 'link'],
      },
      size: {
        type: 'string',
        description: '組件大小',
        values: ['sm', 'md', 'lg'],
      },
      disabled: {
        type: 'boolean',
        description: '是否禁用',
      },
      loading: {
        type: 'boolean',
        description: '是否加載中',
      },
    },
    
    // 命名約定
    conventions: [
      '使用 is/has 前綴表示布爾值',
      '使用 on 前綴表示事件處理器',
      '使用複數形式表示數組',
      '避免縮寫（除非廣泛認可）',
    ]
  },
  
  // 樣式規範
  styling: {
    // 使用 Tailwind CSS
    approach: 'utility-first',
    
    // 樣式組織
    organization: {
      base: '基礎樣式（定位、尺寸）',
      theme: '主題樣式（顏色、字體）',
      state: '狀態樣式（hover、focus、disabled）',
      responsive: '響應式樣式',
      animation: '動畫樣式',
    },
    
    // 樣式優先級
    priority: [
      '1. 設計系統 tokens',
      '2. Tailwind 工具類',
      '3. CSS modules（複雜樣式）',
      '4. 內聯樣式（動態值）',
    ],
    
    // 禁止事項
    avoid: [
      '避免 !important',
      '避免內聯樣式對象',
      '避免硬編碼顏色值',
      '避免硬編碼尺寸值',
    ]
  },
  
  // 無障礙規範
  accessibility: {
    requirements: [
      'ARIA 標籤和屬性',
      '鍵盤導航支持',
      'Focus 樣式清晰',
      '顏色對比度達標',
      '錯誤提示明確',
      '加載狀態通知',
    ],
    
    // ARIA 模式
    patterns: {
      button: {
        role: 'button',
        attributes: ['aria-label', 'aria-pressed', 'aria-disabled'],
      },
      dialog: {
        role: 'dialog',
        attributes: ['aria-modal', 'aria-labelledby', 'aria-describedby'],
      },
      navigation: {
        role: 'navigation',
        attributes: ['aria-label', 'aria-current'],
      }
    }
  },
  
  // 性能規範
  performance: {
    guidelines: [
      '使用 React.memo 優化重渲染',
      '使用 useMemo/useCallback 優化計算',
      '實施代碼分割（大型組件）',
      '使用虛擬化（長列表）',
      '優化圖片加載',
      '避免不必要的狀態提升',
    ],
    
    // 性能指標
    metrics: {
      renderTime: '< 16ms',
      interactionDelay: '< 100ms',
      bundleSize: '< 50KB（單個組件）',
    }
  },
  
  // 測試規範
  testing: {
    requirements: [
      '單元測試覆蓋率 > 80%',
      '測試所有 props 變化',
      '測試用戶交互',
      '測試無障礙功能',
      '測試邊界情況',
    ],
    
    // 測試模式
    patterns: {
      unit: 'Jest + React Testing Library',
      visual: 'Storybook + Chromatic',
      e2e: 'Playwright（關鍵流程）',
    }
  },
  
  // 文檔規範
  documentation: {
    // JSDoc 模板
    jsDoc: `
/**
 * {組件簡述}
 * 
 * @description {詳細描述}
 * 
 * @example
 * // 基本用法
 * <Component />
 * 
 * // 進階用法
 * <Component variant="primary" size="lg" />
 * 
 * @see {@link https://example.com/docs} 文檔鏈接
 */
    `.trim(),
    
    // README 結構
    readme: [
      '組件概述',
      'API 文檔',
      '使用示例',
      '樣式定制',
      '無障礙說明',
      '性能考慮',
      '常見問題',
    ]
  }
} as const;

// 輔助類型
export type ComponentCategory = keyof typeof componentStandards.structure.ui.categories;
export type ComponentStandard = typeof componentStandards;

// 驗證函數
export const validateComponentName = (name: string): boolean => {
  return componentStandards.naming.components.pattern.test(name);
};

export const validateVariantName = (name: string): boolean => {
  return componentStandards.naming.variants.pattern.test(name);
};

// 生成組件模板
export const generateComponentTemplate = (name: string): string => {
  return componentStandards.component.template
    .replace(/{ComponentName}/g, name);
};