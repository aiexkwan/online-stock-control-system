# FormCard 使用指南

## 概述
FormCard 是統一的表單卡片組件，取代原有的獨立表單組件。它使用 GraphQL 動態配置，支援22種字段類型和多種表單類型。

## 主要特性

### 🎯 核心功能
- **動態表單配置**: 基於 GraphQL Schema 的動態表單生成
- **統一驗證引擎**: 前端實時驗證 + 後端驗證
- **22種字段類型**: 從基礎輸入到複雜編輯器
- **響應式佈局**: 自適應桌面和移動端
- **Apollo Client 整合**: 完整的 GraphQL 生態系統支援

### ✨ 用戶體驗
- **進度顯示**: 表單完成進度條
- **實時驗證**: 輸入時即時反饋
- **動畫過渡**: 流暢的視覺效果
- **無障礙支援**: 完整的 a11y 標準
- **錯誤摘要**: 統一的錯誤展示

## 快速開始

### 基本使用
```tsx
import { FormCard, FormType } from '@/components/dashboard/cards/FormCard';

function ProductEditPage() {
  return (
    <FormCard
      formType={FormType.PRODUCT_EDIT}
      onSubmitSuccess={(data) => console.log('Success:', data)}
      onSubmitError={(error) => console.error('Error:', error)}
    />
  );
}
```

### 編輯現有數據
```tsx
<FormCard
  formType={FormType.PRODUCT_EDIT}
  entityId="product-123"
  prefilledData={{
    code: 'PROD-001',
    description: 'Existing Product',
    colour: 'BLUE',
    standard_qty: 100
  }}
  onSubmitSuccess={handleUpdate}
/>
```

### 自定義配置
```tsx
<FormCard
  formType={FormType.USER_REGISTRATION}
  showProgress={true}
  showValidationSummary={true}
  showHeader={true}
  height={600}
  className="custom-form"
  onFieldChange={(field, value) => console.log(`${field}: ${value}`)}
  onCancel={() => router.back()}
/>
```

## 支援的表單類型

### 已實現
- `PRODUCT_EDIT`: 產品編輯表單
- `USER_REGISTRATION`: 用戶註冊表單  
- `ORDER_CREATE`: 訂單創建表單
- `WAREHOUSE_TRANSFER`: 倉庫轉移表單

### 預留擴展
- `QUALITY_CHECK`: 質量檢查表單
- `INVENTORY_ADJUST`: 庫存調整表單
- 其他業務特定表單...

## 支援的字段類型 (22種)

### 基礎輸入
- `TEXT`: 文本輸入
- `NUMBER`: 數字輸入
- `EMAIL`: 郵箱驗證
- `PASSWORD`: 密碼輸入
- `URL`: 網址驗證
- `PHONE`: 電話號碼

### 選擇器
- `SELECT`: 單選下拉
- `MULTISELECT`: 多選下拉
- `RADIO`: 單選按鈕組
- `CHECKBOX`: 多選框

### 日期時間
- `DATE`: 日期選擇
- `DATETIME`: 日期時間選擇

### 文本編輯
- `TEXTAREA`: 多行文本
- `RICH_TEXT`: 富文本編輯器
- `CODE_EDITOR`: 代碼編輯器
- `JSON_EDITOR`: JSON 編輯器

### 文件上傳
- `FILE_UPLOAD`: 通用文件上傳
- `IMAGE_UPLOAD`: 圖片上傳

### 特殊輸入
- `RANGE`: 範圍滑塊
- `COLOR`: 顏色選擇器
- `CURRENCY`: 貨幣輸入
- `PERCENTAGE`: 百分比輸入

## 表單驗證

### 內建驗證規則
```typescript
interface FieldValidation {
  required?: boolean;           // 必填
  minLength?: number;          // 最小長度
  maxLength?: number;          // 最大長度
  min?: number;                // 最小值
  max?: number;                // 最大值
  pattern?: string;            // 正則表達式
  customMessage?: string;      // 自定義錯誤訊息
}
```

### 實時驗證
- 輸入時即時驗證
- 失焦時觸發驗證
- 提交前完整驗證
- 錯誤狀態視覺反饋

## GraphQL 整合

### 查詢表單配置
```graphql
query FormCardQuery($input: FormCardInput!) {
  formCardData(input: $input) {
    id
    formType
    title
    description
    fields {
      id
      name
      label
      type
      required
      validation {
        required
        minLength
        maxLength
        pattern
      }
      options {
        value
        label
      }
    }
    layout {
      columns
      spacing
    }
  }
}
```

### 提交表單數據
```graphql
mutation SubmitForm($input: FormSubmitInput!) {
  submitForm(input: $input) {
    success
    message
    data
    errors {
      field
      message
    }
  }
}
```

## 最佳實踐

### 1. 錯誤處理
```tsx
const handleSubmitError = (error: any) => {
  if (error.graphQLErrors) {
    // GraphQL 錯誤
    error.graphQLErrors.forEach((err: any) => {
      toast.error(err.message);
    });
  } else if (error.networkError) {
    // 網絡錯誤
    toast.error('Network error, please try again');
  } else {
    // 其他錯誤
    toast.error('An unexpected error occurred');
  }
};
```

### 2. 載入狀態
```tsx
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmitSuccess = async (data: any) => {
  setIsSubmitting(true);
  try {
    await processFormData(data);
    toast.success('Form submitted successfully');
    router.push('/success');
  } catch (error) {
    console.error('Processing error:', error);
  } finally {
    setIsSubmitting(false);
  }
};
```

### 3. 表單狀態管理
```tsx
// 使用 React Hook Form 或 Formik 進行複雜狀態管理
import { useForm } from 'react-hook-form';

function ComplexForm() {
  const { control, handleSubmit, watch } = useForm();
  const watchedValues = watch();
  
  return (
    <FormCard
      formType={FormType.PRODUCT_EDIT}
      prefilledData={watchedValues}
      onFieldChange={(field, value) => {
        setValue(field, value);
      }}
    />
  );
}
```

## 性能優化

### 1. 懶加載
```tsx
const FormCard = lazy(() => import('./FormCard'));

function FormPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <FormCard formType={FormType.PRODUCT_EDIT} />
    </Suspense>
  );
}
```

### 2. 記憶化
```tsx
const memoizedFormCard = useMemo(() => (
  <FormCard
    formType={formType}
    prefilledData={data}
    onSubmitSuccess={handleSuccess}
  />
), [formType, data]);
```

### 3. 虛擬化大型表單
對於字段數量超過50個的大型表單，考慮使用分步驟表單或虛擬化渲染。

## 測試

### 單元測試
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { FormCard, FormType } from './FormCard';

test('validates required fields', async () => {
  render(<FormCard formType={FormType.PRODUCT_EDIT} />);
  
  fireEvent.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(await screen.findByText(/required/i)).toBeInTheDocument();
});
```

### E2E 測試
```typescript
// cypress/integration/form-card.spec.ts
describe('FormCard', () => {
  it('submits product form successfully', () => {
    cy.visit('/admin/products/new');
    cy.get('[data-testid="product-code"]').type('TEST-001');
    cy.get('[data-testid="product-description"]').type('Test Product');
    cy.get('[data-testid="submit-button"]').click();
    cy.contains('Product created successfully');
  });
});
```

## 遷移指南

### 從 ProductEditForm 遷移
```tsx
// 舊代碼
<ProductEditForm
  initialData={product}
  isCreating={false}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>

// 新代碼
<FormCard
  formType={FormType.PRODUCT_EDIT}
  entityId={product.id}
  prefilledData={product}
  onSubmitSuccess={handleSubmit}
  onCancel={handleCancel}
/>
```

### 自定義字段遷移
```tsx
// 需要自定義驗證的字段
const customValidation = {
  code: {
    required: true,
    pattern: '^[A-Z0-9-_]+$',
    customMessage: 'Code must contain only uppercase letters, numbers, and hyphens'
  }
};

// 在 GraphQL Schema 中定義，或通過 metadata 傳遞
```

## 故障排除

### 常見問題
1. **表單不顯示**: 檢查 GraphQL 查詢是否正確
2. **驗證不工作**: 確認字段配置中的 validation 規則
3. **提交失敗**: 檢查網絡連接和 mutation 配置
4. **樣式問題**: 確認 Tailwind CSS 類名是否正確

### 調試模式
```tsx
<FormCard
  formType={FormType.PRODUCT_EDIT}
  onFieldChange={(field, value) => {
    console.log('Field changed:', { field, value });
  }}
  // 添加其他調試回調
/>
```

## 後續開發

### 計劃功能
- [ ] 條件式字段顯示
- [ ] 字段間依賴關係
- [ ] 多步驟表單支援
- [ ] 表單範本系統
- [ ] 自動保存功能
- [ ] 表單性能監控

### 擴展點
- 自定義字段類型
- 自定義驗證器
- 自定義佈局引擎
- 第三方集成 (例如: DocuSign, Payment)

---

最後更新：2025年7月23日
版本：1.0.0