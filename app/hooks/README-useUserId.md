# useUserId Hook 使用指南

## 概述

`useUserId` 是一個統一的用戶身份獲取 Hook，整合了整個系統中分散的用戶身份邏輯。

## 主要功能

- 🔐 自動獲取當前登入用戶的 clock number
- 🔄 實時監聽認證狀態變化
- 👤 提供完整用戶詳細信息
- 💾 內建 5 分鐘緩存機制
- 🛡️ 統一錯誤處理

## 基本使用

### 1. 獲取用戶 ID (Clock Number)

```tsx
import { useUserId } from '@/app/hooks/useUserId';

function MyComponent() {
  const { userId, isLoading } = useUserId();

  if (isLoading) return <div>Loading...</div>;

  return <div>User ID: {userId}</div>;
}
```

### 2. 獲取完整用戶資料

```tsx
function UserProfile() {
  const { userDetails, isLoading, error } = useUserId();

  if (isLoading) return <Spinner />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Welcome, {userDetails?.name}</h2>
      <p>Department: {userDetails?.department}</p>
      <p>Clock Number: {userDetails?.clockNumber}</p>
    </div>
  );
}
```

### 3. 驗證用戶 ID

```tsx
function OperatorVerification() {
  const { verifyUserId } = useUserId();

  const handleVerify = async (inputId: string) => {
    const numericId = parseInt(inputId, 10);
    const isValid = await verifyUserId(numericId);

    if (isValid) {
      console.log('Valid operator ID');
    } else {
      console.log('Invalid operator ID');
    }
  };
}
```

## 返回值說明

```typescript
interface UseUserIdReturn {
  // 核心數據
  userId: string | null;           // Clock number (例如: "1234")
  userNumericId: number | null;    // data_id 表的數字 ID
  userDetails: UserDetails | null;  // 完整用戶詳情

  // 狀態
  isLoading: boolean;              // 加載中
  error: Error | null;             // 錯誤信息
  isAuthenticated: boolean;        // 是否已認證

  // 操作
  refreshUser: () => Promise<void>;                    // 刷新用戶數據
  verifyUserId: (userId: number) => Promise<boolean>;  // 驗證用戶 ID
}
```

## 兼容性 Hooks

為了向後兼容，提供以下簡化版本：

### useClockNumber

只返回 clock number：

```tsx
import { useClockNumber } from '@/app/hooks/useUserId';

function SimpleComponent() {
  const clockNumber = useClockNumber();
  return <div>Clock: {clockNumber}</div>;
}
```

### useUserNumericId

只返回數字 ID：

```tsx
import { useUserNumericId } from '@/app/hooks/useUserId';

function NumericIdComponent() {
  const numericId = useUserNumericId();
  return <div>ID: {numericId}</div>;
}
```

## 遷移指南

### 從舊的 useAuth 遷移

Before:
```tsx
const { getUserId } = useAuth({ setUserId });
```

After:
```tsx
const { userId, refreshUser } = useUserId();
```

### 從 getCurrentUserId 函數遷移

Before:
```tsx
const supabase = createClient();
const userId = await getCurrentUserId(supabase);
```

After:
```tsx
const { userId } = useUserId();
```

### 從手動提取 clock number 遷移

Before:
```tsx
const clockNumber = user.email.split('@')[0];
```

After:
```tsx
const { userId } = useUserId();
```

## 性能優化

- 內建 5 分鐘緩存，減少重複數據庫查詢
- 自動去重並發請求
- 智能刷新機制

## 錯誤處理

Hook 內建錯誤處理，會自動：
- 記錄錯誤到 console
- 設置 error 狀態
- 顯示 toast 通知（非認證錯誤）

## 最佳實踐

1. **在頂層組件使用**：減少重複初始化

```tsx
// App.tsx
function App() {
  const { userId, isLoading } = useUserId();

  if (isLoading) return <LoadingScreen />;

  return <RouterProvider userId={userId} />;
}
```

2. **配合 Context 使用**：避免 prop drilling

```tsx
const UserContext = createContext<UseUserIdReturn | null>(null);

function AppProvider({ children }) {
  const userIdData = useUserId();

  return (
    <UserContext.Provider value={userIdData}>
      {children}
    </UserContext.Provider>
  );
}
```

3. **處理加載狀態**：提供良好用戶體驗

```tsx
function Component() {
  const { userId, isLoading, error } = useUserId();

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorBoundary error={error} />;
  if (!userId) return <LoginPrompt />;

  return <MainContent userId={userId} />;
}
```

## 注意事項

- Hook 必須在 React 組件內使用
- 需要有效的 Supabase 認證
- Clock number 格式必須是 `數字@domain.com`
- 緩存會在登出時自動清除
