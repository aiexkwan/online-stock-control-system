# 前端技術棧 (Frontend Technology Stack)

_最後更新日期: 2025-09-02 11:46:01_

## 核心框架與語言

- **框架**: [Next.js](https://nextjs.org/) 15.4.4, [React](https://react.dev/) 18.3.1
- **語言**: [TypeScript](https://www.typescriptlang.org/) 5.8.3
- **渲染模式**: App Router (基於 `app/` 目錄結構)
- **React Strict Mode**: 禁用，建議在開發環境啟用

## UI 與視覺

- **UI**: [Tailwind CSS](https://tailwindcss.com/) 3.4.17, [Radix UI](https://www.radix-ui.com/) - 16個 UI 組件
- **視覺特效**: [Framer Motion](https://www.framer.com/motion/) 11.18.2
- **圖標**: [Lucide React](https://lucide.dev/) 0.467.0, [Heroicons](https://heroicons.com/) 2.2.0

## 狀態管理與資料請求

- **狀態管理**: [Zustand](https://zustand-demo.pmnd.rs/) 5.0.5, [@tanstack/react-query](https://tanstack.com/query/latest) 5.62.11
- **資料請求**: [Apollo Client](https://www.apollographql.com/docs/react/) 3.13.8

### 設計理念與最佳實踐

我們採用 `React Query` + `Zustand` 的組合來管理前端狀態，目標是實現**伺服器狀態**與**客戶端狀態**的明確分離。

- **`@tanstack/react-query` (伺服器狀態)**
  - **職責**: 專門負責處理所有與後端 API 相關的數據，包括快取、同步、過期數據重新獲取等。
  - **最佳實踐**:
    - 任何來自後端的數據都應優先使用 `useQuery` 或 `useMutation` 進行管理。
    - 透過 `queryKey` 精準控制快取，實現高效的數據共享與更新。
    - 避免將伺服器狀態手動存入 `Zustand` store，應讓 `React Query` 自動管理其生命週期。

- **`Zustand` (客戶端狀態)**
  - **職責**: 負責管理純粹的客戶端狀態，例如：UI 主題（淺色/深色模式）、對話框的開啟狀態、未提交的表單數據等。
  - **最佳實踐**:
    - Store 應該保持小而專注，每個 store 只管理一個特定的業務領域。
    - 優先使用 `slice` 模式來組織大型 store，以保持代碼的可維護性。
    - **代碼範例 (Slice 模式)**:

      ```typescript
      // stores/uiSlice.ts
      export const createUISlice = set => ({
        isSidebarOpen: true,
        toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
      });

      // stores/index.ts
      import { create } from 'zustand';
      import { createUISlice } from './uiSlice';

      export const useBoundStore = create((...a) => ({
        ...createUISlice(...a),
      }));
      ```

## 前端架構

- **目錄結構**: `app/` 目錄核心結構 - `(app)`/`(auth)` 分組路由
- **路由機制**: Next.js App Router 配置
- **組件設計**: 18張管理卡片 + 模組化共用組件
- **部署優化**: Vercel 獨立輸出模式 (`standalone`), ISR 啟用
- **圖像優化**: WebP, AVIF 格式支援

### 組件架構現況 (Component Architecture Status)

系統已完成核心組件架構重構，採用 **Atomic Design 原則結合分層架構** 的現代化組件系統：

#### 組件分布統計

- **總組件數量**: 237個 TypeScript 組件檔案
- **架構實施狀態**: ✅ 已完成 Phases 1-4 (100% 完成)

| 組件層級                 | 路徑                     | 檔案數 | 狀態      | 描述                           |
| ------------------------ | ------------------------ | ------ | --------- | ------------------------------ |
| **Atoms (原子組件)**     | `/components/ui/`        | 53個   | ✅ 完成   | 基礎 UI 組件 (Radix UI + 自訂) |
| **Molecules (分子組件)** | `/components/molecules/` | 17個   | ✅ 完成   | 對話框、載入、行動端組件       |
| **Organisms (有機組件)** | `/components/organisms/` | -      | 🚧 準備中 | 複雜互動組件                   |
| **Templates (模板組件)** | `/components/templates/` | 12個   | ✅ 完成   | 通用佈局模板                   |
| **Business (業務組件)**  | `/components/business/`  | 25個   | ✅ 完成   | 業務邏輯組件                   |
| **Domain (領域組件)**    | `/components/domain/`    | -      | 🚧 準備中 | 特定領域組件                   |
| **Providers (提供者)**   | `/components/providers/` | -      | 🚧 準備中 | 上下文提供者                   |
| **Features (功能組件)**  | `/components/features/`  | 17個   | ✅ 完成   | 特定功能模組                   |
| **Shared (共用組件)**    | `/components/shared/`    | -      | 📋 計劃中 | 跨領域共用組件                 |
| **Legacy (遺留組件)**    | `/app/components/`       | 113個  | ⚠️ 待遷移 | 應用層級功能組件               |

## 統一化 Hooks

### 用戶ID驗證 Hook

- **`getUserId` (統一解決方案)**
  - **位置**: `app/hooks/getUserId.ts`
  - **職責**: 提供統一的用戶ID獲取介面，整合 Supabase 認證系統
  - **特性**:
    - 自動處理認證狀態檢查
    - 提供載入狀態和錯誤處理
    - 支援客戶端和服務端渲染
    - 完整的 TypeScript 類型支援
  - **使用範例**:

    ```typescript
    import { getUserId } from '@/app/hooks/getUserId';

    function MyComponent() {
      const { userId, loading, error } = getUserId();

      if (loading) return <div>Loading...</div>;
      if (error) return <div>Error: {error.message}</div>;
      if (!userId) return <div>Please login</div>;

      return <div>User ID: {userId}</div>;
    }
    ```

  - **遷移指南**:
    - 所有舊的 `getUserId()` 或 `getCurrentUserId()` 呼叫應遷移至 `getUserId`
    - 避免直接使用 `supabase.auth.getUser()`，應透過 `getUserId` 統一管理

## 組件架構與類型系統

### TypeScript 路徑別名配置

系統已配置完整的 TypeScript 路徑別名，支援現代化的組件導入模式：

```typescript
// 原子組件 (UI 基礎)
"@/ui/*": ["./components/ui/*"]

// 分子組件 (複合 UI)
"@/molecules/*": ["./components/molecules/*"]

// 有機組件 (複雜互動)
"@/organisms/*": ["./components/organisms/*"]

// 模板組件 (佈局)
"@/templates/*": ["./components/templates/*"]

// 業務組件 (業務邏輯)
"@/business/*": ["./components/business/*"]

// 領域組件 (特定領域)
"@/domain/*": ["./components/domain/*"]

// 提供者組件 (上下文)
"@/providers/*": ["./components/providers/*"]
```

### 統一類型系統

- **核心位置**: `/types/shared/index.ts`
- **統一介面**: 507行完整類型定義
- **主要類型**: `ProductInfo`, `ChartDataPoint`, `ApiResponse`, `SystemError`
- **工具類型**: `DeepReadonly`, `MutableProductInfo`, `AsyncState`
- **類型守衛**: `isProductInfo()`, `isChartDataPoint()`, `isSuccessfulApiResponse()`
- **工廠函數**: `createEmptyAsyncState()`, `createLoadingAsyncState()`

### 組件導入最佳實踐

```typescript
// ✅ 推薦做法 - 使用別名
import { Button } from '@/ui/button';
import { ConfirmDialog } from '@/molecules/dialogs/ConfirmDialog';
import { ProductInfo } from '@/types/shared';

// ❌ 避免 - 相對路徑
import { Button } from '../../../components/ui/button';
import { ProductInfo } from '../../../types/ProductInfo';
```

### 遷移進度追蹤

#### 已完成階段 (Phases 1-3)

- ✅ **Phase 1**: TypeScript 路徑別名配置
- ✅ **Phase 2**: 核心目錄結構建立
- ✅ **Phase 3**: 統一類型系統實施

#### 進行中階段 (Phase 4)

- 🚧 **Phase 4**: 組件物理遷移 (進行中)
  - **已遷移**: 119個核心組件 (atoms, molecules, templates, business, features)
  - **相容性層**: 舊路徑向後相容導出
  - **待遷移**: 113個應用層級組件 (`/app/components/`)

#### 成功指標

- **類型安全**: 100% TypeScript 覆蓋
- **導入一致性**: 統一別名使用
- **架構清晰度**: 明確的組件層級劃分
- **維護性**: 單一真相來源原則
- **開發體驗**: 更好的 IntelliSense 支援
