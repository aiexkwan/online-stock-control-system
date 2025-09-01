# 前端技術棧 (Frontend Technology Stack)

_最後更新日期: 2025-09-01 22:54:59_

## 核心框架與語言

- **框架**: [Next.js](https://nextjs.org/) 15.4.4, [React](https://react.dev/) 18.3.1
- **語言**: [TypeScript](https://www.typescriptlang.org/) 5.8.3
- **渲染模式**: App Router (基於 `app/` 目錄結構)
- **React Strict Mode**: 禁用，建議在開發環境啟用

## UI 與視覺

- **UI**: [Tailwind CSS](https://tailwindcss.com/) 3.4.17, [Radix UI](https://www.radix-ui.com/) - 15個 UI 組件
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
- **核心通用組件**: `components/ui/` (49個組件), `lib/card-system/` (8個文件)
- **部署優化**: Vercel 獨立輸出模式 (`standalone`), ISR 啟用
- **圖像優化**: WebP, AVIF 格式支援

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
