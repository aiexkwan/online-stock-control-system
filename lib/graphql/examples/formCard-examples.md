# FormCard GraphQL Schema 使用範例

# NewPennine Warehouse Management System

## 概述

FormCard 統一表單系統為 NewPennine WMS 提供了動態、可配置的表單解決方案。本文檔展示如何使用 GraphQL schema 來配置和操作各種表單。

## 支援的表單類型

### 1. 產品相關表單

- `PRODUCT_EDIT` - 產品編輯表單 (基於現有 ProductEditForm)
- `PRODUCT_CREATE` - 產品創建表單
- `PRODUCT_BULK_EDIT` - 產品批量編輯

### 2. 文件相關表單

- `FILE_UPLOAD` - 文件上傳表單
- `FILE_METADATA_EDIT` - 文件元數據編輯
- `DOCUMENT_UPLOAD` - 文檔上傳表單

### 3. 操作確認表單

- `VOID_CONFIRMATION` - 作廢確認表單
- `DELETE_CONFIRMATION` - 刪除確認表單
- `TRANSFER_CONFIRMATION` - 轉移確認表單

### 4. 庫存相關表單

- `INVENTORY_ADJUST` - 庫存調整表單
- `INVENTORY_TRANSFER` - 庫存轉移表單
- `STOCK_COUNT` - 盤點表單

## 使用範例

### 1. 獲取產品編輯表單配置

```graphql
query GetProductEditForm {
  formConfig(type: PRODUCT_EDIT) {
    id
    title
    fields {
      id
      name
      label
      type
      placeholder
      validationRules {
        type
        value
        message
      }
      isRequired
      options {
        value
        label
        isDefault
      }
      order
    }
    layout
    submitButtonText
    validateOnChange
  }

  productFormOptions {
    colours {
      value
      label
    }
    types {
      value
      label
    }
  }
}
```

**回應範例**:

```json
{
  "data": {
    "formConfig": {
      "id": "product-edit-v1",
      "title": "Edit Product",
      "fields": [
        {
          "id": "field-code",
          "name": "code",
          "label": "Product Code",
          "type": "TEXT",
          "placeholder": "Enter product code...",
          "validationRules": [
            {
              "type": "REQUIRED",
              "value": null,
              "message": "Product Code is required"
            },
            {
              "type": "MAX_LENGTH",
              "value": 50,
              "message": "Product Code must be less than 50 characters"
            }
          ],
          "isRequired": true,
          "options": [],
          "order": 1
        },
        {
          "id": "field-description",
          "name": "description",
          "label": "Product Description",
          "type": "TEXT",
          "placeholder": "Enter product description...",
          "validationRules": [
            {
              "type": "REQUIRED",
              "value": null,
              "message": "Product Description is required"
            }
          ],
          "isRequired": true,
          "options": [],
          "order": 2
        },
        {
          "id": "field-colour",
          "name": "colour",
          "label": "Product Colour",
          "type": "SELECT",
          "placeholder": "Select colour...",
          "validationRules": [],
          "isRequired": false,
          "options": [],
          "order": 3
        }
      ],
      "layout": "VERTICAL",
      "submitButtonText": "Update Product",
      "validateOnChange": true
    },
    "productFormOptions": {
      "colours": [
        { "value": "", "label": "Select colour..." },
        { "value": "Yellow", "label": "Yellow" },
        { "value": "Grey", "label": "Grey" },
        { "value": "Old World Red", "label": "Old World Red" }
      ],
      "types": [
        { "value": "", "label": "Select type..." },
        { "value": "SupaStack", "label": "SupaStack" },
        { "value": "Manhole", "label": "Manhole" }
      ]
    }
  }
}
```

### 2. 提交產品編輯表單

```graphql
mutation SubmitProductEdit($input: FormSubmissionInput!) {
  submitForm(input: $input) {
    success
    entityId
    data
    validation {
      isValid
      errors {
        fieldName
        message
        errorCode
      }
    }
    error {
      message
      code
    }
  }
}
```

**變數範例**:

```json
{
  "input": {
    "formType": "PRODUCT_EDIT",
    "formConfigId": "product-edit-v1",
    "data": {
      "code": "TEST-001",
      "description": "Test Product Updated",
      "colour": "Yellow",
      "standard_qty": 100,
      "type": "SupaStack"
    },
    "entityId": "TEST-001",
    "submitMode": "UPDATE"
  }
}
```

### 3. 動態表單驗證

```graphql
query ValidateProduct($data: JSON!) {
  validateFormData(formType: PRODUCT_EDIT, data: $data) {
    isValid
    errors {
      fieldName
      message
      errorCode
      value
    }
    warnings {
      fieldName
      message
      warningCode
    }
  }
}
```

### 4. 獲取文件上傳表單

```graphql
query GetFileUploadForm {
  formConfig(type: FILE_UPLOAD) {
    id
    title
    fields {
      id
      name
      label
      type
      validationRules {
        type
        value
        message
      }
      isRequired
    }
    layout
  }
}
```

### 5. 複雜表單：庫存調整

```graphql
query GetInventoryAdjustForm {
  formConfig(type: INVENTORY_ADJUST) {
    id
    title
    fields {
      id
      name
      label
      type
      validationRules {
        type
        value
        message
      }
      showConditions {
        fieldName
        operator
        value
      }
      order
      gridCols
    }
    fieldGroups {
      id
      name
      title
      order
      isCollapsible
      fields
    }
    layout
    gridColumns
  }

  inventoryFormOptions {
    locations {
      value
      label
      group
    }
    adjustmentReasons {
      value
      label
      description
    }
  }
}
```

### 6. 批量表單操作

```graphql
mutation BatchUpdateProducts($inputs: [FormSubmissionInput!]!) {
  batchSubmitForms(inputs: $inputs) {
    successful {
      success
      entityId
      data
    }
    failed {
      success
      error {
        message
        code
      }
    }
    totalProcessed
    totalSucceeded
    totalFailed
  }
}
```

## 表單配置管理 (管理員功能)

### 1. 創建新表單配置

```graphql
mutation CreateFormConfig($input: CreateFormConfigInput!) {
  createFormConfig(input: $input) {
    id
    type
    name
    title
    fields {
      id
      name
      label
      type
    }
    version
    isActive
  }
}
```

**變數範例**:

```json
{
  "input": {
    "type": "PRODUCT_CREATE",
    "name": "product-create-form",
    "title": "Create New Product",
    "description": "Form for creating new products",
    "fields": [
      {
        "name": "code",
        "label": "Product Code",
        "type": "TEXT",
        "placeholder": "Enter product code...",
        "validationRules": [
          {
            "type": "REQUIRED",
            "value": null,
            "message": "Product Code is required"
          }
        ],
        "isRequired": true,
        "order": 1
      }
    ],
    "layout": "VERTICAL",
    "validateOnChange": true
  }
}
```

### 2. 動態添加表單字段

```graphql
mutation AddFormField($configId: ID!, $input: CreateFormFieldInput!) {
  addFormField(configId: $configId, input: $input) {
    id
    name
    label
    type
    validationRules {
      type
      message
    }
    order
  }
}
```

## 實時更新 (Subscriptions)

### 1. 監聽表單配置更新

```graphql
subscription FormConfigUpdated($formType: FormType!) {
  formConfigUpdated(formType: $formType) {
    id
    type
    name
    title
    version
    updatedAt
  }
}
```

### 2. 監聽表單提交狀態

```graphql
subscription FormSubmissionStatus($submissionId: ID!) {
  formSubmissionStatus(submissionId: $submissionId) {
    success
    entityId
    validation {
      isValid
      errors {
        fieldName
        message
      }
    }
  }
}
```

## 最佳實踐

### 1. 表單緩存策略

- 表單配置使用長期緩存 (3600s)
- 選項數據使用中期緩存 (1800s)
- 動態數據不緩存或短期緩存

### 2. 批量操作

- 使用 `batchFormFieldOptions` 批量獲取選項
- 使用 `batchSubmitForms` 批量提交表單
- 合理控制批量大小避免性能問題

### 3. 錯誤處理

- 客戶端應該處理 `FormValidationResult` 中的錯誤
- 使用 `validateFormData` 進行提交前驗證
- 合理顯示錯誤和警告信息

### 4. 權限控制

- 所有查詢都需要適當的認證
- 管理員功能需要 `ADMIN` 權限
- 操作功能需要 `OPERATOR` 權限

### 5. 性能優化

- 使用字段選擇避免過度獲取
- 適當使用分頁避免大量數據查詢
- 合理使用緩存減少重複查詢

## 與現有 ProductEditForm 的兼容性

現有的 `ProductEditForm` 組件可以通過以下方式遷移到 FormCard 系統：

1. **配置遷移**: 將硬編碼的表單配置遷移到 GraphQL schema
2. **驗證遷移**: 將客戶端驗證邏輯遷移到統一的驗證規則
3. **選項遷移**: 將靜態選項遷移到動態選項查詢
4. **提交遷移**: 將表單提交邏輯遷移到統一的提交 mutation

這種遷移方式確保了向後兼容性，同時提供了更強大的動態表單能力。
