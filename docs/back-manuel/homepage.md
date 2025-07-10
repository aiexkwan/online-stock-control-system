# 網站主頁技術架構文檔

## 概述

NewPennine 倉庫管理系統嘅主頁採用現代化嘅技術架構，結合 Next.js 14 App Router、TypeScript、Framer Motion 動畫庫同 WebGL 技術，實現高性能同視覺效果出色嘅用戶界面。

## 1. 主頁佈局同設計

### 1.1 頁面結構
- **根路由 (`/`)**: 簡單重定向到 `/main-login`
- **主登入頁面 (`/main-login`)**: 實際嘅首頁內容

### 1.2 視覺設計元素
```typescript
// 主要設計組件：
- 星空背景 (WebGL Shader)
- 漸變疊加層
- 玻璃擬態卡片設計
- 浮動粒子效果
- 響應式動畫
```

### 1.3 佈局層次
1. **背景層**: StarfieldBackground (WebGL 渲染)
2. **漸變層**: 藍紫色漸變疊加
3. **內容層**: 登入表單同品牌信息
4. **動畫層**: Framer Motion 動畫效果
5. **粒子層**: 浮動光點效果

## 2. 導航系統實現

### 2.1 動態導航欄 (DynamicActionBar)
```typescript
// 核心特性：
- 懸停激活設計
- 虛擬化支持（大量菜單項）
- 角色權限控制
- 智能預加載
- 響應式設計
```

### 2.2 導航組件架構
```typescript
DynamicActionBar
├── NavigationItem (單個導航項)
├── VirtualizedNavigation (虛擬化列表)
├── QuickAccess (快速訪問)
├── MobileView (移動端視圖)
└── SmartReminder (智能提醒)
```

### 2.3 導航預加載系統
```typescript
// navigationPreloader 功能：
- 基於用戶行為預測
- 智能緩存管理
- 路由預加載
- 頭像優化加載
```

## 3. 路由配置同跳轉邏輯

### 3.1 路由結構
```typescript
// config/navigation.ts
MAIN_NAVIGATION = [
  {
    id: 'print-label',
    children: [
      { href: '/print-label' },    // QC 標籤
      { href: '/print-grnlabel' }   // GRN 標籤
    ]
  },
  { id: 'stock-transfer', href: '/stock-transfer' },
  { id: 'loading-order', href: '/order-loading' },
  {
    id: 'admin',
    children: [
      { href: '/admin/injection' },
      { href: '/admin/warehouse' },
      // ... 更多管理功能
    ]
  }
]
```

### 3.2 路由保護機制 (Middleware)
```typescript
// 公開路由（無需認證）：
- /main-login
- /new-password
- /camera-debug
- 特定 API 路由

// 受保護路由：
- 所有其他路由需要認證
- 自動重定向到登入頁面
- 保存原始訪問路徑
```

### 3.3 路由跳轉邏輯
1. **未認證用戶**: 重定向到 `/main-login`
2. **已認證用戶**: 根據角色顯示導航
3. **角色限制**: `navigationRestricted` 用戶隱藏導航

## 4. 使用嘅組件同樣式

### 4.1 核心組件
```typescript
// 主要組件：
- SimpleLoginForm: 登入表單
- StarfieldBackground: WebGL 星空背景
- UniversalBackground: 統一背景系統
- ClientLayout: 客戶端佈局包裝器
- AuthChecker: 認證檢查組件
```

### 4.2 樣式系統
```css
/* Tailwind CSS 類別使用：*/
- 玻璃擬態: backdrop-blur-xl, bg-slate-800/40
- 漸變效果: bg-gradient-to-r, from-blue-300
- 響應式: max-w-md, px-4
- 動畫: transition-all, hover:scale-105
```

### 4.3 主題系統
```typescript
// 基於路徑嘅動態主題：
getThemeFromPath(path) {
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/warehouse')) return 'warehouse';
  if (path.startsWith('/production')) return 'production';
  if (path.startsWith('/qc')) return 'qc';
  return 'neutral';
}
```

## 5. 背景動畫效果

### 5.1 WebGL Starfield 實現
```glsl
// Vertex Shader
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}

// Fragment Shader
- 使用 Perlin noise 生成星星
- 動態閃爍效果
- 性能優化渲染
```

### 5.2 Framer Motion 動畫
```typescript
// 主要動畫效果：
- 頁面載入淡入: initial={{ opacity: 0 }} animate={{ opacity: 1 }}
- 彈簧動畫: type: 'spring', stiffness: 300
- 懸停效果: whileHover={{ scale: 1.05 }}
- 點擊反饋: whileTap={{ scale: 0.95 }}
```

### 5.3 浮動粒子效果
```typescript
// 20 個隨機分佈嘅光點
- 隨機位置生成
- 循環垂直移動
- 淡入淡出效果
- 不同速度同延遲
```

## 6. 性能優化策略

### 6.1 代碼分割
```typescript
// 動態導入優化：
- 懶加載 widgets
- 路由級別代碼分割
- 條件加載組件
```

### 6.2 緩存策略
```typescript
// NavigationCacheManager：
- 用戶數據緩存
- 頭像 URL 優化
- 導航預加載緩存
- IndexedDB 持久化
```

### 6.3 渲染優化
```typescript
// 優化技術：
- React.memo 防止重渲染
- useMemo 緩存計算結果
- 虛擬化長列表
- WebGL 硬件加速
```

### 6.4 資源優化
```typescript
// Next.js Image 優化：
- 自動格式轉換
- 響應式圖片
- 懶加載
- 優先加載關鍵圖片
```

## 7. SEO 同元數據配置

### 7.1 基礎元數據
```typescript
export const metadata: Metadata = {
  title: 'Pennine Stock Control System',
  description: 'Online warehouse stock control system',
  icons: {
    icon: '/images/logo.png'
  }
}
```

### 7.2 頁面級別優化
- 服務端渲染提升 SEO
- 結構化數據支持
- Open Graph 標籤
- 語義化 HTML

### 7.3 性能指標
- 首次內容繪製 (FCP) < 1.8s
- 最大內容繪製 (LCP) < 2.5s
- 累積佈局偏移 (CLS) < 0.1
- 首次輸入延遲 (FID) < 100ms

## 技術亮點

1. **WebGL 星空背景**: 高性能 GPU 渲染，流暢視覺效果
2. **智能導航系統**: 預加載、虛擬化、角色權限控制
3. **現代化設計**: 玻璃擬態、漸變效果、響應式動畫
4. **性能優化**: 代碼分割、緩存策略、資源優化
5. **安全機制**: 中間件認證、路由保護、CSRF 防護

## 改進建議

1. **加入 PWA 支持**: 離線功能同推送通知
2. **增強無障礙性**: ARIA 標籤同鍵盤導航
3. **國際化支持**: 多語言界面
4. **深色模式**: 用戶偏好設置
5. **性能監控**: 集成 Sentry 或類似工具