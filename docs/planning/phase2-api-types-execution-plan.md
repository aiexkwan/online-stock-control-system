# Phase 2: API 類型統一執行計劃

**執行期間**: Week 3-4 (2025-07-21 開始)  
**專家團隊**: Backend工程師、優化專家、QA專家、代碼品質專家、整合專家

## 📊 現狀分析

### API Routes 統計
- **總數**: 54 個 route.ts 檔案
- **含 any 類型**: 8 個檔案 (12 個 any 使用)
- **重點問題檔案**:
  - `/app/api/ask-database/route.ts` (2 any)
  - `/app/api/monitoring/tech-debt/route.ts` (2 any)
  - `/app/api/v1/alerts/notifications/route.ts` (2 any)
  - `/app/api/v1/alerts/rules/route.ts` (2 any)

### Server Actions 統計
- **總數**: 16 個 actions 檔案
- **含 any 類型**: 4 個檔案 (19 個 any 使用)
- **重點問題檔案**:
  - `/app/actions/reportActions.ts` (14 any) ⚠️ 最嚴重
  - `/app/actions/authActions.ts` (2 any)
  - `/app/actions/grnActions.ts` (2 any)
  - `/app/actions/palletActions.ts` (1 any)

### 現有資源
- ✅ `types/api/response.ts` - 基礎響應類型已定義
- ✅ `lib/api/` - API 客戶端實現
- ❌ 缺乏統一的 Server Actions 類型系統
- ❌ API client 同 server 類型未完全同步

## 🎯 執行目標

### 核心目標
1. **100% API 類型覆蓋** - 所有 54 個 routes 使用統一類型
2. **100% Actions 類型覆蓋** - 所有 16 個 actions 使用統一類型
3. **零 any 關鍵路徑** - 消除所有 31 個 any 使用
4. **< 10秒增量編譯** - 優化開發體驗
5. **> 50% 測試覆蓋率** - 確保類型正確性

## 👥 專家職責分配

### Backend工程師 (角色3) - 類型架構設計
**負責人**: 主導 API 類型統一架構

#### 任務清單
1. **統一 API Response 架構** (Day 1-2)
   ```typescript
   // types/api/core/response.ts
   export interface ApiResult<T> {
     success: boolean;
     data?: T;
     error?: ApiError;
     metadata?: ApiMetadata;
   }
   ```

2. **Server Actions 類型系統** (Day 3-4)
   ```typescript
   // types/actions/core/result.ts
   export interface ActionResult<T> {
     success: boolean;
     data?: T;
     error?: ActionError;
     validationErrors?: ValidationError[];
   }
   ```

3. **API Middleware 類型** (Day 5)
   - Request/Response interceptors
   - Authentication context
   - Error handling pipeline

### 優化專家 (角色6) - 編譯性能優化
**負責人**: 增量編譯配置

#### 任務清單
1. **Project References 配置** (Day 5)
   ```json
   // tsconfig.api.json
   {
     "extends": "./tsconfig.base.json",
     "references": [
       { "path": "./types/tsconfig.types.json" },
       { "path": "./lib/tsconfig.lib.json" }
     ],
     "include": ["app/api/**/*", "app/actions/**/*"]
   }
   ```

2. **Watch Mode 優化**
   - 配置 `tsc --build --watch`
   - 實施 concurrent type checking
   - 監控編譯時間指標

3. **Bundle 分析**
   - 分離類型定義到獨立 chunks
   - 優化 import paths
   - 減少重複類型定義

### QA專家 (角色7) - 測試策略
**負責人**: API 測試覆蓋

#### 任務清單
1. **API Contract Testing** (Week 4, Day 3)
   ```typescript
   // __tests__/api/contracts/response.test.ts
   describe('API Response Contract', () => {
     it('should match ApiResult interface', () => {
       // Runtime validation tests
     });
   });
   ```

2. **類型覆蓋率工具**
   - 集成 type-coverage 工具
   - 設定 50% 覆蓋率目標
   - CI/CD 集成

3. **E2E 類型測試**
   - Client-Server 類型一致性
   - Serialization/Deserialization
   - Error propagation

### 代碼品質專家 (角色8) - Any 消除
**負責人**: 關鍵路徑清理

#### 任務清單
1. **優先級處理** (Week 4, Day 1-2)
   - P0: `reportActions.ts` (14 any)
   - P1: Auth/GRN actions (4 any)
   - P2: API routes (12 any)

2. **TODO 標記系統**
   ```typescript
   // @types-migration:todo(phase2) [P0] Replace any with proper type
   ```

3. **代碼整潔**
   - 統一命名規範 (Request/Response suffix)
   - 移除重複類型定義
   - 建立 import 最佳實踐

### 整合專家 (角色11) - 系統整合
**負責人**: 前後端類型同步

#### 任務清單
1. **類型同步機制** (Week 4, Day 3-4)
   - API client 類型生成
   - Supabase RPC 類型整合
   - Date/JSON 序列化處理

2. **統一導入路徑**
   ```typescript
   // 統一使用
   import type { ApiResult } from '@/types/api';
   // 避免
   import type { ApiResult } from '../../../types/api/core/response';
   ```

3. **第三方 API 類型**
   - OpenAI API types
   - Google Drive API types
   - Email service types

## 📅 詳細時間表

### Week 3 (基礎架構)

#### Day 1-2: API Response 統一
- [ ] 創建 `types/api/core/` 目錄結構
- [ ] 設計 `ApiResult<T>` 基礎類型
- [ ] 實施標準錯誤處理類型
- [ ] 更新 10 個示範 API routes

#### Day 3-4: Server Actions 類型
- [ ] 創建 `types/actions/core/` 目錄結構
- [ ] 設計 `ActionResult<T>` 基礎類型
- [ ] 處理 FormData validation 類型
- [ ] 更新 `reportActions.ts` (最多 any)

#### Day 5: 增量編譯配置
- [ ] 配置 `tsconfig.api.json`
- [ ] 實施 project references
- [ ] 測試編譯時間改進
- [ ] 建立性能基準

### Week 4 (實施同測試)

#### Day 1-2: 關鍵路徑清理
- [ ] 完成所有 Server Actions any 消除
- [ ] 處理高優先級 API routes
- [ ] 添加 TODO 標記到低優先級項目
- [ ] 確保向後兼容性

#### Day 3-4: 測試同驗證
- [ ] 實施 API contract tests
- [ ] 運行類型覆蓋率報告
- [ ] 性能基準測試
- [ ] 修復發現的問題

#### Day 5: 完成同文檔
- [ ] 完成所有剩餘 API routes
- [ ] 更新遷移指南
- [ ] 準備 Phase 2 完成報告
- [ ] 計劃 Phase 3 準備

## 🚨 風險管理

### 風險1: 向後兼容性
**影響**: 高  
**概率**: 中  
**緩解措施**:
- 使用類型別名保持兼容性
- 漸進式遷移策略
- 充分測試覆蓋

### 風險2: 編譯性能下降
**影響**: 中  
**概率**: 低  
**緩解措施**:
- Project references 分離編譯
- 監控編譯時間變化
- 準備 rollback 計劃

### 風險3: 團隊學習曲線
**影響**: 中  
**概率**: 中  
**緩解措施**:
- 詳細遷移指南
- Code review 過程
- Pair programming sessions

## 📊 成功指標

### 量化指標
- ✅ API 類型覆蓋率: 100% (54/54 routes)
- ✅ Actions 類型覆蓋率: 100% (16/16 actions)
- ✅ Any 使用率: 0% (0/31 eliminated)
- ✅ 增量編譯時間: < 10秒
- ✅ 測試覆蓋率: > 50%

### 質量指標
- 代碼一致性評分: > 90%
- 開發者滿意度: > 80%
- Bug 減少率: > 30%

## 🎁 交付物清單

### 代碼交付
- [ ] `types/api/core/` - 統一 API 類型系統
- [ ] `types/actions/core/` - 統一 Actions 類型系統
- [ ] 44 個更新的 API routes (無 any)
- [ ] 16 個更新的 server actions (無 any)
- [ ] 測試套件同覆蓋率報告

### 文檔交付
- [ ] API 類型使用指南
- [ ] Server Actions 類型指南
- [ ] 遷移最佳實踐文檔
- [ ] Phase 2 完成報告

### 工具交付
- [ ] 類型覆蓋率監控工具
- [ ] 增量編譯配置
- [ ] CI/CD 類型檢查集成

## 🔄 每日進度追蹤

### 追蹤方式
1. 每日 standup 報告進度
2. 更新 `/docs/Today_Todo/` 文件
3. Slack 進度更新
4. 週末總結報告

### 關鍵檢查點
- Week 3 結束: 基礎架構完成度檢查
- Week 4 中期: Any 消除進度檢查
- Week 4 結束: 完成標準驗證

---

**計劃建立時間**: 2025-07-21  
**計劃狀態**: 待執行  
**下一步行動**: 開始 Day 1-2 API Response 統一工作