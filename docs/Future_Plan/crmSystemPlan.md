# CRM 系統架構規劃

## 專案概述
基於現有倉庫管理系統架構，設計一個現代化嘅客戶關係管理（CRM）系統。重用現有嘅技術棧、架構模式同成熟組件，快速構建功能完善嘅 CRM 解決方案。

## 技術棧（沿用現有架構）

### 前端技術
- **框架**: Next.js 14 (App Router)
- **語言**: TypeScript (嚴格模式)
- **樣式**: Tailwind CSS + CSS-in-JS
- **UI 組件**: shadcn/ui, Radix UI
- **狀態管理**: Zustand + React Query
- **圖表**: Recharts
- **表單處理**: React Hook Form + Zod
- **文件處理**: @react-pdf/renderer

### 後端技術
- **數據庫**: Supabase (PostgreSQL)
- **實時功能**: Supabase Realtime
- **認證**: Supabase Auth
- **文件存儲**: Supabase Storage
- **API**: Next.js Route Handlers
- **緩存**: LRU Cache (TTL: 5分鐘)

## CRM 核心功能模組

### 1. 客戶管理
- **客戶檔案**: 基本資料、聯絡人、組織架構
- **客戶分類**: 行業、規模、價值等級
- **客戶時間線**: 所有互動歷史記錄
- **客戶標籤**: 自定義標籤系統
- **重複檢測**: 智能合併重複客戶

### 2. 聯絡人管理
- **聯絡人資料**: 職位、部門、聯絡方式
- **關係網絡**: 聯絡人之間嘅關係圖
- **通訊偏好**: 最佳聯絡時間同方式
- **社交媒體**: LinkedIn、WeChat 等整合
- **自動同步**: 郵件、電話記錄同步

### 3. 銷售管道管理
- **機會追蹤**: 從線索到成交嘅完整流程
- **管道可視化**: 拖拽式管道看板
- **階段管理**: 自定義銷售階段
- **預測分析**: AI 預測成交概率
- **報價管理**: 報價單生成同追蹤

### 4. 市場營銷自動化
- **營銷活動**: 多渠道活動管理
- **郵件營銷**: 模板、群發、追蹤
- **線索評分**: 自動評分同分配
- **A/B 測試**: 營銷效果測試
- **ROI 分析**: 投資回報率追蹤

### 5. 客戶服務管理
- **工單系統**: 問題追蹤同解決
- **知識庫**: 常見問題同解決方案
- **SLA 管理**: 服務級別協議
- **客戶滿意度**: NPS、CSAT 調查
- **實時聊天**: 在線客服系統

### 6. 報表與分析
- **儀表板**: 可定制 Widget 系統
- **銷售報表**: 業績、管道、預測
- **客戶分析**: 價值、流失、成長
- **活動分析**: 營銷效果追蹤
- **自定義報表**: 拖拽式報表生成器

### 7. 團隊協作
- **任務管理**: 任務分配同追蹤
- **日程管理**: 會議、拜訪安排
- **內部溝通**: 評論、提及、通知
- **文件共享**: 合同、提案管理
- **活動日誌**: 所有操作記錄

### 8. 整合與自動化
- **郵件整合**: Gmail、Outlook 同步
- **日曆同步**: Google Calendar、Outlook
- **電話系統**: VoIP 整合
- **會計系統**: 發票、付款同步
- **API 開放**: RESTful API、Webhook

## 資料庫設計

### 核心表結構

```sql
-- 客戶表
CREATE TABLE crm_customers (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50), -- 個人/公司
  industry VARCHAR(100),
  size VARCHAR(50),
  annual_revenue DECIMAL(15,2),
  website VARCHAR(255),
  description TEXT,
  tags JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 聯絡人表
CREATE TABLE crm_contacts (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES crm_customers(uuid),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  title VARCHAR(100),
  department VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  wechat VARCHAR(100),
  linkedin VARCHAR(255),
  is_primary BOOLEAN DEFAULT FALSE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 機會表
CREATE TABLE crm_opportunities (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_num VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES crm_customers(uuid),
  contact_id UUID REFERENCES crm_contacts(uuid),
  name VARCHAR(200) NOT NULL,
  stage VARCHAR(50) NOT NULL,
  amount DECIMAL(15,2),
  probability INTEGER DEFAULT 0,
  expected_close_date DATE,
  assigned_to UUID REFERENCES auth.users(id),
  source VARCHAR(100),
  campaign_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 活動記錄表
CREATE TABLE crm_activities (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL, -- email/call/meeting/task/note
  subject VARCHAR(500),
  description TEXT,
  customer_id UUID REFERENCES crm_customers(uuid),
  contact_id UUID REFERENCES crm_contacts(uuid),
  opportunity_id UUID REFERENCES crm_opportunities(uuid),
  user_id UUID REFERENCES auth.users(id),
  status VARCHAR(50),
  priority VARCHAR(20),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立索引優化查詢
CREATE INDEX idx_customers_assigned ON crm_customers(assigned_to);
CREATE INDEX idx_opportunities_stage ON crm_opportunities(stage);
CREATE INDEX idx_activities_type_date ON crm_activities(type, due_date);
```

## 技術實施方案

### 1. 項目結構
```
/app/
  /crm/
    /customers/         # 客戶管理
    /contacts/          # 聯絡人管理
    /opportunities/     # 機會管理
    /activities/        # 活動管理
    /campaigns/         # 營銷活動
    /reports/          # 報表分析
    /settings/         # CRM 設置
  /api/
    /crm/              # CRM API 路由

/components/
  /crm/                # CRM 專用組件
    /CustomerCard/
    /OpportunityPipeline/
    /ActivityTimeline/

/lib/
  /crm/                # CRM 業務邏輯
    /types.ts          # TypeScript 類型
    /utils.ts          # 工具函數
    /hooks.ts          # 自定義 Hooks
```

### 2. 重用現有組件

**認證系統**
- 直接使用 UnifiedAuth 類
- 調整域名驗證邏輯支持客戶登入
- 增加客戶門戶權限級別

**UI 組件**
- 100% 重用現有 shadcn/ui 組件
- 使用現有 Dialog、Card、Button 等
- 套用現有主題同樣式系統

**API 模式**
- 沿用 Route Handler 設計
- 保留緩存策略（LRU Cache）
- 統一錯誤處理同響應格式

**儀表板系統**
- 重用 Widget 系統架構
- 自定義 CRM 專用 Widget
- 保留拖拽同佈局功能

### 3. 新增 CRM 特定功能

**客戶時間線組件**
```typescript
interface TimelineEvent {
  type: 'email' | 'call' | 'meeting' | 'note'
  timestamp: string
  user: User
  content: string
  metadata?: any
}

const CustomerTimeline = ({ customerId }: Props) => {
  // 使用現有 Timeline 組件樣式
  // 實時更新活動記錄
}
```

**銷售管道看板**
```typescript
const OpportunityPipeline = () => {
  // 基於 react-beautiful-dnd
  // 拖拽更新機會階段
  // 實時同步更新
}
```

**智能搜索系統**
```typescript
const SmartSearch = () => {
  // 全文搜索客戶、聯絡人、機會
  // 支持模糊匹配同拼音搜索
  // 搜索結果即時預覽
}
```

### 4. 性能優化策略

**緩存策略**
- 客戶列表緩存（TTL: 5分鐘）
- 常用篩選條件緩存
- 搜索結果緩存

**樂觀更新**
- 拖拽機會階段即時反饋
- 活動狀態更新無需等待
- 客戶資料編輯實時顯示

**延遲加載**
- 客戶詳情按需加載
- 歷史記錄分頁加載
- 附件預覽延遲加載

**批量操作**
- 批量更新客戶標籤
- 批量分配銷售代表
- 批量導入導出功能

### 5. 安全性考慮

**數據權限**
- 基於團隊嘅數據隔離
- 銷售只能查看自己嘅客戶
- 管理員可查看所有數據

**敏感信息**
- 客戶財務數據加密
- 通訊記錄審計日誌
- PII 數據脫敏處理

**API 安全**
- Rate Limiting 防止濫用
- API Key 管理系統
- Webhook 簽名驗證

## 實施計劃

### 第一階段：基礎架構（2週）
1. 建立 CRM 模組結構
2. 設計資料庫表結構
3. 實現基礎 CRUD API
4. 整合認證系統

### 第二階段：核心功能（4週）
1. 客戶管理模組
2. 聯絡人管理模組
3. 基礎活動記錄
4. 簡單報表功能

### 第三階段：進階功能（4週）
1. 銷售管道管理
2. 營銷自動化基礎
3. 客戶服務工單
4. 進階報表分析

### 第四階段：優化整合（2週）
1. 性能優化
2. 第三方整合
3. 移動端適配
4. 用戶培訓

## 預期成效

1. **開發效率提升**
   - 重用 70% 現有代碼
   - 開發時間縮短 50%
   - 維護成本降低

2. **系統優勢**
   - 統一技術棧易於維護
   - 模組化設計便於擴展
   - 性能優化經驗可直接應用

3. **業務價值**
   - 銷售效率提升 30%
   - 客戶滿意度提高
   - 數據驅動決策支持

## 總結

基於現有倉庫管理系統嘅成熟架構，我哋可以快速構建一個功能完善、性能優秀嘅 CRM 系統。通過重用現有組件同模式，唔單止可以縮短開發週期，仲可以確保系統嘅穩定性同可維護性。建議優先實施核心功能，再逐步擴展進階功能，確保項目按時交付。