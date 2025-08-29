# QCLabelCard.tsx 簡化改進計劃

_最後更新日期: 2025-08-29_

## 功能

**QCLabelCard 組件簡化與重構計劃**

將目前 672 行的 QCLabelCard.tsx 組件進行全面重構，遵循 KISS、DRY、YAGNI 和 SOLID 原則，提升代碼可讀性、可維護性和可測試性。

## 當前階段

### 問題識別

- **組件過於龐大**: 672 行單一組件，違反 KISS 原則
- **職責混雜**: 同時處理 UI 渲染、狀態管理、API 調用、業務邏輯
- **狀態管理複雜**: 10+ 個 useState，狀態依賴關係複雜
- **重複代碼**: 樣式類名、驗證邏輯、事件處理模式重複
- **深度嵌套**: 條件渲染嵌套過深，影響可讀性
- **測試困難**: 單體組件難以進行單元測試

### 技術債務評估

- **代碼品質評分**: C+ (需要重大重構)
- **維護成本**: 高 - 新增功能或修改困難
- **測試覆蓋**: 低 - 複雜組件難以測試
- **性能影響**: 中 - 存在不必要的重渲染

## 計劃目標

### 主要目標

1. **符合 KISS 原則**: 將 672 行組件拆分為 < 200 行主組件 + 多個子組件
2. **實現關注點分離**: 清晰分離 UI、業務邏輯、狀態管理
3. **提升可維護性**: 模組化設計，便於後續功能擴展
4. **改善測試覆蓋**: 各子組件可獨立測試
5. **優化性能**: 減少不必要的重渲染

### 目標架構

```
QCLabelCard (主組件 ~150行)
├── hooks/
│   ├── useQcFormValidation.ts
│   ├── useAcoOrdersManagement.ts
│   └── useQcLabelBusiness.ts (優化現有)
├── components/
│   ├── QcProductForm.tsx
│   ├── AcoOrderSelector.tsx
│   ├── SlateProductDetails.tsx
│   ├── QcProgressSection.tsx
│   └── ErrorOverlay.tsx
└── types/
    └── qcTypes.ts (整合現有類型)
```

## 問題分析報告

### 代碼品質審查結果

#### 🔴 高嚴重性問題

1. **組件過於複雜** (`app/(app)/admin/cards/QCLabelCard.tsx:25-672`)
   - 單一組件承擔過多職責
   - 672 行代碼違反 KISS 原則
   - 維護和測試成本極高

2. **狀態管理混亂** (`QCLabelCard.tsx:25-78`)
   - 10+ 個 useState，相互依賴複雜
   - 狀態更新邏輯分散在多個地方
   - 缺乏狀態同步控制

3. **API 調用邏輯內嵌** (`QCLabelCard.tsx:185-272`)
   - 87 行的 `handleProductInfoChange` 函數
   - 直接在組件內進行 Supabase 查詢
   - 錯誤處理和緩存邏輯混合

#### 🟡 中嚴重性問題

1. **重複代碼** (多處)
   - 樣式類名重複: `cn(cardTextStyles.body, 'text-slate-400')`
   - 驗證邏輯模式相似
   - 事件處理器結構重複

2. **深度嵌套渲染** (`QCLabelCard.tsx:480-580`)
   - 條件渲染嵌套過深
   - JSX 結構複雜，可讀性差

### 性能分析

- **重渲染風險**: 多個狀態變更可能觸發不必要的重渲染
- **記憶化不足**: 複雜計算缺乏 useMemo 優化
- **事件處理器重建**: 部分回調函數每次渲染都重建

## 階段一：核心業務邏輯提取

### 階段進度

📋 **計劃中** (預計 3-5 工作日)

### 階段任務分解

1. **提取 ACO 訂單管理 Hook** (`useAcoOrdersManagement.ts`)
   - 將 `QCLabelCard.tsx:185-272` 的 ACO 查詢邏輯提取
   - 實現訂單緩存機制
   - 處理加載狀態和錯誤狀態
   - 提供清晰的 API 接口

2. **提取表單驗證 Hook** (`useQcFormValidation.ts`)
   - 將 `QCLabelCard.tsx:81-126` 的驗證邏輯提取
   - 統一驗證規則和錯誤消息
   - 實現防抖驗證機制
   - 優化觸摸狀態管理

3. **優化現有業務邏輯 Hook** (`useAdminQcLabelBusiness.ts`)
   - 整合新的驗證和 ACO 管理邏輯
   - 簡化對外接口
   - 改善錯誤處理機制

### 階段重要記事

- **保持向後兼容**: 確保現有功能不受影響
- **單元測試**: 每個 Hook 都需要相應的測試文件
- **TypeScript 類型**: 確保類型安全，避免 any 類型
- **錯誤邊界**: 適當的錯誤處理和回退機制

### 階段目標

- 主組件代碼減少至 ~450 行
- 業務邏輯與 UI 邏輯初步分離
- 建立清晰的 Hook 接口規範

### 成功標準

- [ ] `useAcoOrdersManagement` Hook 完成並測試通過
- [ ] `useQcFormValidation` Hook 完成並測試通過
- [ ] 現有功能 100% 保持正常運作
- [ ] TypeScript 編譯無錯誤
- [ ] 單元測試覆蓋率 > 80%

## 階段二：UI 組件拆分

### 階段進度

⏸️ **等待階段一完成**

### 階段任務分解

1. **創建 AcoOrderSelector 組件**
   - 提取 `QCLabelCard.tsx:490-552` 的 ACO 訂單選擇邏輯
   - 實現獨立的訂單下拉選單和狀態顯示
   - 添加適當的 loading 和 error 狀態

2. **創建 SlateProductDetails 組件**
   - 提取 `QCLabelCard.tsx:555-578` 的 Slate 產品詳情
   - 實現批次號輸入和驗證
   - 統一樣式和交互行為

3. **創建 QcProgressSection 組件**
   - 提取 `QCLabelCard.tsx:583-601` 的進度顯示邏輯
   - 封裝進度條和狀態顯示
   - 實現懶加載和錯誤邊界

4. **創建 ErrorOverlay 組件**
   - 提取 `QCLabelCard.tsx:642-666` 的錯誤覆蓋層
   - 統一錯誤和警告的顯示方式
   - 實現可配置的覆蓋層類型

### 階段重要記事

- **組件接口設計**: 保持接口簡潔明瞭
- **樣式一致性**: 使用統一的設計系統
- **可訪問性**: 確保各組件符合無障礙標準
- **性能優化**: 使用 React.memo 避免不必要渲染

### 階段目標

- 主組件代碼減少至 ~250 行
- 實現清晰的組件層次結構
- 每個子組件職責單一且可復用

### 成功標準

- [ ] 4 個子組件全部完成並測試通過
- [ ] 主組件邏輯清晰簡潔
- [ ] 視覺效果與原組件完全一致
- [ ] 各子組件可獨立測試

## 階段三：性能優化與重構完善

### 階段進度

⏸️ **等待階段二完成**

### 階段任務分解

1. **記憶化優化**
   - 使用 `useMemo` 優化複雜計算
   - 使用 `useCallback` 穩定事件處理器
   - 使用 `React.memo` 包裝純展示組件

2. **樣式常數提取**
   - 建立 `qcStyles.ts` 統一樣式定義
   - 減少重複的 CSS 類名組合
   - 實現主題一致性

3. **主組件最終重構**
   - 整合所有提取的 Hook 和組件
   - 優化組件結構和 JSX 邏輯
   - 確保代碼符合 ESLint 規範

4. **測試覆蓋完善**
   - 為所有新組件和 Hook 編寫單元測試
   - 添加整合測試驗證組件協作
   - 實現 E2E 測試覆蓋主流程

### 階段重要記事

- **性能基準**: 建立渲染性能基準測試
- **代碼審查**: 完整的 Code Review 流程
- **文檔更新**: 更新相關技術文檔
- **回歸測試**: 確保所有現有功能正常

### 階段目標

- 主組件最終控制在 ~150 行以內
- 整體性能提升 20%+
- 測試覆蓋率達到 90%+
- 代碼品質評分提升至 A-

### 成功標準

- [ ] 性能測試顯示渲染時間改善 20%+
- [ ] 所有組件和 Hook 測試覆蓋率 > 90%
- [ ] ESLint 檢查無任何 warning
- [ ] TypeScript 類型檢查 100% 通過
- [ ] Code Review 通過且無重大問題

## 範例

### 提取前 (當前狀況)

```typescript
// QCLabelCard.tsx (672 行)
export const QCLabelCard: React.FC<QCLabelCardProps> = ({ className }) => {
  // 10+ useState declarations
  const [formData, setFormData] = useState<FormData>(getInitialFormData());
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  // ... 8 more useState

  // 87行的複雜事件處理器
  const handleProductInfoChange = (newProductInfo: ProductInfo | null) => {
    // 複雜的產品信息處理邏輯
    // API 調用、緩存管理、狀態更新
    // 87 行代碼...
  };

  // 62行的 ACO 訂單選擇 JSX
  {productInfo.type === 'ACO' && (
    <div className='space-y-3'>
      {/* 複雜的訂單選擇邏輯 */}
      <select /* ... 複雜的屬性和事件處理 */>
        {/* 訂單選項渲染 */}
      </select>
      {/* 錯誤狀態、加載狀態顯示 */}
    </div>
  )}

  return (
    <div className={`h-full ${className || ''}`}>
      {/* 200+ 行的複雜 JSX 結構 */}
    </div>
  );
};
```

### 提取後 (目標架構)

```typescript
// QCLabelCard.tsx (~150 行)
export const QCLabelCard: React.FC<QCLabelCardProps> = ({ className }) => {
  // 使用自定義 Hook 管理狀態和邏輯
  const formValidation = useQcFormValidation();
  const acoOrdersManagement = useAcoOrdersManagement();
  const businessLogic = useAdminQcLabelBusiness({
    formValidation,
    acoOrdersManagement,
  });

  return (
    <div className={`h-full ${className || ''}`}>
      <SpecialCard variant='glass'>
        <QcLabelHeader />

        <div className='flex-1 overflow-auto p-4'>
          <QcProductForm
            formData={businessLogic.formData}
            validation={formValidation}
            onSubmit={businessLogic.handlePrintLabel}
          />

          {businessLogic.productInfo?.type === 'ACO' && (
            <AcoOrderSelector
              orders={acoOrdersManagement.orders}
              loading={acoOrdersManagement.loading}
              onOrderSelect={businessLogic.handleAcoOrderSelect}
            />
          )}

          {businessLogic.productInfo?.type?.includes('slate') && (
            <SlateProductDetails
              batchNumber={businessLogic.batchNumber}
              onBatchNumberChange={businessLogic.handleBatchNumberChange}
            />
          )}

          {businessLogic.showProgress && (
            <QcProgressSection progress={businessLogic.progress} />
          )}
        </div>
      </SpecialCard>

      <ErrorOverlay
        show={businessLogic.showError}
        type={businessLogic.errorType}
        message={businessLogic.errorMessage}
        onClose={businessLogic.hideError}
      />
    </div>
  );
};

// hooks/useQcFormValidation.ts
export const useQcFormValidation = (formData: FormData, productInfo: ProductInfo) => {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback((field: string): string => {
    // 統一的欄位驗證邏輯
    switch (field) {
      case 'productCode':
        return formData.productCode.trim() ? '' : 'Product code is required';
      // ... 其他欄位驗證
    }
  }, [formData, productInfo]);

  const validateForm = useCallback((): boolean => {
    // 整體表單驗證邏輯
    return Object.keys(REQUIRED_FIELDS).every(field =>
      validateField(field) === ''
    );
  }, [validateField]);

  return { touched, setTouched, validateField, validateForm };
};

// components/AcoOrderSelector.tsx
interface AcoOrderSelectorProps {
  orders: string[];
  loading: boolean;
  selectedOrder: string;
  onOrderSelect: (orderRef: string) => void;
  remainingQuantity?: number;
  error?: string;
}

export const AcoOrderSelector: React.FC<AcoOrderSelectorProps> = ({
  orders, loading, selectedOrder, onOrderSelect, remainingQuantity, error
}) => {
  return (
    <div className={qcStyles.sectionContainer}>
      <label className={qcStyles.fieldLabel}>
        ACO Order Reference
      </label>

      <select
        value={selectedOrder}
        onChange={(e) => onOrderSelect(e.target.value)}
        disabled={loading}
        className={qcStyles.selectInput}
      >
        <option value="">Select ACO Order...</option>
        {orders.map(orderRef => (
          <AcoOrderOption key={orderRef} orderRef={orderRef} />
        ))}
      </select>

      {remainingQuantity !== null && (
        <p className={qcStyles.infoText}>
          Remaining Quantity: <span className={qcStyles.highlight}>{remainingQuantity}</span>
        </p>
      )}

      {error && <p className={qcStyles.errorText}>{error}</p>}
    </div>
  );
};
```

## 文件記錄

### 需要參考的文件

1. **技術棧文檔**
   - [`docs/TechStack/FrontEnd.md`](../../TechStack/FrontEnd.md) - React、TypeScript 最佳實踐
   - [`docs/TechStack/Testing.md`](../../TechStack/Testing.md) - 測試策略和工具

2. **相關代碼文件**
   - `app/(app)/admin/hooks/useAdminQcLabelBusiness.tsx` - 現有業務邏輯 Hook
   - `app/(app)/admin/types/adminQcTypes.ts` - 類型定義
   - `lib/card-system/` - 卡片系統組件
   - `components/ui/` - 通用 UI 組件

3. **測試參考**
   - `__tests__/unit/` - 單元測試範例
   - `__tests__/integration/` - 整合測試範例
   - `e2e/` - E2E 測試範例

### 外部資源

- [React 18.3.1 文檔](https://react.dev/) - Hook 最佳實踐
- [TypeScript 5.8.3 文檔](https://www.typescriptlang.org/) - 類型系統指南
- [Testing Library 文檔](https://testing-library.com/) - 組件測試方法

## 其他考量

### 經常遺漏的陷阱

1. **狀態同步問題**
   - 多個 Hook 之間的狀態同步
   - 防止狀態更新競態條件
   - 確保狀態更新的時序正確

2. **性能退化風險**
   - 過度分割可能導致 prop drilling
   - Hook 依賴數組設置錯誤導致無限重渲染
   - Context 使用不當影響性能

3. **類型安全遺漏**
   - Hook 返回值類型定義不完整
   - 組件 Props 接口設計不合理
   - 泛型使用過度複雜化

4. **測試覆蓋盲點**
   - Hook 的邊界情況測試
   - 組件間交互的整合測試
   - 錯誤場景的測試覆蓋

5. **向後兼容性**
   - 確保重構不影響其他依賴此組件的代碼
   - 漸進式重構策略，避免大爆炸式改動
   - 適當的功能標記和回退機制

### 風險緩解策略

1. **漸進式重構**
   - 分階段進行，每個階段都可以獨立驗證
   - 保持功能分支，便於快速回滾
   - 每個階段完成後進行完整的回歸測試

2. **測試先行**
   - 先為現有功能建立測試基線
   - 每個新 Hook 和組件都先寫測試
   - 使用測試驅動開發確保品質

3. **代碼審查**
   - 每個階段完成後進行 Code Review
   - 邀請其他開發者參與設計審查
   - 確保符合項目編碼規範

4. **性能監控**
   - 建立性能基準測試
   - 監控重構前後的性能指標
   - 及時發現和解決性能問題

## 成功標準總結

### 技術指標

- [ ] 主組件代碼行數: 672行 → < 150行
- [ ] 組件數量: 1個 → 6個 (1主 + 5子)
- [ ] Hook 數量: 1個 → 3個
- [ ] 代碼品質評分: C+ → A-
- [ ] 測試覆蓋率: < 30% → > 90%

### 業務指標

- [ ] 功能完整性: 100% 保持現有功能
- [ ] 性能改善: 渲染時間改善 > 20%
- [ ] 開發效率: 新功能開發時間減少 > 30%
- [ ] Bug 修復時間: 減少 > 50%

### 維護性指標

- [ ] 新開發者上手時間: 減少 > 40%
- [ ] 代碼修改影響範圍: 局部化 > 80%
- [ ] 單元測試執行時間: < 5秒
- [ ] 集成測試通過率: > 95%

這個重構計劃將確保 QCLabelCard 組件符合現代 React 開發的最佳實踐，提升整體代碼品質和團隊開發效率。
