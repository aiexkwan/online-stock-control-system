import { AssistantCreateParams } from 'openai/resources/beta/assistants';

/**
 * Model configuration for OpenAI Assistant
 * 固定使用 gpt-4o 以確保穩定性
 * Note: gpt-4o-mini 有已知問題，暫時停用
 */
export const MODEL_CONFIG = {
  // 固定使用 gpt-4o（穩定可靠）
  // 使用 code_interpreter 避免 vector store 處理問題
  selectedModel: 'gpt-4o' as const,
  
  // Model-specific configurations
  models: {
    'gpt-4o': {
      useFileSearch: false,  // 改用 code_interpreter 避免 vector store 無限等待
      fallbackToSimple: false,
    },
  },
};

/**
 * Get the appropriate tools configuration
 * 固定使用 file_search（因為只用 gpt-4o）
 */
function getToolsConfig() {
  // gpt-4o 使用 file_search tool，經測試穩定可靠
  return [{ type: 'file_search' as const }];
}

/**
 * OpenAI Assistant 配置 - Pennine Order PDF 分析器
 * 使用 gpt-4o 和 code_interpreter 避免 vector store 問題
 */
export const ORDER_ANALYZER_CONFIG: AssistantCreateParams = {
  name: 'Pennine Order PDF Analyzer Enhanced',
  description: 'Expert at analyzing order PDFs with complete data extraction',
  model: 'gpt-4o',  // 固定使用 gpt-4o
  tools: [{ type: 'code_interpreter' }],  // 改用 code_interpreter 避免 vector store 問題

  instructions: `你是一個專業的 PDF 訂單資料抽取專家。

**重要：只返回有效的 JSON object，包含一個 "orders" 陣列，不要包含任何其他文字、解釋或 markdown。**

從以下 PDF 文字內容中提取訂單產品，每個產品是 orders 陣列中的一個 object。

【重要提示】
傳入的文本是經過預處理的 PDF 內容，已經包含：
- Order Reference（訂單號）
- Account No（帳號）- 可能標記為 [EXTRACT_FROM_TEXT]
- Delivery Address（送貨地址）- 可能標記為 [EXTRACT_FROM_TEXT]
- Product Table（產品表格）

【資料庫結構】
欄位	類型	說明
order_ref	integer	訂單參考號（去除前置零）
product_code	text	產品代碼
product_desc	text	產品描述
product_qty	integer	產品數量（必須為正整數）
delivery_add	text	送貨地址
account_num	text	客戶帳號

【抽取規則（必須嚴格遵守）】
1. order_ref：從 "Order Reference:" 後提取數字，去除前置零（如 0000280813 → 280813）

2. account_num：從 "Account No:" 後提取
   - **重要**：如果 "Account No:" 後面的值看起來像客戶參考號（如 "PO7491Customers Ref:"），這不是帳號
   - 真正的帳號通常是：
     a) 獨立的 5-8 位數字（如 "00010824"）
     b) 出現在訂單號附近或文檔前半部分
     c) 可能在 "Account No:" 前面單獨一行
   - 如果看到 "[EXTRACT_FROM_TEXT]"，請在整個文檔中搜尋：
     a) 尋找獨立的數字行（通常是 5-8 位）
     b) 檢查 "Account No:" 標籤前後的數字
     c) 常見格式：純數字（00010824, 96154）、字母數字混合（BQ01, WP064386）
     d) 移除 "Customers" 等後綴詞
   - 注意：如果 "Account No:" 後面是 "POxxxx" 格式，這是採購訂單號，不是帳號

3. delivery_add：從 "Delivery Address:" 後提取
   - 如果看到 "[EXTRACT_FROM_TEXT]"，請在文檔開頭部分搜尋地址：
     a) 地址通常在訂單號之後、產品表格之前
     b) 包含城市名、郵政編碼（如 "Plymouth", "PL5 3LX"）
     c) 可能分佈在多行，需要合併
     d) 排除電話號碼、Email、網站等非地址信息
   - 例如：尋找類似 "Evesham, WR11 7PS" 或 "Plymouth, Devon, PL5 3LX" 的模式

4. 產品資料從 "Product Table:" 部分提取，每行代表一個產品

【產品行識別規則】
有效的產品行必須符合以下特徵：
1. 以產品代碼開頭（字母+數字組合，如 S3027D, MHL101, MHALFWG15）
2. 包含產品描述（通常是英文詞組）
3. 行末有數量（通常是整數）

無效的產品行（需要過濾）：
- 純地址行（如 "PL5 3LX", "NSW 2750"）
- 電話號碼（如 "07775 600 294"）
- Email 地址
- 標題行（如 "Item Code", "Pack Size"）
- 註釋行（如 "Pallet Qty", "Fibre Associates Have A Maximum Pallet"）

【產品行格式解析】
常見格式：
1. 標準格式：產品代碼 | Pack Size | 描述 | 重量 | 價格 | 數量
   例：S3027D|1|EnviroCrate Connectors (Double)|0|0.00|1

2. 壓縮格式：產品代碼+Pack Size+描述+數字
   例：MHL101M12 100mm Stainless Steel Through Bolts23.2016
   解析為：MHL101（產品代碼）, "M12 100mm Stainless Steel Through Bolts"（描述）, 16（數量）

3. Each 格式：產品代碼+Each+描述+數字
   例：MHL60YEachYellow PBT Ladder 541-600cm + stays/nuts/bolts32308.001
   解析為：MHL60Y（產品代碼）, "Yellow PBT Ladder 541-600cm + stays/nuts/bolts"（描述）, 1（數量）

【特殊產品代碼 - 需要排除的項目】
以下項目不是產品，請勿提取：
- Trans = Transport Charge for Delivery（送貨運輸費）
- TransDPD = Transport Charge for DPD（DPD 運輸費）
- TransC = Customer Collection（客戶自取，無運輸費）
- 任何包含 "Transport Charge" 的項目

【其他特殊代碼】
- NS = Non-stock item（非庫存品）- 這是產品，需要提取

【數量提取規則】
1. 優先提取行末的整數作為數量
2. 如果有多個數字，選擇最後一個獨立的整數
3. 忽略小數（通常是重量或價格）
4. 如果無法識別，預設為 1

【重要提醒】
1. 每個產品必須包含完整的 delivery_add 和 account_num
2. 如果找不到有效的地址或帳號，使用 "-" 作為預設值
3. 產品數量必須是正整數
4. 只返回純 JSON，不要包含任何其他文字
5. 仔細區分產品行和非產品行（地址、電話等）
6. **絕對不要包含任何運輸費用項目**（Trans, TransC, TransDPD 或任何包含 "Transport" 的項目）
7. **注意 Account Number 可能在獨立行**，特別是當 "Account No:" 後面跟著 PO 號碼時`,
};

/**
 * 系統提示詞 - 用於訊息發送
 */
export const SYSTEM_PROMPT = `請分析這份訂單 PDF 並提取訂單資訊。只返回 JSON 格式的結果。`;

/**
 * Assistant 重試配置 - 優化版本
 */
export const ASSISTANT_RETRY_CONFIG = {
  maxAttempts: 200, // 增加嘗試次數以配合更短的間隔
  pollInterval: 300, // 縮短輪詢間隔到 300ms（比原本快 3.3 倍）
  timeout: 120000, // 保持 2 分鐘超時
  maxCompletionTokens: 4096, // Max tokens for responses
  
  // 動態輪詢配置
  dynamicPolling: {
    minInterval: 200,    // 最小間隔 200ms
    maxInterval: 1500,   // 最大間隔 1.5 秒
    backoffMultiplier: 1.2, // 退避乘數
  }
};

/**
 * Vector Store 配置
 */
export const VECTOR_STORE_CONFIG = {
  // Timeout for vector store file processing
  processingTimeout: {
    'gpt-4o-mini': 15000, // 15 seconds for gpt-4o-mini (more lenient)
    'gpt-4o': 60000, // 60 seconds for gpt-4o
    'gpt-4': 60000, // 60 seconds for gpt-4
    default: 60000, // Default 60 seconds
  },
  // Whether to skip vector store on timeout for specific models
  skipOnTimeout: {
    'gpt-4o-mini': true, // Skip for gpt-4o-mini to prevent blocking
    'gpt-4o': false,
    'gpt-4': false,
    default: false,
  },
  // Polling interval for status checks
  pollInterval: 1000, // 1 second
};

/**
 * 文件上傳配置
 */
export const FILE_UPLOAD_CONFIG = {
  maxFileSize: 20 * 1024 * 1024, // 20MB
  allowedTypes: ['application/pdf'],
  purpose: 'assistants' as const,
};
