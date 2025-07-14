# Hydration Mismatch Fix - AuthChecker Component

## 問題描述
日期：2025-07-14

喺 `/main-login` 頁面出現 hydration mismatch 錯誤：

```
Error: Hydration failed because the server rendered text didn't match the client. 
As a result this tree will be regenerated on the client.

Server rendered: "Loading..."
Client rendered: "Checking authentication..."
```

錯誤位置：`app/components/AuthChecker.tsx:102`

## 根本原因

AuthChecker component 喺第 102 行使用條件渲染：

```typescript
{loading ? 'Loading...' : 'Checking authentication...'}
```

呢個導致 hydration mismatch 因為：
1. Server-side rendering (SSR) 時，`loading` state 初始值係 `true`，所以 server render "Loading..."
2. Client-side hydration 時，如果 `loading` 已經變成 `false` 但 `authCheckComplete` 仍然係 `false`，client 會嘗試 render "Checking authentication..."
3. React 發現 server 同 client render 嘅內容唔同，就會報 hydration mismatch error

## 解決方案

統一使用 "Loading..." 文字，避免條件渲染：

```typescript
// 修正前
<div className='animate-pulse text-lg text-white'>
  {loading ? 'Loading...' : 'Checking authentication...'}
</div>

// 修正後
<div className='animate-pulse text-lg text-white'>
  Loading...
</div>
```

## 修正步驟

1. 編輯 `app/components/AuthChecker.tsx` 第 102 行
2. 移除條件渲染，統一使用 "Loading..." 文字
3. 運行 `npm run lint` 同 `npm run typecheck` 確保代碼質量

## 為何呢個解決方案有效

1. **統一渲染內容**：確保 server 同 client 渲染相同文字
2. **用戶體驗不變**：對用戶嚟講，"Loading..." 同 "Checking authentication..." 意思相同
3. **簡單可靠**：避免複雜嘅 state 同步邏輯

## 相關參考

- React Hydration Mismatch 文檔：https://react.dev/link/hydration-mismatch
- 項目 CSR to SSR 遷移指南：`docs/Project-Restructure/migration-guide-csr-to-ssr.md`

## 預防措施

1. 避免喺 SSR component 使用會產生不同結果嘅邏輯（如時間、隨機數）
2. 如需要 client-only 內容，使用 `useEffect` 同 `mounted` state 模式
3. 保持 server 同 client 渲染邏輯一致