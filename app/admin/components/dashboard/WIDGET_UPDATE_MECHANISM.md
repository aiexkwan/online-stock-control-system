# Widget 更新機制文檔

## 概述
Admin Dashboard 的所有 widget 已移除自動更新機制，改為手動更新模式。所有更新都是由用戶操作觸發。

## 更新條件

### 個別 Widget 更新
以下操作只會更新對應的個別 widget：

#### a. 手動更新 widget 內的 data range
- 例如：在 Output Stats widget 中選擇不同的時間範圍（Today/Yesterday/Last 7 Days）
- 只有該 widget 會重新載入數據

#### b. 用戶在搜尋欄進行搜尋
- 例如：在 Inventory Search widget 中輸入產品代碼並搜尋
- 只有該 widget 會更新搜尋結果

#### c. 手動更新下拉選擇欄的選項
- 例如：更改 ACO Order Progress widget 內的 ACO order ref
- 例如：更改 Stock Level Distribution widget 內的 product type
- 只有該 widget 會根據新選擇更新顯示

### 全局 Widget 更新
以下操作會更新所有 widget：

#### d. 用戶手動點擊 Refresh 按鈕
- 位於 /admin 頁面導航欄右側
- 點擊後會觸發所有 widget 重新載入數據
- 按鈕會顯示旋轉動畫，完成後顯示成功提示

#### e. 登入後載入或手動刷新 /admin 頁面
- 用戶登入系統後首次進入 /admin 頁面
- 用戶在瀏覽器中手動刷新頁面（F5 或 Ctrl+R）
- 所有 widget 會載入最新數據

## 技術實現

### RefreshContext
使用 React Context 管理全局更新狀態：
```typescript
// AdminRefreshContext.tsx
const RefreshContext = createContext({
  refreshTrigger: 0,
  triggerRefresh: () => {}
});
```

### useWidgetData Hook
統一的 widget 數據管理 hook：
```typescript
// useWidgetData.ts
export function useWidgetData({ 
  loadFunction,     // 載入數據的函數
  dependencies,     // 觸發更新的依賴項（如 timeRange, selectedType）
  isEditMode        // 編輯模式下不載入數據
})
```

### Widget 實現示例

#### 1. Data Range 更新（Output Stats Widget）
```typescript
const [timeRange, setTimeRange] = useState('Today');

// 當 timeRange 改變時觸發更新
useWidgetData({
  loadFunction: loadData,
  dependencies: [timeRange],
  isEditMode
});
```

#### 2. 搜尋觸發更新（Inventory Search Widget）
```typescript
const handleSearch = () => {
  searchInventory(searchQuery);
};

// 全局刷新時重新搜尋
useEffect(() => {
  if (searchQuery && refreshTrigger > 0) {
    searchInventory(searchQuery);
  }
}, [refreshTrigger]);
```

#### 3. 下拉選擇更新（ACO Order Progress Widget）
```typescript
const [selectedOrderRef, setSelectedOrderRef] = useState(null);

// 當選擇改變時載入新數據
useEffect(() => {
  if (selectedOrderRef) {
    loadOrderProgress(selectedOrderRef);
  }
}, [selectedOrderRef]);
```

## 更新流程圖

```
用戶操作
    │
    ├─── 個別更新 [a,b,c]
    │    │
    │    ├─── 改變 data range ──────┐
    │    ├─── 執行搜尋 ─────────────┤
    │    └─── 改變下拉選擇 ─────────┴──→ 只更新該 widget
    │
    └─── 全局更新 [d,e]
         │
         ├─── 點擊 Refresh 按鈕 ─────┐
         └─── 頁面載入/刷新 ──────────┴──→ 更新所有 widgets
```

## 注意事項

1. **編輯模式**：在 Dashboard 編輯模式下，所有 widget 不會進行數據更新
2. **錯誤處理**：更新失敗時會顯示錯誤提示，不影響其他 widget
3. **載入狀態**：每個 widget 都有獨立的載入狀態指示器
4. **數據緩存**：沒有實現客戶端緩存，每次更新都會從服務器獲取最新數據

## 移除的功能

- ❌ `refreshInterval` 配置項已不再使用
- ❌ `setInterval` 自動更新機制已移除
- ❌ 30 秒自動同步 dashboard 設置已移除