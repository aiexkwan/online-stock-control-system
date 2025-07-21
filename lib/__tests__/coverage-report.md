# 測試覆蓋率報告

## 執行概要
- **整體覆蓋率**: 3.85% (原本 < 1%)
- **已測試模組**: 4 個
- **測試文件數量**: 4 個
- **測試用例總數**: 97 個

## 已完成測試的模組

### 1. lib/printing/services/print-template-service.ts
- **測試文件**: `__tests__/print-template-service.test.ts`
- **測試用例**: 17 個
- **主要覆蓋**:
  - 模板管理功能
  - 各種打印類型的數據格式化
  - 數據驗證邏輯
  - 邊界情況處理

### 2. lib/printing/services/unified-printing-service.ts
- **測試文件**: `__tests__/unified-printing-service.test.ts`
- **測試用例**: 37 個
- **主要覆蓋**:
  - 服務初始化
  - 各種打印操作（QC標籤、GRN標籤、報告）
  - 批量打印功能
  - 隊列管理
  - 重印功能
  - 事件處理

### 3. lib/hardware/services/monitoring-service.ts
- **測試文件**: `__tests__/monitoring-service.test.ts`
- **測試用例**: 29 個
- **主要覆蓋**:
  - 設備註冊/註銷
  - 事件記錄和指標計算
  - 使用統計
  - 健康監控
  - 告警功能
  - 儀表板數據

### 4. lib/hardware/services/printer-service.ts
- **測試文件**: `__tests__/printer-service.test.ts`
- **測試用例**: 31 個（4 個失敗）
- **主要覆蓋**:
  - 打印機管理
  - 各種打印操作
  - 批量操作
  - 隊列管理
  - 狀態監控

## 發現的問題

### 1. HardwareMonitoringService
- `calculateMetrics` 方法沒有返回 `successCount`，但 `getUsageStats` 期望使用它
- 這是一個實際的 bug，需要修復

### 2. PrinterService 測試
- 由於 iframe 和異步操作的複雜性，部分測試仍有 timeout 問題
- 建議重構打印邏輯，使其更容易測試

### 3. 模組依賴
- UnifiedPrintingService 依賴 Supabase，導致 ESM import 問題
- 已通過 mock 解決

## 建議

1. **修復發現的 bugs**
   - 修復 `HardwareMonitoringService` 的 `successCount` 問題

2. **提升覆蓋率**
   - 為更多核心模組添加測試
   - 特別是業務邏輯密集的服務層

3. **改善可測試性**
   - 減少直接 DOM 操作
   - 使用依賴注入模式
   - 避免在構造函數中進行複雜初始化

4. **持續集成**
   - 設置 CI/CD pipeline 自動運行測試
   - 逐步提高覆蓋率門檻

## 下一步

要達到 30% 的覆蓋率目標，建議：
1. 為 `lib/inventory/services/` 添加測試
2. 為 `app/hooks/` 中的核心 hooks 添加測試
3. 為 `lib/utils/` 中的工具函數添加測試
4. 修復現有的失敗測試

這些模組相對獨立，測試起來會比較容易，能夠快速提升覆蓋率。
