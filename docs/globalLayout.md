# Global Layout 系統文檔

## 概述
Global Layout 系統是整個應用程式的佈局架構，提供統一的用戶界面體驗。系統包含 GlobalHeader 常駐導航欄和 ClientLayout 佈局管理，確保所有頁面（除登入相關頁面外）都有一致的導航和用戶體驗。

## 系統架構

### 核心組件
- **GlobalHeader**: 常駐頂部導航欄 (`components/GlobalHeader.tsx`)
- **ClientLayout**: 主要佈局管理器 (`app/components/ClientLayout.tsx`)
- **RootLayout**: 根佈局配置 (`app/layout.tsx`)

### 組件層次結構
```
RootLayout
└── ClientLayout
    ├── GlobalHeader (條件渲染)
    ├── AuthStateSync
    ├── AuthMeta
    ├── AuthChecker
    └── children (頁面內容)
```

## GlobalHeader 組件

### 功能特色

#### 1. 響應式導航欄
- **固定定位**: `fixed top-0 left-0 right-0 z-40`
- **深色主題**: `bg-[#23263a]` 符合系統風格
- **三段式佈局**: 左側菜單 | 中央標題 | 右側登出

#### 2. 左側功能欄
- **漢堡菜單**: 點擊展開側邊欄
- **BALOLO 風格**: 白色背景、優雅間距、詳細描述
- **動畫效果**: Framer Motion 滑入/滑出動畫
- **點擊外部關閉**: 智能檢測點擊區域

#### 3. 功能選項
```typescript
const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/dashboard/access',
    icon: HomeIcon,
    description: 'Main dashboard and overview'
  },
  {
    id: 'admin',
    title: 'Admin Panel',
    path: '/admin',
    icon: CogIcon,
    description: 'System administration and management'
  },
  {
    id: 'print-label',
    title: 'Print Labels',
    path: '/print-label',
    icon: PrinterIcon,
    description: 'Print pallet and product labels'
  },
  {
    id: 'export-report',
    title: 'Export Reports',
    path: '/export-report',
    icon: DocumentTextIcon,
    description: 'Generate and export various reports'
  },
  {
    id: 'history',
    title: 'View History',
    path: '/view-history',
    icon: ClockIcon,
    description: 'View transaction and operation history'
  },
  {
    id: 'inventory',
    title: 'Inventory',
    path: '/inventory',
    icon: ChartBarIcon,
    description: 'Inventory management and tracking'
  }
];
```

#### 4. 中央標題區
- **動態問候語**: 根據時間顯示 Good Morning/Afternoon/Evening
- **用戶歡迎**: 顯示用戶顯示名稱或姓名
- **漸層效果**: `bg-gradient-to-r from-blue-400 to-purple-400`

#### 5. 右側登出功能
- **一鍵登出**: 紅色主題按鈕
- **完整流程**: Supabase 登出 → 清除本地數據 → 成功提示 → 跳轉登入
- **錯誤處理**: 登出失敗時的友好提示

### 技術實現

#### 用戶數據管理
```typescript
interface UserData {
  id: string;
  name?: string;
  email: string;
  clockNumber?: string;
  displayName?: string;
}

// 用戶數據獲取邏輯
const fetchUserData = async () => {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  // 提取 clock number
  const extractClockNumber = (email: string): string => {
    const match = email.match(/^(\d+)@/);
    return match ? match[1] : email.split('@')[0];
  };

  // 從 data_id 表獲取顯示名稱
  const { data: userData } = await supabase
    .from('data_id')
    .select('name')
    .eq('email', authUser.email)
    .single();
};
```

#### 條件渲染邏輯
```typescript
// 不在登入頁面且已認證時才顯示
const isLoginPage = pathname?.startsWith('/main-login') || pathname === '/';
if (isLoginPage || !isAuthenticated) {
  return null;
}
```

#### 側邊欄動畫
```typescript
// 側邊欄滑入動畫
<motion.div
  initial={{ x: -300 }}
  animate={{ x: 0 }}
  exit={{ x: -300 }}
  transition={{ type: "spring", damping: 25, stiffness: 200 }}
  className="fixed top-0 left-0 z-50 w-80 h-full bg-white shadow-2xl"
>
```

## ClientLayout 組件

### 功能特色

#### 1. 佈局管理
- **條件佈局**: 根據頁面類型選擇不同佈局
- **認證檢查**: 整合 AuthChecker 組件
- **狀態同步**: AuthStateSync 和 AuthMeta 管理

#### 2. 頁面分類
```typescript
// 隱藏 header 的頁面
const hideHeader = pathname === '/main-login' || 
                  pathname === '/change-password' || 
                  pathname === '/new-password' || 
                  pathname === '/';
```

#### 3. 臨時登入支援
- **臨時登入橫幅**: 密碼重設期間的提示
- **狀態檢測**: localStorage 檢查臨時登入標記
- **用戶提示**: 友好的操作指引

### 版本歷史

#### v3.0.0 - GlobalHeader 整合
**日期**: 2024年12月
**主要變更**:
- 創建 GlobalHeader 組件
- 重構 ClientLayout 整合 GlobalHeader
- 移除舊的 Navigation 組件
- 統一所有頁面的導航體驗

**技術改進**:
- 移除 `Navigation` 組件依賴
- 簡化佈局結構
- 優化認證流程
- 統一主題風格

#### v2.0.0 - 佈局優化
**日期**: 2024年11月
**主要變更**:
- 優化響應式設計
- 改善認證狀態管理
- 添加臨時登入支援
- 統一錯誤處理

#### v1.0.0 - 初始架構
**日期**: 2024年9月
**主要變更**:
- 建立基本佈局架構
- 整合認證系統
- 實現頁面路由管理

## 設計原則

### 1. 一致性
- **視覺一致性**: 所有頁面使用相同的 header 和導航
- **交互一致性**: 統一的用戶操作模式
- **主題一致性**: 深色主題和橙色強調色

### 2. 響應式設計
- **桌面優先**: 完整功能展示
- **平板適配**: 保持核心功能
- **手機友好**: 簡化但完整的體驗

### 3. 性能優化
- **條件渲染**: 只在需要時渲染 header
- **懶載入**: 按需載入組件
- **動畫優化**: 流暢但不影響性能的動畫

### 4. 可訪問性
- **鍵盤導航**: 支援 Tab 鍵導航
- **語義化 HTML**: 正確的 HTML 結構
- **顏色對比**: 符合 WCAG 標準的顏色對比

## 用戶體驗設計

### 導航體驗
1. **直觀的漢堡菜單**: 清晰的三線圖標
2. **詳細的功能描述**: 每個選項都有說明文字
3. **視覺反饋**: hover 和 active 狀態
4. **快速訪問**: 一鍵跳轉到目標頁面

### 認證體驗
1. **無縫登入**: 登入後自動顯示 header
2. **安全登出**: 完整的登出流程
3. **會話管理**: 自動處理會話過期
4. **錯誤處理**: 友好的錯誤提示

### 視覺設計
1. **現代化界面**: 漸層、陰影、圓角
2. **動畫效果**: 流暢的過渡動畫
3. **色彩系統**: 統一的色彩語言
4. **間距系統**: 一致的間距規範

## 技術架構

### 狀態管理
```typescript
// GlobalHeader 狀態
const [isSidebarOpen, setIsSidebarOpen] = useState(false);
const [user, setUser] = useState<UserData | null>(null);

// ClientLayout 狀態
const [isTemporaryLogin, setIsTemporaryLogin] = useState(false);
```

### 事件處理
```typescript
// 點擊外部關閉側邊欄
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const sidebar = document.getElementById('global-sidebar');
    const menuButton = document.getElementById('menu-button');
    
    if (sidebar && !sidebar.contains(event.target as Node) && 
        menuButton && !menuButton.contains(event.target as Node)) {
      setIsSidebarOpen(false);
    }
  };

  if (isSidebarOpen) {
    document.addEventListener('mousedown', handleClickOutside);
  }

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [isSidebarOpen]);
```

### 路由管理
```typescript
// 菜單項目點擊處理
const handleMenuClick = (path: string) => {
  router.push(path);
  setIsSidebarOpen(false);
};

// 登出處理
const handleLogout = async () => {
  try {
    await signOutService(supabase);
    clearLocalAuthData();
    toast.success('Successfully logged out');
    router.push('/main-login');
  } catch (error: any) {
    console.error('[Header] Logout error:', error);
    toast.error('Logout failed. Please try again.');
  }
};
```

## 性能指標

### 組件大小
- **GlobalHeader**: ~8 kB (包含動畫和邏輯)
- **ClientLayout**: ~3 kB (佈局管理)
- **總體影響**: 增加約 11 kB，但提供統一體驗

### 渲染性能
- **首次渲染**: < 100ms
- **側邊欄動畫**: 60fps 流暢動畫
- **路由切換**: < 50ms

### 記憶體使用
- **事件監聽器**: 適當的清理機制
- **狀態管理**: 最小化狀態存儲
- **組件卸載**: 完整的清理邏輯

## 安全性考量

### 認證安全
- **會話驗證**: 每次渲染檢查認證狀態
- **自動登出**: 會話過期自動處理
- **權限檢查**: 確保用戶有訪問權限

### 數據安全
- **敏感信息**: 不在客戶端存儲敏感數據
- **XSS 防護**: 適當的輸入驗證
- **CSRF 防護**: 使用 Supabase 內建保護

## 故障排除

### 常見問題

1. **Header 不顯示**
   - 檢查認證狀態
   - 確認不在登入頁面
   - 驗證 useAuth hook 返回值

2. **側邊欄不關閉**
   - 檢查事件監聽器設置
   - 確認 DOM 元素 ID 正確
   - 驗證點擊外部邏輯

3. **用戶信息不顯示**
   - 檢查 Supabase 連接
   - 確認 data_id 表數據
   - 驗證 email 匹配邏輯

4. **登出功能失效**
   - 檢查 Supabase 配置
   - 確認 signOut 服務
   - 驗證路由跳轉

### 調試方法
1. 檢查瀏覽器控制台錯誤
2. 驗證認證狀態變化
3. 檢查網路請求狀態
4. 確認組件渲染條件

## 未來規劃

### 功能增強
- [ ] 多語言支援
- [ ] 主題切換功能
- [ ] 快捷鍵支援
- [ ] 通知中心整合

### 性能優化
- [ ] 虛擬化長列表
- [ ] 更好的緩存策略
- [ ] 代碼分割優化
- [ ] 預載入機制

### 用戶體驗
- [ ] 個人化設定
- [ ] 自定義導航順序
- [ ] 搜尋功能整合
- [ ] 離線支援

### 技術改進
- [ ] TypeScript 嚴格模式
- [ ] 單元測試覆蓋
- [ ] E2E 測試自動化
- [ ] 性能監控整合

## 相關文檔
- [Admin Panel 文檔](./adminPanel.md)
- [Dashboard 文檔](./dashboard.md)
- [認證系統文檔](./auth-system.md)
- [UI 組件庫文檔](./ui-components.md)
