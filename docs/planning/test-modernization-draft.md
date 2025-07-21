# 測試現代化計劃 - 互動式開發計劃

**最後更新日期及時間**: 2025-07-21 10:30:00  
**負責人**: QA專家 + DevOps專家 + 架構師團隊  
**項目狀態**: 📋 討論中

## 💬 用戶反饋記錄

### 第1輪反饋 (2025-07-21)
**用戶意見**:
- 意見1: 將跳過測試加上 skip reason 標籤（如 // @skip[P1] - unstable data schema）
- 意見2: 新增 Storybook snapshot 測試（視覺驗證），可減少 UI regression
- 意見3: 可考慮設 mock schema auto validator（如用 zod 定義測試 input schema）

**AI Agent 回應**:
- 回應1: 建立標準化 skip reason taxonomy，包含優先級和原因分類
- 回應2: 在測試架構中加入視覺測試層，使用 Storybook + Chromatic
- 回應3: 採用 Zod 作為 schema validation 工具，確保測試數據一致性

## 🔄 迭代修改記錄

### 迭代1: 初始方案
**基於分析**: 系統測試債務分析結果
**主要發現**:
- 24+ 個被跳過的測試
- 2 個 JavaScript 測試文件需要轉換
- 硬編碼日期問題
- GraphQL 殘留（系統已遷移到 REST）
- 大量 TODO 和 any types

### 迭代2: 用戶反饋優化 (2025-07-21)
**修改原因**: 用戶建議加強測試管理和質量控制
**修改內容**:
- 測試管理: 新增 Skip Reason Taxonomy 系統
- 測試覆蓋: 加入 Storybook 視覺測試層
- 數據驗證: 引入 Zod schema validation

## 📊 AI Agent 討論記錄

### 初始討論 (2025-07-21)

**🏗️ Architect 觀點**:
- **架構建議**: 建立分層測試架構，將測試分為核心業務測試、基礎設施測試和UI測試
- **技術選型**: 統一使用 Jest + React Testing Library + Playwright，移除過時的測試框架
- **風險評估**: 大規模測試重構可能影響 CI/CD pipeline，需要分階段進行

**📈 ProductManager 觀點**:
- **產品需求**: 優先修復影響倉庫運作的關鍵測試（登入、權限、標籤列印）
- **優先級建議**: P0-登入測試, P1-權限測試, P2-業務流程測試, P3-UI測試
- **商業價值**: 減少 production bugs 50%，提升發布信心度

**⚙️ Backend 觀點**:
- **實現可行性**: TypeScript 遷移和測試修復可以並行進行
- **技術難點**: Mock data 需要同步更新到最新 schema，打印服務測試需要重寫 types
- **開發時間**: 預估需要 3-4 週完成核心測試修復

**🧪 QA Expert 觀點**:
- **測試策略**: 建立測試健康度儀表板，持續監控 skip test 數量
- **質量標準**: 目標 80% 測試覆蓋率，0 skip tests，所有關鍵路徑 100% 覆蓋
- **測試債務**: 現有 24+ skip tests 需要逐一評估和修復

**🔧 DevOps 觀點**:
- **CI/CD 影響**: 需要更新 GitHub Actions 配置支援新測試架構
- **性能考慮**: E2E 測試需要並行化執行，減少總體運行時間
- **監控需求**: 建立測試執行時間和成功率監控

**💬 用戶代表 觀點**:
- **用戶需求**: 確保關鍵業務功能（標籤列印、庫存管理）有完整測試覆蓋
- **使用場景**: 倉庫員工依賴系統穩定性，任何故障都會影響運作
- **體驗要求**: 系統更新不可以導致業務中斷

## 📋 初步計劃概述

### 🎯 項目目標
- **主要目標**: 清理測試技術債務，建立現代化測試架構
- **次要目標**: 提升測試執行效率，改善開發體驗
- **成功標準**: 0 skip tests, 80% 覆蓋率, 所有關鍵業務流程有E2E測試

### 📊 項目範圍
- **包含功能**: 
  - 修復所有跳過的測試
  - JS → TypeScript 測試遷移
  - 清理過時的 GraphQL 測試
  - 建立測試監控系統
- **排除功能**: 
  - 完整的測試重寫（只修復必要部分）
  - 非關鍵功能的測試覆蓋
- **邊界條件**: 不影響當前 TypeScript 遷移進度

### 🏆 預期效益
- **業務價值**: 減少生產環境錯誤 50%，提升系統穩定性
- **技術價值**: 統一測試技術棧，減少維護成本
- **用戶價值**: 確保倉庫運作不受系統問題影響

## 🗓️ 版本規劃

### Phase 1 - 緊急修復（1週）
**依賴**: 無（可立即開始）

#### 🎯 核心功能
- [ ] 修復 4 個登入測試（e2e/auth/login.spec.ts）
- [ ] 修復 2 個權限測試（useAuth.test.ts）
- [ ] 確保打印服務基本測試運作
- [ ] **[新增]** 為所有 skip 測試加上標準化標籤

#### 📋 技術任務
- [ ] 更新測試憑證處理機制
- [ ] 實現 usePagePermission 和 useAskDatabasePermission 測試
- [ ] 修復最關鍵的 TODO types
- [ ] **[新增]** 建立 Skip Reason Taxonomy 文檔

#### ✅ 完成標準
- [ ] 所有登入測試通過
- [ ] 權限測試完整覆蓋
- [ ] CI/CD pipeline 綠燈
- [ ] **[新增]** 100% skip 測試有標準化標籤

### Phase 2 - 系統性改進（2-3週）
**依賴**: Phase 1 完成

#### 🎯 增強功能
- [ ] 轉換 2 個 JS 測試文件為 TypeScript
- [ ] 修復所有打印服務的 any types
- [ ] 清理 GraphQL 相關測試
- [ ] **[新增]** 實現 Zod schema validation

#### 📋 優化任務
- [ ] 更新所有硬編碼日期為動態日期
- [ ] 實現 Mock Service Worker (MSW) 
- [ ] 建立測試數據工廠
- [ ] **[新增]** 建立 Mock Schema Registry
- [ ] **[新增]** 設置 Storybook 視覺測試環境

### Phase 3 - 長期優化（3-4週）
**依賴**: Phase 2 完成

#### 🎯 完善功能
- [ ] 建立測試健康度儀表板
- [ ] 實現 E2E 測試並行化
- [ ] 達到 80% 測試覆蓋率
- [ ] **[新增]** 完成所有組件的 Storybook snapshot 測試
- [ ] **[新增]** 建立自動化視覺回歸測試流程

## 🏗️ 技術架構

### 🛠️ 技術棧
- **測試框架**: Jest 29 + TypeScript
- **組件測試**: React Testing Library 14
- **E2E測試**: Playwright 1.40+
- **Mock管理**: MSW 2.0 + Factory Pattern
- **視覺測試**: Storybook 7.0 + Chromatic
- **Schema驗證**: Zod 3.0
- **測試管理**: Skip Reason Taxonomy

### 📐 測試架構設計

```
測試金字塔 (更新版):
┌─────────────────────────────────────────────┐
│                 E2E Tests                   │ 10%
│          (Critical User Journeys)           │
├─────────────────────────────────────────────┤
│            Visual Tests                     │ 10%
│       (Storybook Snapshots)                 │
├─────────────────────────────────────────────┤
│            Integration Tests                │ 25%
│         (API + Component Tests)             │
├─────────────────────────────────────────────┤
│              Unit Tests                     │ 55%
│        (Business Logic + Utils)             │
└─────────────────────────────────────────────┘
```

### 🔧 測試文件結構
```
__tests__/
├── unit/              # 單元測試
├── integration/       # 整合測試
├── visual/            # 視覺測試 (新增)
├── fixtures/          # 測試數據
├── schemas/           # Zod schemas (新增)
└── utils/            # 測試工具

e2e/
├── auth/             # 認證流程
├── business/         # 業務流程
└── smoke/            # 冒煙測試

__mocks__/
├── services/         # 服務 mocks
├── data/            # 數據 mocks
└── schemas/         # Schema validators (新增)

.storybook/
├── snapshots/       # 視覺快照 (新增)
└── test-runner.ts   # 測試配置 (新增)
```

## 🧪 測試策略

### 📝 測試計劃
- **單元測試**: 80% 覆蓋率，所有業務邏輯必須有測試
- **整合測試**: API 端點 100% 覆蓋，關鍵組件交互測試
- **E2E測試**: 10 個關鍵用戶旅程，包括登入、標籤列印、庫存轉移
- **視覺測試**: 所有主要組件的 Storybook snapshot
- **性能測試**: 關鍵 API 響應時間 < 200ms

### 🎯 測試目標
- **代碼覆蓋率**: 80%
- **關鍵路徑**: 100%
- **視覺覆蓋**: 90% UI 組件
- **測試執行時間**: < 5 分鐘（單元+整合），< 15 分鐘（E2E）

### 🏷️ Skip Reason Taxonomy

#### 標準化標籤格式
```typescript
// @skip[優先級] - 原因類別：具體描述
// 例子：
// @skip[P0] - unstable: 數據 schema 不穩定
// @skip[P1] - flaky: 間歇性失敗，需要調查
// @skip[P2] - deprecated: 功能已棄用，待移除
```

#### 原因類別定義
| 類別 | 描述 | 優先級 | 行動 |
|------|------|--------|------|
| **unstable** | Schema 或 API 不穩定 | P0 | 立即修復 |
| **flaky** | 間歇性失敗 | P1 | 調查原因 |
| **deprecated** | 功能已棄用 | P2 | 計劃移除 |
| **environment** | 環境相關問題 | P1 | 環境配置 |
| **pending** | 等待實現 | P2 | 完成開發 |
| **browser** | 瀏覽器兼容性 | P3 | 長期計劃 |

### 🔐 Schema Validation 策略

#### Zod Schema 定義
```typescript
// schemas/product.schema.ts
import { z } from 'zod';

export const ProductSchema = z.object({
  code: z.string().regex(/^[A-Z0-9-]+$/),
  description: z.string().min(1).max(500),
  colour: z.string().optional(),
  standard_qty: z.number().positive(),
  type: z.enum(['RAW', 'FINISHED', 'COMPONENT'])
});

// Mock 工廠使用
export const createMockProduct = (override?: Partial<Product>) => {
  const defaultProduct = {
    code: 'TEST-001',
    description: 'Test Product',
    standard_qty: 100,
    type: 'FINISHED' as const
  };
  
  return ProductSchema.parse({ ...defaultProduct, ...override });
};
```

#### Schema Registry
```typescript
// __mocks__/schemas/registry.ts
export const SchemaRegistry = {
  product: ProductSchema,
  user: UserSchema,
  order: OrderSchema,
  // ... 其他 schemas
};

// 自動驗證所有 mock data
export function validateMockData<T>(
  schemaName: keyof typeof SchemaRegistry,
  data: unknown
): T {
  return SchemaRegistry[schemaName].parse(data) as T;
}

## 🚨 風險評估

### ⚠️ 主要風險
| 風險 | 可能性 | 影響程度 | 風險等級 | 緩解策略 |
|------|--------|----------|----------|----------|
| 影響 TypeScript 遷移進度 | 中 | 高 | 🟡 | 分階段執行，優先修復關鍵測試 |
| 測試執行時間過長 | 高 | 中 | 🟡 | 實施並行化和測試分級 |
| Mock 數據不一致 | 中 | 高 | 🟡 | 建立中央化 mock 管理 |
| CI/CD 中斷 | 低 | 高 | 🟡 | 保留舊測試直到新測試穩定 |

### 🛡️ 應急計劃
- **備選方案**: 如果時間緊迫，優先修復 P0/P1 測試，其他延後
- **回滾計劃**: 保留原始測試文件備份，可快速回滾
- **溝通計劃**: 每週更新進度，及時報告阻塞問題

## 📊 資源規劃

### 👥 人力資源
- **開發團隊**: 2 名工程師（50% 時間）
- **測試團隊**: 1 名 QA 工程師（全職）
- **DevOps**: 1 名工程師（25% 時間）

### ⏱️ 時間規劃
- **總時長**: 6-8 週
- **關鍵里程碑**: 
  - Week 1: Phase 1 完成
  - Week 3-4: Phase 2 完成
  - Week 7-8: Phase 3 完成
- **緩衝時間**: 預留 2 週處理意外問題

## 📈 成功指標

### 🎯 階段目標
- **Phase 1**: 核心測試 100% 通過，0 個關鍵 skip tests
- **Phase 2**: 所有測試轉換為 TypeScript，0 個 any types
- **Phase 3**: 80% 覆蓋率，測試執行時間減少 30%

### 📊 量化指標
- **Skip Tests**: 24 → 0
- **測試覆蓋率**: 當前 → 80%
- **TypeScript 測試**: 80% → 100%
- **測試執行時間**: 減少 30%
- **Production Bugs**: 減少 50%

## 🤔 待用戶確認的問題

1. **三階段計劃的時間安排是否合理？**
   - Phase 1 的 1 週時間是否太趕？
   - 總體 6-8 週是否符合預期？

2. **技術選型是否符合團隊偏好？**
   - MSW vs 傳統 mock 方案
   - Playwright vs 其他 E2E 工具

3. **優先級是否正確？**
   - 是否有其他更重要的測試需要優先處理？
   - GraphQL 清理是否可以延後？

4. **資源分配是否可行？**
   - 團隊是否有足夠人力支持？
   - 是否需要外部支援？

5. **特殊要求**
   - 是否有合規性測試要求？
   - 是否需要保留特定的舊測試？

---

**計劃建立人**: AI Agent 團隊  
**計劃狀態**: 🔄 迭代中  
**用戶參與度**: 高 - 提供具體改進建議  
**迭代次數**: 2  
**最後更新**: 2025-07-21 11:00:00

## 🔄 根據你嘅反饋，我哋調整咗：

### 調整摘要
- **調整1**: 新增 Skip Reason Taxonomy 系統，為所有跳過測試加上標準化標籤
- **調整2**: 加入 Storybook 視覺測試層，佔測試金字塔 10%
- **調整3**: 引入 Zod schema validation，確保測試數據一致性

### 主要改進
1. **測試管理提升**: Skip reason 標籤讓我們可以快速識別和優先處理問題
2. **UI 質量保證**: 視覺測試減少 UI regression，特別重要的標籤列印界面
3. **數據一致性**: Schema validation 確保 mock 數據符合真實數據結構

## ❓ 請確認：

1. **呢啲調整係咪符合你嘅期望？**
   - Skip Reason Taxonomy 的分類是否足夠？
   - Storybook 視覺測試的覆蓋率目標（90%）是否合理？

2. **仲有咩地方需要修改？**
   - 是否需要加入其他測試工具或策略？
   - 時間安排是否需要調整？

3. **可以開始制定詳細計劃嗎？**
   - 如果滿意，我會生成最終版本
   - 如果還有意見，我們可以繼續迭代

**相關文檔**: 
- [測試債務分析報告](./test-debt-analysis.md)
- [TypeScript 遷移計劃](./typescript-migration-plan.md)
- [Skip Reason Taxonomy 指南](./skip-reason-taxonomy.md) (待建立)
- [Zod Schema Registry 文檔](./zod-schema-registry.md) (待建立)