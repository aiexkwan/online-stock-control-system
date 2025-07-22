# React Hydration Mismatch Fix

## 問題描述
登入頁面出現 React hydration mismatch 錯誤，錯誤信息顯示：
- Server: `className="__variable_de8755"`
- Client: `className="__className_de8755 font-lato"`

## 根本原因
`(auth)/layout.tsx` 重新定義了 `<html>` 和 `<body>` 標籤，導致：
1. Next.js 字體優化系統混亂
2. 服務器和客戶端生成不同的 className
3. React hydration 失敗

## 解決方案

### 修復步驟
1. 移除 `(auth)/layout.tsx` 中的 `<html>` 和 `<body>` 標籤
2. 只保留內容包裝器和背景組件

### 修復前
```tsx
export default function AuthLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  const safeChildren = children || null;
  
  return (
    <html lang="en">
      <body>
        <MinimalBackground />
        {safeChildren}
      </body>
    </html>
  );
}
```

### 修復後
```tsx
export default function AuthLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  const safeChildren = children || null;
  
  return (
    <>
      <MinimalBackground />
      {safeChildren}
    </>
  );
}
```

## 預防措施

### 1. ESLint 規則
已添加自定義 ESLint 規則 (`.eslintrc.layout-check.js`) 來防止在 route group layouts 中使用 `<html>` 或 `<body>` 標籤。

### 2. 最佳實踐
- **只有根 `app/layout.tsx` 應該定義 `<html>` 和 `<body>` 標籤**
- Route group layouts 應該只包裝 children，不重新定義根元素
- 使用 CSS positioning (如 `fixed`) 來實現全屏背景效果

### 3. 測試
創建了單元測試 (`app/(auth)/__tests__/layout.test.tsx`) 來確保：
- 不渲染 html/body 標籤
- 正確渲染背景組件
- 處理 undefined children

## 相關文件
- `/app/layout.tsx` - 根 layout，定義 html/body 和字體
- `/app/(auth)/layout.tsx` - Auth layout，只提供背景
- `/app/components/MinimalBackground.tsx` - 背景組件
- `/.eslintrc.layout-check.js` - ESLint 規則

## 學習要點
1. **奧卡姆剃刀原則**：簡單問題用簡單解決方案
2. **錯誤診斷**：錯誤信息明確指向 className 不匹配，應該直接檢查相關代碼
3. **Next.js 設計原則**：遵循框架的設計模式，不要重複定義根元素