# Dashboard Access 頁面文檔

## 概述
Dashboard Access 頁面是用戶登入後的主要入口頁面，提供系統概覽和歷史記錄查看功能。經過重構後，頁面專注於展示 History Log，提供清晰的操作記錄追蹤。

## 文件位置
- **主要文件**: `app/dashboard/access/page.tsx`
- **佈局文件**: `app/dashboard/access/layout.tsx`

## 功能特色

### 1. History Log 卡片
- **記錄顯示**: 顯示系統操作的歷史記錄
- **數據欄位**: 
  - Pallet Number (棧板號碼)
  - Product Code (產品代碼)
  - Product Description (產品描述)
  - ID (記錄ID)
- **預設顯示**: 最近30條記錄
- **滾動查看**: 最多可查看150條記錄
- **視覺效果**: 30條後的記錄以較低透明度顯示

### 2. 數據關聯查詢
- **三表聯查**: 
  1. `record_history` - 主要歷史記錄
  2. `record_palletinfo` - 棧板信息 (獲取 product_code)
  3. `data_code` - 產品代碼 (獲取 description)
- **智能關聯**: 自動關聯棧板號碼到產品信息
- **缺失處理**: 優雅處理缺失的關聯數據

### 3. 用戶體驗優化
- **載入狀態**: 骨架屏顯示載入過程
- **空狀態**: 友好的空數據提示
- **響應式設計**: 適配各種螢幕尺寸
- **動畫效果**: 流暢的記錄載入動畫

## 版本歷史

### v3.0.0 - 全局 Header 整合
**日期**: 2024年12月
**主要變更**:
- 移除頁面內建的 header 元素
- 整合到全局 GlobalHeader 系統
- 移除重複的問候語、用戶名、登出按鈕
- 簡化頁面結構，專注於 History Log 展示

**技術改進**:
- 移除 `getGreeting()` 函數
- 移除 `handleLogout()` 函數
- 移除 header 相關的 JSX 結構
- 優化頁面載入性能

### v2.1.0 - 數據查詢修正
**日期**: 2024年11月
**主要變更**:
- 修正數據庫欄位名稱錯誤 (`timestamp` → `time`)
- 優化數據關聯邏輯
- 改善錯誤處理機制

**數據結構修正**:
```typescript
// 修正前 (錯誤)
.select('id, plt_num, action, timestamp, uuid')

// 修正後 (正確)
.select('id, plt_num, action, time, uuid')
```

### v2.0.0 - 顯示邏輯更新
**日期**: 2024年11月
**主要變更**:
- 預設顯示從20條增加到30條
- 最大顯示從100條增加到150條
- 優化透明度邏輯和提示文字

**顯示邏輯**:
```typescript
// 透明度邏輯
className={`... ${index >= 30 ? 'opacity-75' : ''}`}

// 記錄計數提示
Showing {Math.min(historyRecords.length, 30)} of {historyRecords.length} records
{historyRecords.length > 30 && ' (scroll to see more)'}
```

### v1.5.0 - 數據關聯優化
**日期**: 2024年10月
**主要變更**:
- 實現正確的三表關聯查詢
- 優化數據載入性能
- 添加數據聚合邏輯

**關聯邏輯**:
1. 從 `record_history` 獲取基礎記錄
2. 用 `plt_num` 到 `record_palletinfo` 查詢 `product_code`
3. 用 `product_code` 到 `data_code` 查詢 `description`

### v1.0.0 - 頁面重構
**日期**: 2024年9月
**主要變更**:
- 從複雜的統計頁面簡化為 History Log 專用頁面
- 移除統計卡片和圖表
- 專注於歷史記錄展示
- 標題居中顯示

## 數據結構

### HistoryRecord 接口
```typescript
interface HistoryRecord {
  id: number;
  plt_num: string;
  product_code?: string;
  product_description?: string;
  action: string;
  time: string;
  uuid: string;
}
```

### UserData 接口
```typescript
interface UserData {
  id: string;
  name: string;
  email: string;
  clockNumber: string;
  displayName?: string;
}
```

## 數據查詢邏輯

### 1. 歷史記錄查詢
```sql
SELECT id, plt_num, action, time, uuid 
FROM record_history 
ORDER BY time DESC 
LIMIT 150
```

### 2. 棧板信息查詢
```sql
SELECT plt_num, product_code 
FROM record_palletinfo 
WHERE plt_num IN (...)
```

### 3. 產品描述查詢
```sql
SELECT code, description 
FROM data_code 
WHERE code IN (...)
```

### 4. 數據聚合
```typescript
// 創建查詢映射
const palletInfoMap = new Map(); // plt_num -> product_code
const codeDescriptionMap = new Map(); // product_code -> description

// 組合最終數據
const enrichedHistory = historyData.map(record => ({
  ...record,
  product_code: palletInfoMap.get(record.plt_num) || 'N/A',
  product_description: codeDescriptionMap.get(productCode) || 'N/A'
}));
```

## 技術實現

### 狀態管理
- **載入狀態**: `loading`, `historyLoading`
- **錯誤狀態**: `error`
- **數據狀態**: `user`, `historyRecords`
- **認證狀態**: 通過 Supabase Auth 管理

### 錯誤處理
- **數據庫錯誤**: 捕獲並顯示友好錯誤訊息
- **網路錯誤**: 自動重試機制
- **認證錯誤**: 自動跳轉到登入頁面
- **數據缺失**: 優雅降級顯示

### 性能優化
- **並行查詢**: 同時查詢多個數據源
- **數據去重**: 避免重複查詢相同的產品代碼
- **懶載入**: 按需載入歷史記錄
- **記憶化**: 緩存查詢結果

## 用戶體驗

### 載入體驗
- **骨架屏**: 5個載入佔位符
- **漸進載入**: 記錄逐個顯示動畫
- **載入指示**: 清晰的載入狀態提示

### 視覺設計
- **深色主題**: 符合系統整體風格
- **卡片設計**: 清晰的內容分組
- **表格佈局**: 4列網格顯示記錄
- **顏色編碼**: 不同類型數據使用不同顏色

### 響應式設計
- **桌面**: 4列完整顯示
- **平板**: 保持4列但調整間距
- **手機**: 堆疊顯示或橫向滾動

## 安全性

### 認證檢查
```typescript
// 會話檢查
const { data: { session }, error: sessionError } = await supabase.auth.getSession();
if (!session) {
  router.push('/main-login?error=no_session');
  return;
}

// 用戶驗證
const { data: { user }, error: userError } = await supabase.auth.getUser();
if (userError || !user) {
  throw new Error(`User error: ${userError?.message || 'No user found'}`);
}
```

### 數據安全
- **參數化查詢**: 防止 SQL 注入
- **權限檢查**: 確保用戶有查看權限
- **數據過濾**: 只顯示用戶有權查看的記錄

## 性能指標

### 構建大小
- **當前大小**: 3.46 kB
- **First Load JS**: 183 kB
- **優化後**: 相比重構前減少了約70%

### 載入性能
- **首次載入**: < 2秒
- **數據查詢**: < 1秒
- **頁面渲染**: < 500ms

## 故障排除

### 常見問題

1. **歷史記錄不顯示**
   - 檢查數據庫連接
   - 確認 `record_history` 表有數據
   - 驗證時間欄位名稱 (`time` 而非 `timestamp`)

2. **產品信息缺失**
   - 檢查 `record_palletinfo` 表的 `product_code` 欄位
   - 確認 `data_code` 表的關聯數據
   - 驗證棧板號碼格式

3. **載入緩慢**
   - 檢查數據庫索引
   - 優化查詢條件
   - 考慮增加緩存

4. **認證失敗**
   - 清除瀏覽器緩存
   - 檢查 Supabase 配置
   - 驗證用戶會話狀態

### 調試步驟
1. 打開瀏覽器開發者工具
2. 檢查 Console 錯誤訊息
3. 查看 Network 標籤的請求狀態
4. 驗證 Supabase 查詢結果
5. 確認用戶認證狀態

## 未來改進

### 功能增強
- [ ] 搜尋和過濾功能
- [ ] 記錄詳細信息彈窗
- [ ] 匯出歷史記錄
- [ ] 實時更新通知

### 性能優化
- [ ] 虛擬滾動支援
- [ ] 分頁載入
- [ ] 更好的緩存策略
- [ ] 離線支援

### 用戶體驗
- [ ] 自定義顯示欄位
- [ ] 記錄排序功能
- [ ] 時間範圍篩選
- [ ] 批量操作支援

## 相關文檔
- [Global Layout 文檔](./globalLayout.md)
- [Admin Panel 文檔](./adminPanel.md)
- [Export Report 改進](./exportReport-improvements.md)
