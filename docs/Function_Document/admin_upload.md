# 文件上傳中心系統

## 概述

文件上傳中心系統係 NewPennine 倉庫管理系統嘅數據輸入門戶，採用創新嘅 3D Folder UI 設計，提供直觀同高效嘅文件管理體驗。系統整合 AI 分析能力、Google Drive 同步功能同智能文件處理，大幅提升文檔管理效率同數據準確性。

## 頁面路由
- 主路由：`/admin/upload`
- 佈局組件：`UploadUpdateLayout.tsx`
- 配置：`adminDashboardLayouts.ts` 中嘅 `uploadLayout`

## 核心功能

### 1. 3D 文件夾界面
- **立體視覺效果**：CSS 3D transforms 實現真實文件夾效果
- **拖放上傳**：直觀嘅拖放文件到文件夾操作
- **分類管理**：不同類型文件對應不同文件夾
- **動畫效果**：流暢嘅打開、關閉動畫

### 2. 智能文件處理
- **AI 文檔分析**：OpenAI GPT-4 自動分析訂單 PDF
- **數據自動提取**：自動提取訂單信息並入庫
- **格式識別**：支援多種文檔格式自動識別
- **錯誤校驗**：智能數據校驗同錯誤提示

### 3. 雲端同步整合
- **Google Drive 整合**：文件自動同步到 Google Drive
- **進度可視化**：Google Drive 風格進度提示
- **批量處理**：支援批量文件上傳同處理
- **狀態追蹤**：詳細嘅上傳狀態追蹤

## 主要 Widget 組件

### 歷史記錄類 Widgets

#### 1. OrdersListWidget
**文件位置**：`app/admin/components/dashboard/widgets/OrdersListWidget.tsx`
- **功能**：訂單上傳歷史列表
- **數據源**：`doc_upload` 表（類型篩選為訂單）
- **顯示內容**：
  - 上傳時間
  - 文件名稱
  - 處理狀態
  - AI 分析結果
  - 操作按鈕（查看、重新處理、刪除）
- **功能特性**：
  - 支援搜尋同篩選
  - 分頁顯示
  - 批量操作
  - 詳情查看

#### 2. OtherFilesListWidget
**文件位置**：`app/admin/components/dashboard/widgets/OtherFilesListWidget.tsx`
- **功能**：其他文件上傳歷史
- **數據源**：`doc_upload` 表（非訂單類型）
- **文件類型**：
  - 產品規格文檔
  - 照片同圖片
  - 通用文檔
  - 系統文件
- **管理功能**：
  - 文件預覽
  - 下載功能
  - 分類管理
  - 批量操作

#### 3. HistoryTree
**文件位置**：`app/admin/components/dashboard/widgets/HistoryTree.tsx`
- **功能**：歷史樹狀視圖
- **可視化**：樹狀結構顯示文件關係
- **功能特性**：
  - 時間軸顯示
  - 文件關聯關係
  - 處理流程追蹤
  - 狀態變化歷史

### 3D 上傳界面 Widgets

#### 4. UploadFilesWidget
**文件位置**：`app/admin/components/dashboard/widgets/UploadFilesWidget.tsx`
- **功能**：通用文件上傳（3D 文件夾）
- **UI 特色**：3D 文件夾視覺效果
- **支援格式**：所有常見文檔格式
- **上傳方式**：
  - 拖放上傳
  - 點擊選擇
  - 批量上傳
  - 文件夾上傳

#### 5. UploadOrdersWidget
**文件位置**：`app/admin/components/dashboard/widgets/UploadOrdersWidget.tsx`
- **功能**：訂單 PDF 上傳（含 AI 分析）
- **核心功能**：
  - PDF 文件上傳
  - OpenAI GPT-4 自動分析
  - 訂單信息提取
  - 數據自動入庫
- **分析內容**：
  - 訂單參考號 (order_ref)
  - 產品代碼 (product_code)
  - 數量 (quantity)
  - ACO 產品識別
- **後續處理**：
  - 郵件通知
  - 數據庫更新
  - 異常處理

#### 6. UploadProductSpecWidget
**文件位置**：`app/admin/components/dashboard/widgets/UploadProductSpecWidget.tsx`
- **功能**：產品規格文檔上傳
- **支援格式**：PDF、DOC、DOCX、XLS、XLSX
- **處理流程**：
  - 文件格式驗證
  - 規格信息提取
  - 產品資料庫更新
  - 版本控制管理

#### 7. UploadPhotoWidget
**文件位置**：`app/admin/components/dashboard/widgets/UploadPhotoWidget.tsx`
- **功能**：照片上傳管理
- **支援格式**：JPG、PNG、GIF、WEBP
- **功能特性**：
  - 圖片預覽
  - 壓縮優化
  - 批量上傳
  - 自動分類

### 輔助功能 Widgets

#### 8. Folder3D
**文件位置**：`app/admin/components/dashboard/widgets/Folder3D.tsx`
- **功能**：3D 文件夾組件
- **技術實現**：CSS 3D transforms
- **動畫效果**：
  - 打開/關閉動畫
  - 懸停效果
  - 拖放反饋
  - 狀態指示

#### 9. GoogleDriveUploadToast
**文件位置**：`app/admin/components/dashboard/widgets/GoogleDriveUploadToast.tsx`
- **功能**：上傳進度提示
- **設計風格**：Google Drive 風格
- **顯示信息**：
  - 上傳進度百分比
  - 文件名稱
  - 預估完成時間
  - 成功/失敗狀態

#### 10. OrderAnalysisResultDialog
**文件位置**：`app/admin/components/dashboard/widgets/OrderAnalysisResultDialog.tsx`
- **功能**：訂單分析結果對話框
- **顯示內容**：
  - AI 分析原始結果
  - 提取嘅訂單信息
  - 信心分數同不確定性
  - 人工確認選項
- **操作功能**：
  - 確認分析結果
  - 修正錯誤信息
  - 重新分析
  - 手動輸入

## 技術實現細節

### 3D 視覺效果實現
```css
/* 3D 文件夾效果 */
.folder-3d {
  transform-style: preserve-3d;
  perspective: 1000px;
  transition: transform 0.3s ease;
}

.folder-3d:hover {
  transform: rotateX(-10deg) rotateY(15deg);
}

.folder-face {
  position: absolute;
  backface-visibility: hidden;
}

.folder-front {
  transform: translateZ(20px);
}

.folder-back {
  transform: rotateY(180deg) translateZ(20px);
}

.folder-sides {
  transform: rotateY(90deg) translateZ(20px);
}
```

### AI 文檔分析管道
```typescript
// 訂單 PDF 分析流程
interface OrderAnalysisResult {
  order_ref: string;
  product_code: string;
  quantity: number;
  confidence: number;
  raw_text: string;
  is_aco: boolean;
}

const analyzeOrderPDF = async (file: File): Promise<OrderAnalysisResult> => {
  // 1. PDF 文字提取
  const pdfText = await extractTextFromPDF(file);
  
  // 2. OpenAI GPT-4 分析
  const analysisResult = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "你係專門分析訂單文檔嘅 AI 助手..."
      },
      {
        role: "user",
        content: pdfText
      }
    ]
  });
  
  // 3. 結果解析同驗證
  const parsedResult = parseAnalysisResult(analysisResult);
  
  // 4. ACO 產品識別
  const isACO = await checkIfACOProduct(parsedResult.product_code);
  
  return {
    ...parsedResult,
    is_aco: isACO,
    confidence: calculateConfidence(parsedResult)
  };
};
```

### Google Drive 整合
```typescript
// Google Drive 上傳整合
interface DriveUploadConfig {
  folderId: string;
  fileName: string;
  mimeType: string;
  file: File;
}

const uploadToGoogleDrive = async (config: DriveUploadConfig): Promise<string> => {
  const metadata = {
    name: config.fileName,
    parents: [config.folderId]
  };
  
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
  form.append('file', config.file);
  
  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    body: form
  });
  
  const result = await response.json();
  return result.id;
};
```

### 文件處理管道
- **上傳驗證**：文件大小、格式、安全性檢查
- **預處理**：文件壓縮、格式轉換、元數據提取
- **AI 分析**：智能內容分析同信息提取
- **數據入庫**：提取信息自動入庫
- **後處理**：通知發送、狀態更新、清理工作

## 用戶操作流程

### 1. 訂單 PDF 上傳流程
1. **選擇文件**：拖放或點擊選擇 PDF 文件
2. **上傳處理**：文件上傳到服務器
3. **AI 分析**：OpenAI 自動分析訂單內容
4. **結果確認**：查看同確認分析結果
5. **數據入庫**：確認後自動入庫
6. **通知發送**：相關人員收到郵件通知

### 2. 產品規格上傳流程
1. **文件選擇**：選擇產品規格文檔
2. **分類標記**：標記文檔類型同產品關聯
3. **上傳處理**：文件上傳同基本信息提取
4. **版本管理**：自動版本控制同歷史保存
5. **數據更新**：產品資料庫信息更新
6. **同步備份**：文件同步到雲端存儲

### 3. 通用文件管理流程
1. **文件上傳**：支援多種格式文件上傳
2. **自動分類**：根據文件類型自動分類
3. **預覽生成**：自動生成文件預覽
4. **權限設置**：設置文件訪問權限
5. **索引建立**：建立文件搜尋索引
6. **歷史記錄**：記錄所有操作歷史

## 與其他系統整合

### 1. 訂單管理系統
- **訂單創建**：AI 分析結果自動創建訂單
- **狀態同步**：訂單狀態變化即時同步
- **異常處理**：AI 分析異常自動通知
- **數據校驗**：訂單數據交叉校驗

### 2. 產品資料庫
- **規格更新**：產品規格文檔自動更新產品資料
- **版本控制**：產品資料變更歷史追蹤
- **關聯管理**：文檔同產品關聯關係管理
- **數據一致性**：確保文檔同資料庫數據一致

### 3. 郵件通知系統
- **自動通知**：重要事件自動發送郵件
- **模板管理**：不同類型通知使用不同模板
- **收件人管理**：根據業務規則確定收件人
- **發送狀態**：郵件發送狀態追蹤

### 4. 雲端存儲系統
- **多雲支援**：支援 Google Drive、OneDrive 等
- **自動同步**：文件自動同步到雲端
- **權限管理**：雲端文件權限管理
- **災備恢復**：雲端備份同災難恢復

## 高級功能

### 1. 智能文檔識別
```typescript
// 文檔類型智能識別
interface DocumentClassification {
  type: 'order' | 'spec' | 'invoice' | 'certificate' | 'photo' | 'other';
  confidence: number;
  metadata: Record<string, any>;
}

const classifyDocument = async (file: File): Promise<DocumentClassification> => {
  // 文件名分析
  const nameBasedType = analyzeFileName(file.name);
  
  // 內容分析（PDF、圖片 OCR）
  const contentBasedType = await analyzeFileContent(file);
  
  // 結合多種信號判斷
  const finalType = combineClassificationSignals(nameBasedType, contentBasedType);
  
  return {
    type: finalType.type,
    confidence: finalType.confidence,
    metadata: finalType.metadata
  };
};
```

### 2. 批量處理引擎
- **並行處理**：多文件並行上傳同處理
- **任務隊列**：大量文件排隊處理
- **進度追蹤**：批量操作進度可視化
- **錯誤恢復**：失敗任務自動重試

### 3. 文件去重
- **內容去重**：基於文件內容 hash 去重
- **相似度檢測**：檢測相似文件
- **版本識別**：識別文件版本關係
- **智能合併**：相似文件智能合併建議

### 4. 安全掃描
```typescript
// 文件安全掃描
interface SecurityScanResult {
  safe: boolean;
  threats: string[];
  risk_level: 'low' | 'medium' | 'high';
  scan_details: Record<string, any>;
}

const scanFileForSecurity = async (file: File): Promise<SecurityScanResult> => {
  const scanResults = await Promise.all([
    // 病毒掃描
    scanForViruses(file),
    // 惡意內容檢測
    scanForMaliciousContent(file),
    // 隱私數據檢測
    scanForPrivacyData(file)
  ]);
  
  return combineSecurityResults(scanResults);
};
```

## 性能優化

### 前端優化
- **文件分片上傳**：大文件分片上傳提高成功率
- **斷點續傳**：網絡中斷後自動續傳
- **預覽緩存**：文件預覽結果本地緩存
- **懶加載**：歷史記錄按需加載

### 後端優化
- **異步處理**：文件處理異步化
- **緩存策略**：處理結果同元數據緩存
- **負載均衡**：AI 分析服務負載均衡
- **存儲優化**：文件存儲分層同壓縮

### 網絡優化
- **CDN 加速**：文件下載 CDN 加速
- **傳輸壓縮**：文件傳輸自動壓縮
- **並行上傳**：多文件並行上傳
- **帶寬管理**：智能帶寬分配

## 監控同維護

### 上傳監控
- **成功率監控**：文件上傳成功率統計
- **性能監控**：上傳速度同耗時分析
- **錯誤分析**：常見錯誤類型統計
- **用戶行為**：用戶上傳習慣分析

### AI 分析監控
- **準確率追蹤**：AI 分析準確率統計
- **處理時間**：AI 分析平均處理時間
- **成本監控**：OpenAI API 使用成本
- **質量評估**：分析質量人工評估

### 存儲監控
- **容量使用**：存儲空間使用情況
- **文件分佈**：不同類型文件分佈
- **訪問模式**：文件訪問頻率分析
- **清理策略**：過期文件自動清理

## 未來發展規劃

### AI 能力提升
- **多模態分析**：文字、圖片、表格綜合分析
- **自然語言處理**：更好嘅語義理解
- **機器學習**：基於歷史數據訓練專用模型
- **實時分析**：文件上傳即時分析

### 用戶體驗優化
- **AR 預覽**：AR 技術預覽 3D 模型
- **語音控制**：語音命令控制文件操作
- **手勢識別**：手勢控制 3D 界面
- **個性化**：個人化文件管理界面

### 系統集成擴展
- **ERP 整合**：與 ERP 系統深度整合
- **區塊鏈**：文件完整性區塊鏈驗證
- **IoT 設備**：設備直接文件上傳
- **移動應用**：原生移動應用支援