/**
 * 統一的共享業務組件導出文件
 *
 * @description 此文件統一導出所有合併後的共享業務組件，
 * 確保組件的一致性和可維護性。所有組件都已經過合併優化，
 * 整合了多個版本的最佳功能。
 *
 * @file /components/business/shared/index.ts
 * @author Frontend Architecture Expert
 * @since 2025-09-02
 */

// ============================================================================
// 進度條組件 (Progress Components)
// ============================================================================

/**
 * 增強型進度條組件
 *
 * @description 統一的進度條組件，整合了基礎功能與性能優化功能：
 * - 支援四種進度狀態：Pending、Processing、Success、Failed
 * - 響應式設計，支援移動端和桌面端
 * - 防抖更新機制，提升大量數據更新時的性能
 * - 性能監控功能，可追蹤渲染性能
 * - 緊湊和詳細兩種顯示模式
 * - 完整的視覺反饋和動畫效果
 *
 * @merged_from
 * - /app/components/qc-label-form/EnhancedProgressBar.tsx
 * - /app/(app)/admin/components/EnhancedProgressBar.tsx
 */
export {
  EnhancedProgressBar,
  type ProgressStatus,
  default as DefaultEnhancedProgressBar,
} from './EnhancedProgressBar';

// ============================================================================
// 對話框組件 (Dialog Components)
// ============================================================================

/**
 * Clock Number 確認對話框組件
 *
 * @description 統一的時鐘號碼確認對話框，整合了兩個版本的功能：
 * - 支援自動填充預設時鐘號碼
 * - 雙重驗證機制：Supabase 直接查詢和 API 端點驗證
 * - 完整的錯誤處理和用戶反饋
 * - 自動焦點管理和鍵盤交互
 * - 數字輸入驗證和格式化
 *
 * @merged_from
 * - /app/components/qc-label-form/ClockNumberConfirmDialog.tsx
 * - /app/(app)/admin/components/ClockNumberConfirmDialog.tsx
 */
export {
  ClockNumberConfirmDialog,
  default as DefaultClockNumberConfirmDialog,
} from './ClockNumberConfirmDialog';

// ============================================================================
// 類型定義重新導出 (Type Re-exports)
// ============================================================================

/**
 * 重新導出統一的類型定義
 *
 * @description 確保所有使用這些組件的地方都能夠訪問到統一的類型定義
 */
// 注意：ProgressStatus 類型已經在上面的 EnhancedProgressBar 導出中包含

// ============================================================================
// 組件元數據 (Component Metadata)
// ============================================================================

/**
 * 組件元數據
 *
 * @description 提供組件的版本、作者和合併歷史資訊
 */
export const COMPONENT_METADATA = {
  version: '2.0.0',
  mergedAt: '2025-09-02',
  author: 'Frontend Architecture Expert',
  mergedComponents: [
    {
      name: 'EnhancedProgressBar',
      originalPaths: [
        '/app/components/qc-label-form/EnhancedProgressBar.tsx',
        '/app/(app)/admin/components/EnhancedProgressBar.tsx',
      ],
      features: [
        'Basic progress tracking',
        'Performance optimization with debouncing',
        'Mobile responsiveness',
        'Animation effects',
        'Status categorization',
        'Performance monitoring',
      ],
    },
    {
      name: 'ClockNumberConfirmDialog',
      originalPaths: [
        '/app/components/qc-label-form/ClockNumberConfirmDialog.tsx',
        '/app/(app)/admin/components/ClockNumberConfirmDialog.tsx',
      ],
      features: [
        'Basic clock number validation',
        'Auto-fill support',
        'Dual validation mechanism',
        'Error handling',
        'Accessibility support',
        'Smart validation fallback',
      ],
    },
  ],
} as const;
