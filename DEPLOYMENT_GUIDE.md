# NewPennine 部署指南

## 部署選項

### 推薦部署方案
- **前端**: Vercel (最佳 Next.js 支援)
- **數據庫**: Supabase Cloud
- **備選**: Railway, Netlify, AWS Amplify

## Vercel 部署步驟

### 1. 準備工作

#### 環境變量準備
確保你有以下環境變量：
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenAI (服務器端)
OPENAI_API_KEY=sk-xxx

# mem0ai (可選)
MEM0_API_KEY=your-mem0-key

# 其他配置
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. GitHub 部署（推薦）

#### 步驟 1: 推送代碼到 GitHub
```bash
git add .
git commit -m "準備部署"
git push origin main
```

#### 步驟 2: 連接 Vercel
1. 訪問 [vercel.com](https://vercel.com)
2. 點擊 "Import Project"
3. 選擇你嘅 GitHub 倉庫
4. 配置項目：
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `.next`

#### 步驟 3: 配置環境變量
在 Vercel 項目設置中添加所有環境變量

### 3. CLI 部署

#### 安裝 Vercel CLI
```bash
npm i -g vercel
```

#### 部署命令
```bash
# 首次部署
vercel

# 生產部署
vercel --prod
```

## 數據庫設置

### 1. Supabase 項目配置

#### 創建表結構
運行以下 SQL 腳本創建必要嘅表：

```sql
-- 棧板信息表
CREATE TABLE record_palletinfo (
    plt_num TEXT PRIMARY KEY,
    series TEXT UNIQUE,
    product_code TEXT NOT NULL,
    product_qty INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 庫存表
CREATE TABLE record_inventory (
    plt_num TEXT PRIMARY KEY REFERENCES record_palletinfo(plt_num),
    injection INTEGER DEFAULT 0,
    pipeline INTEGER DEFAULT 0,
    await INTEGER DEFAULT 0,
    fold INTEGER DEFAULT 0,
    bulk INTEGER DEFAULT 0,
    prebook INTEGER DEFAULT 0,
    backcarpark INTEGER DEFAULT 0,
    damage INTEGER DEFAULT 0,
    latest_update TIMESTAMPTZ DEFAULT NOW()
);

-- 歷史記錄表
CREATE TABLE record_history (
    id SERIAL PRIMARY KEY,
    time TIMESTAMPTZ DEFAULT NOW(),
    id TEXT,
    action TEXT NOT NULL,
    plt_num TEXT,
    loc TEXT,
    remark TEXT
);

-- 創建索引
CREATE INDEX idx_palletinfo_product ON record_palletinfo(product_code);
CREATE INDEX idx_palletinfo_created ON record_palletinfo(created_at);
CREATE INDEX idx_inventory_plt ON record_inventory(plt_num);
CREATE INDEX idx_history_plt ON record_history(plt_num);
CREATE INDEX idx_history_time ON record_history(time);
```

### 2. RLS (Row Level Security) 設置

```sql
-- 啟用 RLS
ALTER TABLE record_palletinfo ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_history ENABLE ROW LEVEL SECURITY;

-- 創建政策
CREATE POLICY "允許認證用戶讀取" ON record_palletinfo
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "允許認證用戶插入" ON record_palletinfo
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "允許認證用戶更新" ON record_palletinfo
    FOR UPDATE TO authenticated USING (true);
```

### 3. 存儲桶設置

```sql
-- 創建存儲桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('labels', 'labels', true);

-- 設置存儲政策
CREATE POLICY "公開讀取標籤" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'labels');

CREATE POLICY "認證用戶上傳" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'labels');
```

## 性能優化

### 1. Next.js 優化

#### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['your-supabase-url.supabase.co'],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizeCss: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig
```

### 2. 緩存策略

#### Vercel Edge Config
```json
{
  "functions": {
    "app/api/admin/stats/route.ts": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=60, stale-while-revalidate"
        }
      ]
    }
  ]
}
```

### 3. 數據庫優化

```sql
-- 分析查詢性能
EXPLAIN ANALYZE
SELECT * FROM record_palletinfo
WHERE product_code = 'PT001'
ORDER BY created_at DESC
LIMIT 100;

-- 創建複合索引
CREATE INDEX idx_palletinfo_product_created 
ON record_palletinfo(product_code, created_at DESC);

-- 定期維護
VACUUM ANALYZE record_palletinfo;
VACUUM ANALYZE record_inventory;
```

## 監控設置

### 1. Vercel Analytics
在 Vercel 控制台啟用：
- Web Analytics
- Speed Insights
- 錯誤追蹤

### 2. Supabase 監控
- 數據庫性能監控
- API 使用統計
- 實時連接監控

### 3. 自定義監控

#### 添加監控代碼
```typescript
// lib/monitoring.ts
export function trackEvent(eventName: string, properties?: any) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, properties);
  }
}

export function trackError(error: Error, context?: any) {
  console.error('Application Error:', error, context);
  // 發送到錯誤追蹤服務
}
```

## 安全配置

### 1. 環境變量安全
- 永遠不要提交 `.env` 文件
- 使用 Vercel 環境變量管理
- 區分開發/生產環境

### 2. CORS 設置
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // CORS headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  
  return response
}
```

### 3. API 安全
```typescript
// 驗證請求來源
export async function validateRequest(request: Request) {
  const origin = request.headers.get('origin')
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000'
  ]
  
  if (!origin || !allowedOrigins.includes(origin)) {
    throw new Error('Unauthorized origin')
  }
}
```

## 部署檢查清單

### 部署前檢查
- [ ] 所有測試通過
- [ ] 構建無錯誤
- [ ] 環境變量配置完整
- [ ] 數據庫遷移完成
- [ ] SSL 證書就緒

### 部署後驗證
- [ ] 網站可訪問
- [ ] 所有功能正常
- [ ] 數據庫連接正常
- [ ] 監控正常運行
- [ ] 錯誤日誌檢查

## 回滾策略

### Vercel 回滾
```bash
# 查看部署歷史
vercel ls

# 回滾到特定部署
vercel rollback [deployment-url]
```

### 數據庫回滾
保留數據庫備份：
```sql
-- 創建備份
pg_dump -h db.supabase.co -U postgres -d postgres > backup.sql

-- 恢復備份
psql -h db.supabase.co -U postgres -d postgres < backup.sql
```

## 故障排除

### 常見問題

#### 1. 構建失敗
- 檢查 Node.js 版本
- 清理緩存: `rm -rf .next node_modules`
- 重新安裝依賴: `npm install`

#### 2. 環境變量未生效
- 確認變量名稱正確
- 重新部署項目
- 檢查變量作用域

#### 3. 數據庫連接失敗
- 驗證連接字符串
- 檢查網絡設置
- 確認 SSL 模式

## 維護計劃

### 定期任務
1. **每日**: 檢查錯誤日誌
2. **每週**: 分析性能報告
3. **每月**: 更新依賴包
4. **每季**: 安全審計

### 更新流程
```bash
# 1. 創建更新分支
git checkout -b update/dependencies

# 2. 更新依賴
npm update
npm audit fix

# 3. 測試
npm test
npm run build

# 4. 部署到預覽環境
vercel

# 5. 驗證後合併
git checkout main
git merge update/dependencies
git push

# 6. 部署到生產
vercel --prod
```

## 擴展考慮

### 水平擴展
- Vercel 自動處理擴展
- 數據庫使用連接池
- 實施緩存策略

### 垂直擴展
- 升級 Supabase 計劃
- 增加數據庫資源
- 優化查詢性能

---

*部署遇到問題？聯繫 devops@newpennine.com*