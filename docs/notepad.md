[PDF Analysis] Starting PDF analysis request
[PDF Analysis] FormData received: {
  fileName: '280813-Picking List.pdf',
  uploadedBy: '5997',
  fileSize: 13815,
  saveToStorage: true
}
[PDF Analysis] PDF loaded directly from FormData, size: 13815 bytes
[PDF Analysis] PDF magic bytes: %PDF-
[PDF Text Extract] Buffer size: 13815
[PDF Text Extract] Pages: 1
[PDF Text Extract] Text length: 1294
[PDF Text Extract] PDF info: {
  PDFFormatVersion: '1.4',
  IsAcroFormPresent: false,
  IsXFAPresent: false,
  Title: 'Pennine Manufacturing Picking List',
  Creator: 'PDFsharp 1.31.1789-g (www.pdfsharp.com)',
  Producer: 'PDFsharp 1.31.1789-g (www.pdfsharp.com)',
  CreationDate: "D:20250603172714+01'00'"
}
[PDF Text Extract] FULL EXTRACTED TEXT:
=====================================
Picking List
0000280813
Document Date:
03/06/2025
Entered By: Checked By:
Requested Delivery Date:
03/06/2025
00010645
Account No:DSPO-0360425Customers Ref:
Delivery Address:
Pallet Information
Invoice To:
Driver
Jake Shemmell
Number of Pallets
4 Poden Cottages
CMOStores.com Ltd
Burrington Business Pard
Pallet Spaces
Tel No:
Mickleton Road
Burrington Way
Weight
Evesham
PL5 3LX
WR11 7PS
Pack
Devon
Booked In
Honeybourne
Plymouth
Tel:
Site Tel No:
07775 600 294
invoices@cmostores.com
Email:
jakeandchess@gmail.com
Price Band ID:27284051
Priority:
Credit Position: Live (CPA Checked)Account Balance: 97,407.57   
Item Code
 Pack
Size
Description
Weight
(Kg)
Unit
Price
 Qty Req
Picked
by
Qty
 Picked
Qty
  Loaded
S3027D1EnviroCrate Connectors (Double)00.001
S3027S1EnviroCrate Connectors (Single)00.002
SA40-101Envirocrate Heavy 40-10043.002
Pallet Qty 6
Trans1Transport Charge for Delivery040.001
Parcel 4
Parcel 2
Parcel 1
Parcel 3
Height
Length
Height
Parcel 5
LengthHeight
Height
Length
Height
Length
Weight
Weight
Width
Weight
Weight
Width
Length
Width
Weight
Width
Width
Notes:Nett126.00
VAT25.20
TOTAL151.20
Total Number Of Pages:1
Requested Delivery Date:03/06/2025Actual Delivery Date:Driver:No Of Pallets:Amended On Sage:
Is A Balance Order Required:
0Total Weight Of Order (Kg):
=====================================
[PDF Text Extract] Contains key terms: {
  hasOrderRef: true,
  hasAccount: true,
  hasDelivery: true,
  hasProduct: true,
  hasNumbers: true
}
[PDF Analysis] Raw text extracted: 1292 chars
[PDF Preprocessing] Original text length: 1292 chars
[PDF Preprocessing] Account No found: "DSPO"
[PDF Preprocessing] Raw delivery address match:
[PDF Preprocessing] Extracted delivery address: ""
[PDF Preprocessing] Found address by postcode: "Burrington Way, Weight, Evesham, PL5 3LX"
[PDF Preprocessing] Found 8 potential product lines
[PDF Preprocessing] Product lines: [
  'PL5 3LX',
  'WR11 7PS',
  'S3027D1EnviroCrate Connectors (Double)00.001',
  'S3027S1EnviroCrate Connectors (Single)00.002',
  'SA40-101Envirocrate Heavy 40-10043.002'
]
[PDF Preprocessing] Processed text length: 329 chars
[PDF Preprocessing] Reduction: 74.5%
[PDF Preprocessing] Extracted Account No: DSPO
[PDF Preprocessing] Extracted Delivery Address: Burrington Way, Weight, Evesham, PL5 3LX
[PDF Preprocessing] FULL PROCESSED TEXT:
=====================================
Order Reference: 0000280813
Account No: DSPO
Delivery Address: Burrington Way, Weight, Evesham, PL5 3LX      

Product Table:
PL5 3LX
WR11 7PS
S3027D1EnviroCrate Connectors (Double)00.001
S3027S1EnviroCrate Connectors (Single)00.002
SA40-101Envirocrate Heavy 40-10043.002
Trans1Transport Charge for Delivery040.001
VAT25.20
TOTAL151.20
=====================================
[PDF Analysis] Preprocessed text: 329 chars (74.5% reduction)   
[PDF Analysis] Prompt loaded from file
[PDF Analysis] Sending to OpenAI
[PDF Analysis] FULL MESSAGE CONTENT SENT TO OPENAI:
=====================================
你是一個專業的 PDF 訂單資料抽取專家。

**重要：只返回有效的 JSON object，包含一個 "orders" 陣列，不要包含任何其他文字、解釋或 markdown。**

從以下 PDF 文字內容中提取訂單產品，每個產品是 orders 陣列中的一 個 object。

【重要提示】
傳入的文本是經過預處理的 PDF 內容，已經包含：
- Order Reference（訂單號）
- Account No（帳號）
- Delivery Address（送貨地址）
- Product Table（產品表格）

【資料庫結構】
欄位    類型    說明
order_ref       integer 訂單參考號（去除前置零）
product_code    text    產品代碼
product_desc    text    產品描述
product_qty     integer 產品數量（必須為正整數）
delivery_add    text    送貨地址
account_num     text    客戶帳號

【抽取規則（必須嚴格遵守）】
1. order_ref：從 "Order Reference:" 後提取數字，去除前置零（如 0000280813 → 280813）
2. account_num：從 "Account No:" 後提取，可能是純數字或包含字母 （如 BQ01, 472341）
   - 如果看到 "[EXTRACT_FROM_TEXT]"，請從文檔中搜尋 "Account No", "Customer No", "Acc No" 等字樣並提取
3. delivery_add：從 "Delivery Address:" 後提取完整地址，多行地址用逗號連接
   - 如果看到 "[EXTRACT_FROM_TEXT]"，請從文檔中搜尋送貨地址相關 內容並提取
4. 產品資料從 "Product Table:" 部分提取，每行是一個產品

【產品行格式識別】
常見格式：
1. 管道分隔格式：產品代碼 | Pack Size | 描述 | 重量 | 價格 | 數 量
2. 空格分隔格式：產品代碼 描述 重量 價格 數量
3. 壓縮格式：產品代碼+描述+數字（需要智能分割）

【特殊處理規則】
1. 如果產品代碼後緊跟數字（如 D10011），分離為：
   - D1001 = 產品代碼
   - 1 = Pack Size（忽略）

2. 特殊產品代碼：
   - "Trans" = Transport Charge（運輸費用）
   - "NS" = Non-stock item（非庫存品，描述在 "Each" 後）        

3. 數量識別優先級：
   - 如果有 | 分隔，取最後一個數字
   - 如果沒有分隔符，取該行最後一個獨立的正整數
   - 避免提取重量（有小數點）或價格

【範例】
輸入：
```
Order Reference: 280813
Account No: BQ01
Delivery Address: Sample Address

Product Table:
S3027D | 1 | EnviroCrate Connectors | 0 | 0.00 | 1
S3027S | 1 | Single Connectors | 0 | 0.00 | 2
```

輸出：
{
  "orders": [
    {
      "order_ref": 280813,
      "product_code": "S3027D",
      "product_desc": "EnviroCrate Connectors",
      "product_qty": 1,
      "delivery_add": "Sample Address",
      "account_num": "BQ01"
    },
    {
      "order_ref": 280813,
      "product_code": "S3027S",
      "product_desc": "Single Connectors",
      "product_qty": 2,
      "delivery_add": "Sample Address",
      "account_num": "BQ01"
    }
  ]
}

【重要提醒】
1. 每個產品必須包含完整的 delivery_add 和 account_num
2. 如果找不到 delivery_add 或 account_num，使用 "-" 作為預設值  
3. 產品數量必須是正整數，如果無法識別則使用 1
4. 只返回純 JSON array，不要包含任何其他文字

**DOCUMENT TEXT:**
Order Reference: 0000280813
Account No: DSPO
Delivery Address: Burrington Way, Weight, Evesham, PL5 3LX      

Product Table:
PL5 3LX
WR11 7PS
S3027D1EnviroCrate Connectors (Double)00.001
S3027S1EnviroCrate Connectors (Single)00.002
SA40-101Envirocrate Heavy 40-10043.002
Trans1Transport Charge for Delivery040.001
VAT25.20
TOTAL151.20
=====================================
[PDF Analysis] Trying GPT-4o model...
[PDF Analysis] OpenAI response: 999 chars, tokens: 1466
[PDF Analysis] FULL OPENAI RESPONSE:
=====================================
{
  "orders": [
    {
      "order_ref": 280813,
      "product_code": "S3027D",
      "product_desc": "EnviroCrate Connectors (Double)",        
      "product_qty": 1,
      "delivery_add": "Burrington Way, Weight, Evesham, PL5 3LX",
      "account_num": "DSPO"
    },
    {
      "order_ref": 280813,
      "product_code": "S3027S",
      "product_desc": "EnviroCrate Connectors (Single)",        
      "product_qty": 2,
      "delivery_add": "Burrington Way, Weight, Evesham, PL5 3LX",
      "account_num": "DSPO"
    },
    {
      "order_ref": 280813,
      "product_code": "SA40-10",
      "product_desc": "Envirocrate Heavy 40-100",
      "product_qty": 2,
      "delivery_add": "Burrington Way, Weight, Evesham, PL5 3LX",
      "account_num": "DSPO"
    },
    {
      "order_ref": 280813,
      "product_code": "Trans",
      "product_desc": "Transport Charge for Delivery",
      "product_qty": 1,
      "delivery_add": "Burrington Way, Weight, Evesham, PL5 3LX",
      "account_num": "DSPO"
    }
  ]
}
=====================================
[PDF Analysis] Cleaned content for parsing: {
  "orders": [
    {
      "order_ref": 280813,
      "product_code": "S3027D",
      "product_desc": "EnviroCrate Connectors (Double)",        
      "product_qty": 1,
      "delivery_add": "Burrington Way, Weight, Evesham, PL5 3LX",
      "account_num": "DSPO"
    },
    {
      "order_ref": 280813,

[PDF Analysis] Using new format: {orders: [...]}
[PDF Analysis] Parsed 4 records
[PDF Analysis] Record 0: {
  order_ref: 280813,
  product_code: 'S3027D',
  delivery_add: 'Burrington Way, Weight, Evesham, PL5 3LX',     
  account_num: 'DSPO'
}
[PDF Analysis] Record 1: {
  order_ref: 280813,
  product_code: 'S3027S',
  delivery_add: 'Burrington Way, Weight, Evesham, PL5 3LX',     
  account_num: 'DSPO'
}
[PDF Analysis] Record 2: {
  order_ref: 280813,
  product_code: 'SA40-10',
  delivery_add: 'Burrington Way, Weight, Evesham, PL5 3LX',     
  account_num: 'DSPO'
}
[PDF Analysis] Record 3: {
  order_ref: 280813,
  product_code: 'Trans',
  delivery_add: 'Burrington Way, Weight, Evesham, PL5 3LX',     
  account_num: 'DSPO'
}
[PDF Analysis] Raw orderData: [
  {
    order_ref: 280813,
    product_code: 'S3027D',
    product_desc: 'EnviroCrate Connectors (Double)',
    product_qty: 1,
    delivery_add: 'Burrington Way, Weight, Evesham, PL5 3LX',   
    account_num: 'DSPO'
  },
  {
    order_ref: 280813,
    product_code: 'S3027S',
    product_desc: 'EnviroCrate Connectors (Single)',
    product_qty: 2,
    delivery_add: 'Burrington Way, Weight, Evesham, PL5 3LX',   
    account_num: 'DSPO'
  },
  {
    order_ref: 280813,
    product_code: 'SA40-10',
    product_desc: 'Envirocrate Heavy 40-100',
    product_qty: 2,
    delivery_add: 'Burrington Way, Weight, Evesham, PL5 3LX',   
    account_num: 'DSPO'
  },
  {
    order_ref: 280813,
    product_code: 'Trans',
    product_desc: 'Transport Charge for Delivery',
    product_qty: 1,
    delivery_add: 'Burrington Way, Weight, Evesham, PL5 3LX',   
    account_num: 'DSPO'
  }
]
[PDF Analysis] Insert record: {
  order_ref: '280813',
  product_code: 'S3027D',
  product_desc: 'EnviroCrate Connectors (Double)',
  product_qty: '1',
  uploaded_by: '5997',
  token: 367,
  delivery_add: 'Burrington Way, Weight, Evesham, PL5 3LX',     
  account_num: 'DSPO'
}
[PDF Analysis] Insert record: {
  order_ref: '280813',
  product_code: 'S3027S',
  product_desc: 'EnviroCrate Connectors (Single)',
  product_qty: '2',
  uploaded_by: '5997',
  token: 367,
  delivery_add: 'Burrington Way, Weight, Evesham, PL5 3LX',     
  account_num: 'DSPO'
}
[PDF Analysis] Insert record: {
  order_ref: '280813',
  product_code: 'SA40-10',
  product_desc: 'Envirocrate Heavy 40-100',
  product_qty: '2',
  uploaded_by: '5997',
  token: 367,
  delivery_add: 'Burrington Way, Weight, Evesham, PL5 3LX',     
  account_num: 'DSPO'
}
[PDF Analysis] Insert record: {
  order_ref: '280813',
  product_code: 'Trans',
  product_desc: 'Transport Charge for Delivery',
  product_qty: '1',
  uploaded_by: '5997',
  token: 367,
  delivery_add: 'Burrington Way, Weight, Evesham, PL5 3LX',     
  account_num: 'DSPO'
}
[PDF Analysis] Successfully inserted 4 records, 367 tokens per record, total: 1466 tokens
 POST /api/analyze-order-pdf-new 200 in 7068ms
[Background Storage] Starting upload...
[Background Storage] Upload completed: https://bbmkuiplnzvpudszrend.supabase.co/storage/v1/object/public/documents/orderpdf/280813-Picking%20List.pdf
