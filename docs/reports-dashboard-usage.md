# 報表儀表板使用指南

## 概述
報表儀表板已改為對話框模式，可以在任何頁面中嵌入和使用，無需導航到獨立頁面。

## 使用方式

### 1. 使用報表按鈕組件

最簡單的方式是使用 `ReportsButton` 組件：

```tsx
import { ReportsButton } from '@/app/components/reports/ReportsButton';

// 在任何頁面或組件中使用
export function MyComponent() {
  return (
    <div>
      {/* 標準按鈕 */}
      <ReportsButton />
      
      {/* 自定義樣式 */}
      <ReportsButton 
        variant="outline"
        size="sm"
        className="my-custom-class"
      >
        查看報表
      </ReportsButton>
      
      {/* 圖標按鈕（適合導航欄） */}
      <ReportsIconButton />
    </div>
  );
}
```

### 2. 使用 Hook（程式化控制）

如果需要程式化控制報表儀表板的開關：

```tsx
import { ReportsDashboardProvider, useReportsDashboard } from '@/app/components/reports/useReportsDashboard';

// 首先在父組件包裝 Provider
function App() {
  return (
    <ReportsDashboardProvider>
      <YourComponent />
    </ReportsDashboardProvider>
  );
}

// 然後在子組件中使用 Hook
function YourComponent() {
  const { openReportsDashboard } = useReportsDashboard();
  
  const handleCustomAction = () => {
    // 執行某些邏輯後開啟報表儀表板
    doSomething();
    openReportsDashboard();
  };
  
  return (
    <button onClick={handleCustomAction}>
      開啟報表
    </button>
  );
}
```

### 3. 在現有頁面中集成

#### 範例：在 Admin 頁面添加報表按鈕

```tsx
// app/admin/page.tsx
import { ReportsButton } from '@/app/components/reports/ReportsButton';

export default function AdminPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1>Admin Dashboard</h1>
        <ReportsButton variant="outline" />
      </div>
      {/* 其他內容 */}
    </div>
  );
}
```

#### 範例：在導航欄添加報表圖標

```tsx
// components/Navbar.tsx
import { ReportsIconButton } from '@/app/components/reports/ReportsButton';

export function Navbar() {
  return (
    <nav className="flex items-center gap-4">
      <Link href="/">首頁</Link>
      <Link href="/admin">管理</Link>
      <ReportsIconButton className="ml-auto" />
    </nav>
  );
}
```

## 特點

1. **無需路由跳轉**：對話框模式，不會離開當前頁面
2. **全局可用**：可以在任何頁面或組件中使用
3. **響應式設計**：自適應不同螢幕尺寸
4. **搜索和過濾**：快速找到需要的報表
5. **分類顯示**：按報表類型組織

## 報表類型

- **營運報表 (Operational)**：Void Pallet、Order Loading 等
- **庫存報表 (Inventory)**：Stock Take 等
- **財務報表 (Financial)**：預留類別
- **品質報表 (Quality)**：預留類別

## 自定義整合

如果需要在特定情況下觸發報表儀表板，可以：

1. 使用 `ReportsButton` 組件並自定義樣式
2. 使用 `useReportsDashboard` Hook 進行程式化控制
3. 直接使用 `ReportsDashboardDialog` 組件並管理其狀態

## 注意事項

- 報表儀表板會自動加載所有已註冊的報表
- 新增報表後會自動出現在儀表板中
- 對話框模式不會影響 URL，適合嵌入各種場景