# API 錯誤問題分析與解決方案

## 🔍 **問題描述**

### 原始問題
- `/PRINT-LABEL` 和 `/PRINT-GRNLABEL` 頁面列印時出現 API ERROR
- `/void-pallet` 的重印 label 功能同樣失敗
- 控制台顯示多個 GoTrueClient 實例警告和 401 Unauthorized 錯誤
- `/stock-transfer`, `/productUpdate`, `/view-history` 正常運作

### 錯誤症狀
- **客戶端錯誤**: 多個 GoTrueClient 實例衝突
- **API 錯誤**: 401 Unauthorized from Supabase
- **日誌顯示**: "Invalid API key" 和認證失敗

## 🔍 **問題根本原因分析**

### 階段 1: 初步分析 - 混合客戶端使用
最初識別的問題：
- **混合使用不同的 Supabase 客戶端**：
  - 客戶端 Supabase（anon key）用於生成棧板號碼
  - 服務端 Supabase（service role key）用於數據庫操作
  - 這種混合使用導致連接狀態衝突和權限問題

### 階段 2: 深度診斷 - 環境變數問題
進一步調查發現：
- **客戶端組件無法訪問服務端環境變數**
- `SUPABASE_SERVICE_ROLE_KEY` 在客戶端環境中返回 `undefined`
- 導致 "Invalid API key" 錯誤

### 階段 3: 最終發現 - 硬編碼憑據問題
**真正的根本原因**：
1. **硬編碼的備用憑據**：多個文件中存在硬編碼的 Supabase 憑據
2. **vercel.json 配置錯誤**：包含硬編碼的環境變數，覆蓋了 Vercel 控制台設置
3. **錯誤的憑據**：硬編碼的憑據權限不足，導致 401 錯誤

## 🔧 **解決方案**

### 修復 1: 架構重構 (初步修復)

#### 1.1 創建服務端 Actions
創建專門的服務端 actions 處理棧板號碼生成：

**app/actions/qcActions.ts**:
```typescript
// 移除模塊級別的客戶端創建
// 改為函數級別創建服務端客戶端
function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'public' },
    global: {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    }
  });
}

export async function generatePalletNumbersAndSeries(count: number) {
  // 服務端棧板號碼生成邏輯
}
```

**app/actions/grnActions.ts**:
```typescript
export async function generateGrnPalletNumbersAndSeries(count: number) {
  // GRN 棧板號碼生成邏輯
}
```

#### 1.2 修改客戶端組件
**app/components/qc-label-form/hooks/useQcLabelBusiness.tsx**:
- 改為使用客戶端 Supabase（anon key）進行查詢
- 棧板號碼生成改為調用服務端 action

**app/print-grnlabel/components/GrnLabelForm.tsx**:
- 同樣分離職責：客戶端負責 UI 交互，服務端負責數據生成

#### 1.3 修復其他 API 路由
- `app/api/auto-reprint-label/route.ts`
- `app/void-pallet/hooks/useVoidPallet.ts`
- `app/void-pallet/actions.ts`

### 修復 2: 移除硬編碼憑據 (關鍵修復)

#### 2.1 移除文件中的硬編碼憑據
修復的文件：
- `app/actions/qcActions.ts` - 移除硬編碼 service_role key
- `app/actions/grnActions.ts` - 移除硬編碼 service_role key  
- `app/api/auto-reprint-label/route.ts` - 移除硬編碼憑據
- `app/api/test-pallet-generation/route.ts` - 移除硬編碼憑據
- `app/api/upload-pdf/route.ts` - 移除硬編碼憑據
- `app/components/qc-label-form/hooks/useQcLabelBusiness.tsx` - 移除硬編碼 anon key

#### 2.2 修復 vercel.json 配置問題 (最關鍵)
**原始問題**:
```json
{
  "env": {
    "SUPABASE_SERVICE_ROLE_KEY": "硬編碼的錯誤憑據",
    // 其他硬編碼環境變數
  }
}
```

**修復後**:
```json
{
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  },
  "framework": "nextjs"
}
```

### 修復 3: 環境變數驗證
創建診斷工具確保正確的環境變數：

**app/api/debug-env/route.ts**:
```typescript
export async function GET() {
  const envCheck = {
    SUPABASE_SERVICE_ROLE_KEY: {
      exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length,
      first10: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10),
      startsWithEyJ: process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('eyJ')
    }
  };
  return NextResponse.json({ environment: envCheck });
}
```

## ✅ **解決結果**

### 測試驗證
1. **構建成功**：無 TypeScript 錯誤
2. **環境變數檢查通過**：所有必要變數正確設置
3. **Supabase 連接測試成功**：權限正常
4. **棧板號碼生成測試成功**：`290525/14` 和 `290525-YKR2DC`
5. **生產環境驗證**：API 測試返回 `"success": true`

### 最終確認
- ✅ **列印功能恢復正常**
- ✅ **401 錯誤已解決**
- ✅ **環境變數正確配置**
- ✅ **無硬編碼憑據依賴**

## 🏗️ **修復後的架構**

### 職責分離
```
客戶端 (anon key)     服務端 (service_role key)
├─ UI 交互           ├─ 棧板號碼生成
├─ 數據查詢          ├─ 數據庫寫入操作  
├─ 表單驗證          ├─ RLS 繞過操作
└─ 用戶體驗          └─ 批量事務處理
```

### 環境變數管理
- **Vercel 控制台**：唯一的環境變數來源
- **無硬編碼**：所有憑據從環境變數讀取
- **錯誤處理**：環境變數缺失時明確拋出錯誤

## 📚 **經驗教訓**

### 關鍵發現
1. **硬編碼是萬惡之源**：即使有環境變數，硬編碼仍會被優先使用
2. **vercel.json 配置**：會覆蓋控制台設置，需要特別注意
3. **權限分離重要性**：客戶端和服務端應使用不同權限的憑據
4. **診斷工具價值**：創建診斷 API 對排查生產問題非常有用

### 最佳實踐
1. **永遠不要硬編碼憑據**
2. **使用環境變數檢查機制**
3. **分離客戶端和服務端操作**
4. **創建測試和診斷工具**
5. **清理不必要的日誌減少成本**

## 🎯 **性能優化**

### Console 日誌清理
為減少生產環境開支，已注釋掉非必要的 console.log：
- 保留錯誤日誌 (`console.error`)
- 注釋調試日誌 (`// console.log`)
- 保留關鍵的異常處理日誌

### 文件修改列表
```
app/actions/qcActions.ts              ✅ 已清理日誌
app/actions/grnActions.ts             ✅ 已清理日誌  
app/api/auto-reprint-label/route.ts   ✅ 已清理日誌
app/api/test-pallet-generation/route.ts ✅ 已清理日誌
app/api/upload-pdf/route.ts           ✅ 已清理日誌
vercel.json                           ✅ 移除硬編碼環境變數
```

---

**最後更新**: 2024年12月29日  
**狀態**: ✅ **已完全解決** - 生產環境列印功能正常運作
