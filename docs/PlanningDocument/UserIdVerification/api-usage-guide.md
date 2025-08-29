# getUserId Hook API 使用指南

_建立日期: 2025-08-29_  
_版本: 1.0.0_  
_狀態: 生產就緒_

## 快速開始

### 安裝與引入

```typescript
import { getUserId } from '@/app/hooks/getUserId';
```

### 基本使用

```typescript
function MyComponent() {
  const { userId, loading, error } = getUserId();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!userId) return <div>Not authenticated</div>;

  return <div>User ID: {userId}</div>;
}
```

## API 參考

### Hook 簽名

```typescript
function getUserId(): UseUserIdReturn;
```

### 返回值

```typescript
interface UseUserIdReturn {
  userId: string | null;
  loading: boolean;
  error: Error | null;
}
```

#### 屬性說明

| 屬性      | 類型             | 說明                                    |
| --------- | ---------------- | --------------------------------------- |
| `userId`  | `string \| null` | 當前用戶的唯一標識符。未登錄時為 `null` |
| `loading` | `boolean`        | 指示是否正在獲取用戶信息                |
| `error`   | `Error \| null`  | 獲取用戶信息時的錯誤對象                |

## 使用場景

### 場景 1：條件渲染

```typescript
function ConditionalContent() {
  const { userId, loading } = getUserId();

  if (loading) {
    return <Skeleton className="h-32 w-full" />;
  }

  return userId ? (
    <AuthenticatedContent userId={userId} />
  ) : (
    <PublicContent />
  );
}
```

### 場景 2：數據獲取

```typescript
function UserDataFetcher() {
  const { userId, loading, error } = getUserId();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (userId && !loading && !error) {
      fetchUserData(userId).then(setUserData);
    }
  }, [userId, loading, error]);

  return <UserProfile data={userData} />;
}
```

### 場景 3：表單提交

```typescript
function SubmitForm() {
  const { userId } = getUserId();
  const [formData, setFormData] = useState({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!userId) {
      alert('Please login first');
      return;
    }

    await submitData({
      ...formData,
      userId,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### 場景 4：權限檢查

```typescript
function AdminPanel() {
  const { userId, loading } = getUserId();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (userId && !loading) {
      checkAdminStatus(userId).then(setIsAdmin);
    }
  }, [userId, loading]);

  if (!isAdmin) {
    return <div>Access denied</div>;
  }

  return <AdminDashboard />;
}
```

## 進階用法

### 與 React Query 整合

```typescript
import { useQuery } from '@tanstack/react-query';
import { getUserId } from '@/app/hooks/getUserId';

function UserOrders() {
  const { userId } = getUserId();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', userId],
    queryFn: () => fetchUserOrders(userId),
    enabled: !!userId, // 只在有 userId 時執行
  });

  if (isLoading) return <div>Loading orders...</div>;

  return <OrderList orders={orders} />;
}
```

### 與 Zustand 整合

```typescript
import { getUserId } from '@/app/hooks/getUserId';
import { useStore } from '@/store';

function SyncUserState() {
  const { userId } = getUserId();
  const setCurrentUser = useStore(state => state.setCurrentUser);

  useEffect(() => {
    setCurrentUser(userId);
  }, [userId, setCurrentUser]);

  return null;
}
```

### 自定義錯誤處理

```typescript
function CustomErrorHandler() {
  const { userId, loading, error } = getUserId();

  useEffect(() => {
    if (error) {
      // 發送錯誤到監控服務
      logError({
        message: 'Failed to get user ID',
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      // 顯示用戶友好的錯誤消息
      toast.error('Authentication error. Please try logging in again.');
    }
  }, [error]);

  return <div>{/* Component content */}</div>;
}
```

## 最佳實踐

### 1. 早期返回模式

```typescript
function BestPracticeComponent() {
  const { userId, loading, error } = getUserId();

  // 早期返回，處理邊緣情況
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!userId) return <LoginPrompt />;

  // 主要邏輯
  return <AuthenticatedContent userId={userId} />;
}
```

### 2. 錯誤邊界整合

```typescript
class AuthErrorBoundary extends Component {
  componentDidCatch(error: Error) {
    if (error.message.includes('authentication')) {
      // 重定向到登錄頁
      window.location.href = '/login';
    }
  }

  render() {
    return this.props.children;
  }
}

function App() {
  return (
    <AuthErrorBoundary>
      <ComponentUsingUserId />
    </AuthErrorBoundary>
  );
}
```

### 3. 類型安全使用

```typescript
interface UserData {
  id: string;
  name: string;
  email: string;
}

function TypeSafeComponent() {
  const { userId, loading, error } = getUserId();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;

      const userData = await getUserData(userId);
      setUser(userData);
    };

    fetchUser();
  }, [userId]);

  return user ? <UserInfo user={user} /> : null;
}
```

## 常見問題

### Q1: Hook 可以在服務端使用嗎？

**A**: `getUserId` 是一個客戶端 Hook，設計用於 React 組件中。對於服務端驗證，請使用：

```typescript
// 服務端（API Route）
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;
  // ...
}
```

### Q2: 如何處理 userId 變化？

**A**: Hook 會自動響應用戶登錄/登出事件：

```typescript
function ReactToUserChange() {
  const { userId } = getUserId();

  useEffect(() => {
    if (userId) {
      console.log('User logged in:', userId);
      // 執行登錄後的初始化
    } else {
      console.log('User logged out');
      // 清理用戶數據
    }
  }, [userId]);

  return <div>{/* Component */}</div>;
}
```

### Q3: 如何測試使用 getUserId 的組件？

**A**: 使用 mock 來測試：

```typescript
// __tests__/MyComponent.test.tsx
import { render } from '@testing-library/react';
import { getUserId } from '@/app/hooks/getUserId';

jest.mock('@/app/hooks/getUserId');

describe('MyComponent', () => {
  it('renders with user ID', () => {
    (getUserId as jest.Mock).mockReturnValue({
      userId: 'test-user-123',
      loading: false,
      error: null
    });

    const { getByText } = render(<MyComponent />);
    expect(getByText('test-user-123')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    (getUserId as jest.Mock).mockReturnValue({
      userId: null,
      loading: true,
      error: null
    });

    const { getByText } = render(<MyComponent />);
    expect(getByText('Loading...')).toBeInTheDocument();
  });
});
```

### Q4: 性能優化建議？

**A**: Hook 已經過優化，但可以進一步優化使用：

```typescript
// 使用 memo 避免不必要的重渲染
const UserInfo = memo(({ userId }: { userId: string }) => {
  return <div>User: {userId}</div>;
});

// 使用 useMemo 快取計算結果
function OptimizedComponent() {
  const { userId } = getUserId();

  const userDisplayName = useMemo(() => {
    if (!userId) return 'Guest';
    return `User-${userId.slice(0, 8)}`;
  }, [userId]);

  return <div>{userDisplayName}</div>;
}
```

## 故障排除

### 問題：userId 始終為 null

**可能原因**：

1. 用戶未登錄
2. Supabase 配置錯誤
3. 網絡連接問題

**解決方案**：

```typescript
// 檢查 Supabase 配置
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// 檢查網絡狀態
if (!navigator.onLine) {
  console.error('No internet connection');
}
```

### 問題：loading 狀態持續很長時間

**可能原因**：

1. 認證服務響應緩慢
2. 網絡延遲

**解決方案**：

```typescript
// 添加超時處理
function TimeoutHandler() {
  const { loading } = getUserId();
  const [timeout, setTimeout] = useState(false);

  useEffect(() => {
    if (loading) {
      const timer = window.setTimeout(() => {
        setTimeout(true);
      }, 5000); // 5秒超時

      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (timeout) {
    return <div>Taking too long. Please refresh the page.</div>;
  }

  return <div>{/* Normal content */}</div>;
}
```

## 版本歷史

| 版本  | 日期       | 變更                 |
| ----- | ---------- | -------------------- |
| 1.0.0 | 2025-08-29 | 初始版本，統一化實施 |

## 相關文檔

- [重構記錄](./refactoring-documentation.md)
- [統一化計劃](./UserIdVerification-Unification-Plan.md)
- [技術棧文檔](../../TechStack/FrontEnd.md)

---

**維護者**: System Development Team  
**最後更新**: 2025-08-29  
**支援**: 如有問題，請聯繫技術支援團隊
