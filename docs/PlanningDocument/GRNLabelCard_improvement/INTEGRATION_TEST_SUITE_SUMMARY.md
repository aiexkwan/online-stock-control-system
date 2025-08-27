# 整合測試套件完整交付物

## 專案概述

本交付物為 **任務 2.3.1：整合測試套件** 的完整實施，專為 PennineWMS 在線庫存控制系統的 GRNLabelCard 相關功能建立了一套完整、高覆蓋率且可維護的自動化整合測試架構。

## 技術規格

### 測試框架配置
- **主要框架**: Vitest 3.2.4 (整合測試專用)
- **環境**: jsdom (模擬瀏覽器環境)
- **並發策略**: 單一 fork (避免整合測試衝突)
- **超時設置**: 30 秒 (適應網絡和服務調用)

### 核心架構組件

#### 1. 配置文件
- **vitest.integration.config.ts**: 整合測試專用配置
- **vitest.integration.setup.ts**: 測試環境初始化和全局 Mock

#### 2. Mock 服務層
- **supabase-integration-mock.ts**: 完整 Supabase 客戶端模擬
- **pdf-service-mock.ts**: PDF 生成和處理服務模擬
- **grn-handlers.ts**: GRN 業務邏輯 API 處理器 (擴展現有)

#### 3. 整合測試套件
- **grn-label-card-business-flow.integration.test.tsx**: 端到端業務流程測試
- **supabase-database-operations.integration.test.ts**: 數據庫操作整合測試  
- **pdf-generation-upload.integration.test.ts**: PDF 服務整合測試
- **error-handling-boundary.integration.test.tsx**: 錯誤處理和邊界情況測試

## 測試覆蓋範圍

### 業務流程覆蓋 (grn-label-card-business-flow.integration.test.tsx)
- ✅ **完整 GRN 標籤生成工作流程**
  - 表單數據輸入和驗證
  - 產品/供應商信息查詢
  - 重量數據處理
  - PDF 生成和打印隊列
- ✅ **多種標籤模式測試** (重量模式/數量模式)
- ✅ **批量處理能力**
- ✅ **錯誤處理集成**
- ✅ **性能基準測試** (高容量標籤生成)
- ✅ **邊界條件驗證**

### 數據庫操作覆蓋 (supabase-database-operations.integration.test.ts)
- ✅ **身份驗證和授權**
  - 用戶會話管理
  - 權限驗證
  - Token 刷新處理
- ✅ **產品和供應商查詢**
  - RPC 函數調用
  - 數據驗證
  - 錯誤處理
- ✅ **GRN 記錄操作**
  - 單一記錄創建
  - 批量記錄創建
  - 約束違規處理
- ✅ **高級數據庫操作**
  - 複雜查詢和關聯
  - 並發操作
  - 數據一致性
- ✅ **性能和優化**
  - 大批量操作
  - 連接池管理
  - 查詢優化

### PDF 服務覆蓋 (pdf-generation-upload.integration.test.ts)
- ✅ **PDF 生成流程**
  - React 組件渲染為 PDF
  - 不同標籤模式支持
  - 批量 PDF 生成
- ✅ **PDF 處理和合併**
  - 多 PDF 合併
  - 空文件處理
  - 工作流程整合
- ✅ **存儲和上傳**
  - Supabase Storage 整合
  - 批量上傳
  - 臨時文件清理
- ✅ **質量保證**
  - PDF 內容驗證
  - 一致性測試
  - 特殊字符處理

### 錯誤處理和邊界條件覆蓋 (error-handling-boundary.integration.test.tsx)
- ✅ **身份驗證錯誤**
  - 會話過期處理
  - Token 刷新失敗
  - 權限不足情況
- ✅ **網絡和連接錯誤**
  - 完全網絡故障
  - 間歇性連接問題
  - 響應超時處理
- ✅ **數據庫約束錯誤**
  - 重複鍵違規
  - 外鍵約束
  - 檢查約束
- ✅ **PDF 服務故障**
  - 渲染引擎崩潰
  - 內存不足
  - 模板數據損壞
- ✅ **邊界值測試**
  - 極大重量值
  - 零和負值重量
  - 超長文本輸入
- ✅ **資源管理**
  - 組件卸載清理
  - 操作取消
  - 並發衝突預防

## Mock 服務能力

### Supabase Mock 特性
- **完整 API 覆蓋**: 身份驗證、數據庫操作、RPC 函數、存儲服務
- **真實數據模擬**: 產品信息、供應商數據、GRN 記錄、托盤信息
- **錯誤模擬**: 約束違規、網絡錯誤、權限錯誤
- **性能測試支持**: 大批量操作、並發請求處理

### PDF 服務 Mock 特性
- **多庫支持**: pdf-lib、jsPDF、@react-pdf/renderer
- **生成流程**: React 組件 → PDF Blob → 上傳 → 打印
- **錯誤模擬**: 渲染失敗、合併錯誤、上傳失敗
- **性能測試**: 高容量處理、並發操作、延遲模擬

## CI/CD 整合

### GitHub Actions 工作流程
- **觸發條件**: 主要分支推送、Pull Request
- **矩陣測試**: Node.js 18.x 和 20.x
- **測試流程**:
  1. 代碼檢出和依賴安裝
  2. 類型檢查和代碼規範驗證
  3. 整合測試執行
  4. 覆蓋率報告生成
  5. 測試結果上傳和評論

### 覆蓋率目標
- **全局覆蓋率**: 70% (分支、函數、行、語句)
- **關鍵組件覆蓋率**: 80-85%
- **報告格式**: HTML、JSON、LCOV
- **集成**: Codecov 上傳和 PR 評論

## 執行指南

### 本地測試執行
```bash
# 安裝依賴
npm ci

# 執行整合測試
npm run test:integration:vitest

# 觀察模式
npm run test:integration:vitest:watch

# 生成覆蓋率報告
npm run test:integration:vitest:coverage
```

### CI 環境執行
```bash
# GitHub Actions 會自動執行
# 查看 .github/workflows/integration-tests.yml
```

### 調試模式
```bash
# 使用 Vitest UI
npx vitest --ui --config vitest.integration.config.ts

# 調試特定測試
npx vitest --config vitest.integration.config.ts grn-label-card-business-flow
```

## 性能基準

### 測試執行性能
- **單一測試套件**: < 30 秒
- **完整整合測試**: < 2 分鐘
- **CI 環境總時間**: < 15 分鐘 (包括設置和清理)

### 模擬服務性能
- **PDF 生成**: 10-500ms 模擬延遲
- **數據庫操作**: 50-200ms 模擬延遲  
- **並發支持**: 最多 10 個同時請求

## 維護和擴展

### 測試數據管理
- **工廠模式**: 使用 grnTestUtils 創建測試數據
- **數據清理**: 每個測試後自動重置
- **數據隔離**: 獨立的測試數據生成器

### Mock 服務擴展
```typescript
// 添加新的 Supabase 功能
setupSupabaseIntegrationMocks(mockClient);

// 添加新的 PDF 服務能力
mockPdfServices.newService = createNewServiceMock();
```

### 新測試案例添加
1. 在適當的測試文件中添加新的 describe 塊
2. 使用現有的 Mock 服務和工具函數
3. 遵循現有的測試結構和命名規範
4. 添加適當的覆蓋率要求

## 質量保證

### 代碼質量標準
- **TypeScript**: 嚴格類型檢查
- **ESLint**: 代碼規範檢查
- **Prettier**: 代碼格式化
- **測試覆蓋率**: 強制閾值要求

### 測試質量標準
- **獨立性**: 每個測試獨立執行
- **可重複性**: 確定性結果
- **清晰性**: 明確的測試意圖和斷言
- **完整性**: 涵蓋正常和異常情況

## 總結

本整合測試套件為 PennineWMS 系統提供了：

1. **全面的業務流程驗證** - 從用戶輸入到最終輸出的完整測試
2. **強大的 Mock 架構** - 真實服務行為的準確模擬
3. **完整的錯誤處理測試** - 各種異常情況的驗證
4. **CI/CD 整合** - 自動化測試執行和報告
5. **高覆蓋率目標** - 確保代碼質量和可靠性
6. **可維護架構** - 易於擴展和修改的測試結構

此測試套件確保了 GRN 標籤系統的核心功能在各種條件下都能正確運行，為快速迭代和持續交付提供了堅實的質量保障基礎。