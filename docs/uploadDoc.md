# Admin 頁面 Upload Files 功能規劃

## 功能概述
在 `/admin` 頁面的導航欄中新增「Upload Files」功能，允許用戶上傳文件到 Supabase Storage 的指定 bucket 和 folder。

## 功能需求

### 1. 導航欄新增項目
- **位置**：Admin Panel 導航欄中新增「Upload Files」選項
- **圖示**：使用 `DocumentArrowUpIcon` 或 `CloudArrowUpIcon`
- **分類**：歸類到「System Tools」類別

### 2. 上載卡片 (Upload Card)
#### 功能特性
- **拖拽上傳**：支援拖拽文件到卡片區域
- **點擊上傳**：點擊卡片開啟文件選擇對話框
- **文件格式限制**：`.pdf, .doc, .png, .jpeg`
- **視覺設計**：
  - 虛線邊框，拖拽時高亮
  - 上傳圖示和提示文字
  - 拖拽狀態的視覺反饋

#### 狀態管理
- **空閒狀態**：顯示上傳提示
- **拖拽懸停**：邊框高亮，背景變色
- **文件選中**：顯示文件信息，展示下拉欄和輸入欄

### 3. 文件夾選擇下拉欄
#### 可選文件夾
- **stockPic**：
  - 用途：庫存圖片
  - 允許格式：`.png, .jpeg`
- **productSpec**：
  - 用途：產品規格文檔
  - 允許格式：`.pdf, .doc`

#### 驗證邏輯
- 根據選擇的文件格式自動篩選可用文件夾
- 如果文件格式不符合任何文件夾要求，顯示錯誤提示

### 4. 檔案名稱輸入欄
- **預設值**：自動填入原始文件名（不含路徑）
- **可編輯**：用戶可以修改文件名
- **驗證**：
  - 不能為空
  - 不能包含特殊字符（/, \, :, *, ?, ", <, >, |）
  - 保留原始文件擴展名

### 5. 確認上傳
- **Confirm 按鈕**：執行上傳操作
- **上傳進度**：顯示上傳進度條
- **成功反饋**：顯示成功消息和文件 URL
- **錯誤處理**：顯示詳細錯誤信息

## 技術實現

### 1. Supabase Storage 配置
```typescript
// Storage bucket: 'documents'
// Folders:
// - stockPic/     (圖片文件)
// - productSpec/  (文檔文件)
```

### 2. 文件驗證
```typescript
const fileValidation = {
  stockPic: ['.png', '.jpeg', '.jpg'],
  productSpec: ['.pdf', '.doc', '.docx']
};

const maxFileSize = 10 * 1024 * 1024; // 10MB
```

### 3. 組件結構
```
UploadFilesDialog
├── FileDropZone
├── FolderSelector
├── FileNameInput
└── UploadButton
```

### 4. 狀態管理
```typescript
interface UploadState {
  selectedFile: File | null;
  selectedFolder: 'stockPic' | 'productSpec' | '';
  fileName: string;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
}
```

## UI/UX 設計

### 1. 對話框佈局
- **標題**：「Upload Files」
- **副標題**：「Upload documents and images to the system」
- **主要區域**：
  1. 文件拖拽區域（大）
  2. 文件夾選擇（中）
  3. 文件名輸入（中）
  4. 操作按鈕（小）

### 2. 視覺風格
- **配色**：與 Admin Panel 一致的藍色漸層主題
- **動畫**：平滑的狀態轉換動畫
- **反饋**：清晰的成功/錯誤狀態提示

### 3. 響應式設計
- **桌面**：橫向佈局，左右分欄
- **移動端**：縱向佈局，上下堆疊

## 錯誤處理

### 1. 文件驗證錯誤
- 不支援的文件格式
- 文件大小超限
- 文件名包含非法字符

### 2. 上傳錯誤
- 網絡連接問題
- Supabase 權限錯誤
- 存儲空間不足

### 3. 用戶操作錯誤
- 未選擇文件夾
- 文件名為空
- 重複文件名

## 安全考慮

### 1. 文件類型驗證
- 檢查文件擴展名
- 驗證 MIME 類型
- 文件內容掃描（如需要）

### 2. 權限控制
- 只有管理員可以上傳文件
- 基於用戶角色的文件夾訪問控制

### 3. 文件大小限制
- 單個文件最大 10MB
- 總存儲空間監控

## 實現步驟

1. **第一階段**：基礎 UI 組件
   - 創建 UploadFilesDialog 組件
   - 實現文件拖拽和選擇功能
   - 添加到 Admin Panel 導航

2. **第二階段**：文件驗證和處理
   - 實現文件格式驗證
   - 添加文件夾選擇邏輯
   - 文件名處理和驗證

3. **第三階段**：Supabase 集成
   - 配置 Storage bucket 和 policies
   - 實現文件上傳功能
   - 錯誤處理和進度顯示

4. **第四階段**：優化和測試
   - 性能優化
   - 用戶體驗改進
   - 全面測試和調試
