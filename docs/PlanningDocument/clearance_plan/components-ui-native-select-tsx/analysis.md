# 清理分析報告：components/ui/native-select.tsx

**分析時間**: 2025-08-31
**目標文件**: `/components/ui/native-select.tsx`
**分析員**: System Cleanup Architect

## 執行摘要

**最終結論**: ⚠️ **有風險** - 需要進一步調查後再決定

**風險等級**: 中等

**關鍵發現**:

- 文件提供原生 HTML select 元素的封裝組件
- 包含混合實現：原生 select 和自定義下拉選單組件
- 需要完整的依賴分析來確定實際使用情況

---

## 第1步：靜態分析

### 1.1 文件基本信息

- **路徑**: `/components/ui/native-select.tsx`
- **大小**: 136 行
- **類型**: React 組件庫
- **技術棧**: React 18.3.1 + TypeScript + Tailwind CSS

### 1.2 組件結構分析

文件導出了 7 個組件：

1. **原生 Select 組件** (主要)
   - `Select`: 原生 HTML select 元素封裝
   - `SelectOption`: 原生 option 元素封裝
   - `SelectGroup`: 原生 optgroup 元素封裝

2. **自定義下拉選單組件** (次要，第 57-125 行)
   - `SelectTrigger`: 自定義觸發按鈕
   - `SelectValue`: 值顯示組件
   - `SelectContent`: 下拉內容容器
   - `SelectItem`: 自定義選項項

### 1.3 技術債務特徵

- ✅ **混合實現**：同一文件包含兩種不同的實現方式（原生和自定義）
- ✅ **註解暗示**：第 56 行註解「以下組件保留作為自訂下拉選單的組件，但在 native select 上下文中不常用」
- ⚠️ **可能重複**：系統中已有 `select-radix.tsx` 和 `select.tsx`，功能可能重疊

### 1.4 代碼質量評估

- 使用 `forwardRef` 正確轉發 ref
- 遵循 React 最佳實踐
- 適當的 TypeScript 類型定義
- 使用系統標準的 `cn` 工具函數

---

## 第2步：依賴分析

### 2.1 直接引用分析

**搜索結果**: `native-select` 文件名搜索

- ❌ **沒有任何文件導入 `native-select.tsx`**
- 搜索模式：`from ['"].*native-select['"]`
- 結果：0 個引用

### 2.2 組件名稱衝突分析

系統中存在 **3 個 select 相關文件**：

1. `components/ui/select.tsx` - 基於 Radix UI (主要使用)
2. `components/ui/select-radix.tsx` - 另一個 Radix UI 實現
3. `components/ui/native-select.tsx` - 原生 HTML 實現（本文件）

### 2.3 實際使用情況

**Select 組件導入來源統計**：

- `@/components/ui/select`: 6 個文件使用
- `@/components/ui/select-radix`: 1 個文件使用
- `@/components/ui/native-select`: **0 個文件使用**

**使用 select 組件的文件**：

- `lib/printing/components/PrintDialog.tsx`
- `app/components/reports/core/ReportBuilder.tsx`
- `app/(app)/admin/cards/VoidPalletCard.tsx`
- `app/(app)/admin/cards/DownloadCenterCard.tsx`
- `app/(app)/admin/cards/StockLevelListAndChartCard.tsx`
- `app/(app)/admin/components/shared/FormInputGroup.tsx`

### 2.4 原生 select 元素使用情況

搜索原生 `<select>` 和 `<option>` 標籤：

- 找到 10 個文件包含這些標籤
- 但這些都是在其他組件中的實現，而非使用 `native-select.tsx`

---

## 第3步：運行時分析

### 3.1 功能重疊評估

**現有實現對比**：

| 特性       | select.tsx  | select-radix.tsx | native-select.tsx |
| ---------- | ----------- | ---------------- | ----------------- |
| 基礎技術   | Radix UI    | Radix UI         | 原生 HTML         |
| 無障礙性   | ✅ 完整     | ✅ 完整          | ⚠️ 基礎           |
| 自定義樣式 | ✅ 完整     | ✅ 完整          | ⚠️ 有限           |
| 鍵盤導航   | ✅ 高級     | ✅ 高級          | ⚠️ 瀏覽器默認     |
| 實際使用   | ✅ 6 個文件 | ✅ 1 個文件      | ❌ 0 個文件       |

### 3.2 潛在影響分析

**刪除影響**：

- ✅ **無直接影響**：沒有任何文件導入此組件
- ✅ **無功能損失**：系統已有 2 個功能完整的 select 實現
- ⚠️ **潛在風險**：可能有未來計劃使用原生 select 的場景

### 3.3 性能考量

- 原生 select 在某些場景下性能更好（大量選項）
- 但系統目前使用 Radix UI 版本，符合設計系統一致性

---

## 第4步：影響評估

### 4.1 對系統架構的影響

- **設計一致性**: ✅ 刪除可提高一致性（減少重複實現）
- **代碼複雜度**: ✅ 降低維護成本
- **技術債務**: ✅ 減少未使用代碼

### 4.2 對開發體驗的影響

- **選擇困惑**: ✅ 減少開發者選擇困難
- **文檔需求**: ✅ 簡化文檔維護
- **測試負擔**: ✅ 減少測試覆蓋需求

### 4.3 對用戶體驗的影響

- **功能影響**: ✅ 無影響（未被使用）
- **性能影響**: ✅ 無影響
- **無障礙性**: ✅ 無影響（系統使用 Radix UI 版本更好）

### 4.4 風險評估

**低風險因素**：

- 無任何引用
- 功能已被其他組件覆蓋
- 不影響現有功能

**潛在風險**：

- 可能有未記錄的未來使用計劃
- 可能是為特定場景預留（如移動端優化）

---

## 第5步：最終建議

### 結論：⚠️ **有風險** - 建議謹慎處理

### 證據總結

**支持刪除的證據**：

1. ✅ **零引用**：完整搜索顯示無任何導入
2. ✅ **功能重複**：系統已有 2 個功能更完整的 select 實現
3. ✅ **技術棧一致性**：系統明確採用 Radix UI 作為 UI 基礎（見 UI-UX.md）
4. ✅ **註解暗示**：代碼註解表明部分組件「不常用」

**反對刪除的考量**：

1. ⚠️ **混合實現**：文件包含原生和自定義兩種實現，可能有特定設計意圖
2. ⚠️ **性能場景**：原生 select 在某些場景（如大量選項）性能更優
3. ⚠️ **未來規劃**：可能為特定需求預留（如無障礙合規、移動端優化）

### 建議行動方案

#### 選項 A：安全刪除（推薦）

1. 確認與團隊無未來使用計劃
2. 檢查是否有相關設計文檔或需求
3. 創建刪除 PR 並等待審核
4. 保留備份以供需要時恢復

#### 選項 B：標記為棄用

1. 添加 `@deprecated` 註解
2. 在文件頂部添加警告註釋
3. 設定未來版本的刪除計劃
4. 監控是否有新的使用出現

#### 選項 C：保留但優化

1. 移除未使用的自定義組件（第 57-125 行）
2. 保留純原生 select 實現
3. 添加使用場景文檔
4. 明確與 Radix 版本的選擇指南

### 執行前檢查清單

- [ ] 確認無動態導入（dynamic imports）
- [ ] 檢查構建配置是否有特殊處理
- [ ] 確認無相關測試文件
- [ ] 與團隊確認無未來使用計劃
- [ ] 創建備份文件

### 監控指標

如果決定刪除，需監控：

- 構建是否成功
- 運行時是否有錯誤
- 用戶反饋是否有功能缺失

---

## 附錄：相關文件清單

### 同類型文件

- `/components/ui/select.tsx` - 主要 Radix UI 實現
- `/components/ui/select-radix.tsx` - 備用 Radix UI 實現

### 參考文檔

- `/docs/TechStack/UI-UX.md` - UI 技術棧規範
- `/docs/TechStack/FrontEnd.md` - 前端架構指南
