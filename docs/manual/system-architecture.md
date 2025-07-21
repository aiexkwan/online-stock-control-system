# NewPennine WMS 系統架構文檔

**版本**: v2.0.7  
**日期**: 2025-07-17  
**維護者**: Architecture Team  
**狀態**: 生產就緒

## 概述

NewPennine 倉庫管理系統（WMS）是一個現代化的企業級倉庫管理解決方案，採用微服務架構設計，支援完整的供應鏈管理流程。系統基於 Next.js 14、TypeScript、Supabase 構建，提供高可用性、可擴展性和優秀的用戶體驗。

## 系統架構概覽

### 1. 整體架構圖

```
                    ┌─────────────────────────────────────┐
                    │           用戶界面層                │
                    │  Next.js 14 + React 18 + TypeScript │
                    └─────────────────────────────────────┘
                                       │
                    ┌─────────────────────────────────────┐
                    │         API 閘道層                  │
                    │    Next.js API Routes + Middleware  │
                    └─────────────────────────────────────┘
                                       │
                    ┌─────────────────────────────────────┐
                    │         應用服務層                  │
                    │  Server Actions + Business Logic    │
                    └─────────────────────────────────────┘
                                       │
                    ┌─────────────────────────────────────┐
                    │         數據存取層                  │
                    │     Supabase Client + RPC          │
                    └─────────────────────────────────────┘
                                       │
                    ┌─────────────────────────────────────┐
                    │         數據存儲層                  │
                    │  PostgreSQL + Redis + File Storage  │
                    └─────────────────────────────────────┘
```

### 2. 核心組件架構

```
┌─────────────────────────────────────────────────────────────────────┐
│                          前端應用層                                  │
├─────────────────────────────────────────────────────────────────────┤
│  Admin Dashboard  │  QC System  │  Order Management  │  Inventory   │
│  管理面板         │  品質控制   │  訂單管理          │  庫存管理     │
└─────────────────────────────────────────────────────────────────────┘
                                  │
┌─────────────────────────────────────────────────────────────────────┐
│                          Widget 系統                                │
├─────────────────────────────────────────────────────────────────────┤
│  Widget Registry  │  Lazy Loading  │  Performance Monitor  │ Cache   │
│  組件註冊         │  懶加載       │  性能監控            │  緩存     │
└─────────────────────────────────────────────────────────────────────┘
                                  │
┌─────────────────────────────────────────────────────────────────────┐
│                          業務邏輯層                                  │
├─────────────────────────────────────────────────────────────────────┤
│  Pallet Management │  Stock Transfer │  Order Processing │  Reports  │
│  棧板管理          │  庫存轉移      │  訂單處理         │  報表     │
└─────────────────────────────────────────────────────────────────────┘
                                  │
┌─────────────────────────────────────────────────────────────────────┐
│                          數據服務層                                  │
├─────────────────────────────────────────────────────────────────────┤
│  Database RPC  │  Real-time Sync  │  File Upload  │  Authentication  │
│  數據庫程序    │  實時同步       │  文件上傳     │  認證管理        │
└─────────────────────────────────────────────────────────────────────┘
```

## 技術棧詳解

### 1. 前端技術棧

#### 核心框架
- **Next.js 14**:
  - App Router 架構
  - Server-Side Rendering (SSR)
  - Static Site Generation (SSG)
  - 內建性能優化

- **React 18**:
  - 並發功能
  - 自動批處理
  - Suspense 和 Streaming
  - 嚴格模式

- **TypeScript**:
  - 嚴格類型檢查
  - 介面定義
  - 代碼智能提示
  - 編譯時錯誤檢測

#### UI 和樣式
- **Tailwind CSS**:
  - 原子化 CSS
  - 響應式設計
  - 深色模式支援
  - 自定義主題

- **shadcn/ui**:
  - 現代化組件庫
  - 高度可定制
  - 無障礙設計
  - TypeScript 支援

- **Framer Motion**:
  - 動畫和過渡效果
  - 手勢處理
  - 性能優化
  - 聲明式 API

#### 狀態管理
- **React Hooks**:
  - useState, useEffect
  - useContext, useReducer
  - 自定義 Hooks
  - 狀態邏輯復用

- **Zustand**:
  - 輕量級狀態管理
  - 中間件支援
  - TypeScript 友好
  - 持久化存儲

### 2. 後端技術棧

#### 數據庫
- **Supabase PostgreSQL**:
  - 企業級關係型數據庫
  - 實時訂閱功能
  - 行級安全 (RLS)
  - 自動備份

- **Redis**:
  - 高性能緩存
  - 會話存儲
  - 分佈式鎖
  - 消息隊列

#### 認證和授權
- **Supabase Auth**:
  - JWT 令牌認證
  - 多種登錄方式
  - 角色權限管理
  - 自動過期處理

#### API 層
- **Next.js API Routes**:
  - RESTful API 設計
  - 中間件支援
  - 請求驗證
  - 錯誤處理

- **RPC 函數**:
  - 數據庫存儲過程
  - 複雜業務邏輯
  - 事務處理
  - 性能優化

### 3. 監控和運維

#### 健康檢查
- **多級健康檢查**:
  - `/api/v1/health`: 基本檢查
  - `/api/v2/health`: 進階檢查
  - `/api/v1/metrics`: 性能指標
  - `/api/v1/cache/metrics`: 緩存指標

#### 告警系統
- **完整告警架構**:
  - 規則引擎
  - 多渠道通知
  - 自動升級
  - 歷史記錄

#### 日誌管理
- **結構化日誌**:
  - 分級日誌記錄
  - 錯誤追蹤
  - 性能監控
  - 審計跟踪

## 數據模型設計

### 1. 核心實體關係圖

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  data_code      │    │  data_supplier  │    │  data_id        │
│  (產品目錄)     │    │  (供應商)       │    │  (用戶管理)     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│  code PK        │    │  supplier_id PK │    │  user_id PK     │
│  description    │    │  name           │    │  username       │
│  category       │    │  contact_info   │    │  role           │
│  specifications │    │  address        │    │  permissions    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ record_palletinfo│    │  record_grn     │    │  record_history │
│  (棧板信息)     │    │  (收貨記錄)     │    │  (歷史記錄)     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│  plt_num PK     │    │  grn_id PK      │    │  history_id PK  │
│  series         │    │  supplier_id FK │    │  plt_num FK     │
│  product_code FK│    │  product_code FK│    │  user_id FK     │
│  product_qty    │    │  received_qty   │    │  action         │
│  created_at     │    │  received_date  │    │  timestamp      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                                             │
         │                                             │
         ▼                                             ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ record_inventory│    │  record_aco     │    │  record_transfer│
│  (庫存記錄)     │    │  (ACO訂單)      │    │  (轉移記錄)     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│  plt_num PK     │    │  aco_id PK      │    │  transfer_id PK │
│  injection      │    │  order_ref      │    │  plt_num FK     │
│  pipeline       │    │  product_code FK│    │  from_location  │
│  await          │    │  order_qty      │    │  to_location    │
│  fold           │    │  loaded_qty     │    │  qty_transferred│
│  bulk           │    │  created_date   │    │  transfer_time  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2. 主要表格結構

#### 棧板信息表 (record_palletinfo)
```sql
CREATE TABLE record_palletinfo (
    plt_num VARCHAR(50) PRIMARY KEY,
    series VARCHAR(50) NOT NULL,
    product_code VARCHAR(50) REFERENCES data_code(code),
    product_qty INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES data_id(user_id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 庫存記錄表 (record_inventory)
```sql
CREATE TABLE record_inventory (
    plt_num VARCHAR(50) PRIMARY KEY REFERENCES record_palletinfo(plt_num),
    injection INTEGER DEFAULT 0,
    pipeline INTEGER DEFAULT 0,
    await INTEGER DEFAULT 0,
    fold INTEGER DEFAULT 0,
    bulk INTEGER DEFAULT 0,
    prebook INTEGER DEFAULT 0,
    backcarpark INTEGER DEFAULT 0,
    damage INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 歷史記錄表 (record_history)
```sql
CREATE TABLE record_history (
    id SERIAL PRIMARY KEY,
    plt_num VARCHAR(50) REFERENCES record_palletinfo(plt_num),
    user_id INTEGER REFERENCES data_id(user_id),
    action VARCHAR(100) NOT NULL,
    details JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);
```

### 3. 視圖和索引

#### 庫存總覽視圖
```sql
CREATE VIEW stock_level AS
SELECT
    p.product_code,
    c.description,
    SUM(i.injection + i.pipeline + i.await + i.fold + i.bulk) as total_qty,
    SUM(i.injection) as injection_qty,
    SUM(i.pipeline) as pipeline_qty,
    SUM(i.await) as await_qty,
    SUM(i.fold) as fold_qty,
    SUM(i.bulk) as bulk_qty,
    COUNT(*) as pallet_count
FROM record_palletinfo p
JOIN record_inventory i ON p.plt_num = i.plt_num
JOIN data_code c ON p.product_code = c.code
GROUP BY p.product_code, c.description;
```

#### 性能索引
```sql
-- 棧板查詢優化
CREATE INDEX idx_palletinfo_product_code ON record_palletinfo(product_code);
CREATE INDEX idx_palletinfo_created_at ON record_palletinfo(created_at);
CREATE INDEX idx_palletinfo_series ON record_palletinfo(series);

-- 歷史記錄查詢優化
CREATE INDEX idx_history_plt_num ON record_history(plt_num);
CREATE INDEX idx_history_timestamp ON record_history(timestamp);
CREATE INDEX idx_history_user_id ON record_history(user_id);

-- 庫存查詢優化
CREATE INDEX idx_inventory_totals ON record_inventory((injection + pipeline + await + fold + bulk));
```

## 系統安全架構

### 1. 認證和授權

#### 認證流程
```
用戶登錄 → Supabase Auth → JWT 令牌 → 中間件驗證 → 路由保護
```

#### 權限模型
```typescript
interface UserPermissions {
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  permissions: {
    pallets: ['read', 'write', 'delete'];
    inventory: ['read', 'write'];
    reports: ['read', 'export'];
    system: ['admin'];
  };
}
```

### 2. 數據安全

#### 行級安全 (RLS)
```sql
-- 棧板數據安全策略
CREATE POLICY "Users can only access their department's pallets"
ON record_palletinfo
USING (
  auth.jwt() ->> 'department' = department OR
  auth.jwt() ->> 'role' = 'admin'
);

-- 歷史記錄安全策略
CREATE POLICY "Users can only view their own actions"
ON record_history
USING (
  auth.uid() = user_id OR
  auth.jwt() ->> 'role' IN ('admin', 'manager')
);
```

#### 數據加密
- **傳輸加密**: TLS/SSL 1.3
- **存儲加密**: AES-256
- **令牌加密**: JWT with RS256
- **敏感數據**: 字段級加密

### 3. API 安全

#### 速率限制
```typescript
const rateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 100, // 每個 IP 限制 100 請求
  standardHeaders: true,
  legacyHeaders: false,
};
```

#### 輸入驗證
```typescript
import { z } from 'zod';

const palletSchema = z.object({
  plt_num: z.string().regex(/^\d{6}\/\d{4}$/),
  product_code: z.string().min(1).max(50),
  product_qty: z.number().int().positive(),
});
```

## 性能優化架構

### 1. 前端性能優化

#### Bundle 優化
- **代碼分割**: 按路由和組件分割
- **樹搖（Tree Shaking）**: 移除未使用代碼
- **動態導入**: 按需加載組件
- **壓縮**: Gzip 和 Brotli 壓縮

#### 快取策略
```typescript
// Next.js 快取配置
const nextConfig = {
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=300, s-maxage=600'
        }
      ]
    }
  ]
};
```

### 2. 後端性能優化

#### 數據庫優化
- **連接池**: 最大 50 個連接
- **查詢優化**: 使用 EXPLAIN ANALYZE
- **索引策略**: 複合索引和部分索引
- **分區**: 按時間分區大表

#### 快取架構
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Browser Cache │    │   CDN Cache     │    │   Redis Cache   │
│   (Client Side) │    │  (Edge Cache)   │    │  (Server Side)  │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│  Static Assets  │    │  Static Files   │    │  Query Results  │
│  API Responses  │    │  Images         │    │  Session Data   │
│  User Data      │    │  Documents      │    │  Computed Values│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 3. 監控和度量

#### 性能指標
```typescript
interface PerformanceMetrics {
  // Web Vitals
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte

  // 自定義指標
  apiResponseTime: number;
  databaseQueryTime: number;
  cacheHitRate: number;
  errorRate: number;
}
```

## 擴展性設計

### 1. 水平擴展

#### 負載均衡
```nginx
upstream newpennine_backend {
    server app1.newpennine.com:3000 weight=3;
    server app2.newpennine.com:3000 weight=2;
    server app3.newpennine.com:3000 weight=1;

    # 健康檢查
    health_check interval=30s fails=3 passes=2;
}
```

#### 微服務架構
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Web Frontend   │    │  API Gateway    │    │  Auth Service   │
│  (Next.js)      │    │  (Nginx/Kong)   │    │  (Supabase)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                │
         ┌─────────────────────────────────────────────────┐
         │                 Service Mesh                    │
         └─────────────────────────────────────────────────┘
                                │
    ┌─────────────┬─────────────┼─────────────┬─────────────┐
    │             │             │             │             │
┌───▼────┐ ┌─────▼────┐ ┌──────▼────┐ ┌─────▼────┐ ┌─────▼────┐
│Inventory│ │ Orders   │ │ Reports   │ │ Pallets  │ │ Alerts   │
│Service  │ │ Service  │ │ Service   │ │ Service  │ │ Service  │
└────────┘ └──────────┘ └───────────┘ └──────────┘ └──────────┘
```

### 2. 垂直擴展

#### 資源優化
- **CPU**: 多核並行處理
- **記憶體**: 內存池和對象池
- **磁碟**: SSD 和 NVMe 存儲
- **網絡**: 高速網絡接口

#### 自動擴展
```yaml
# Kubernetes 自動擴展配置
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: newpennine-wms
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: newpennine-wms
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### 3. 數據擴展

#### 分片策略
```sql
-- 按時間分片
CREATE TABLE record_history_2025 PARTITION OF record_history
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- 按地區分片  
CREATE TABLE record_palletinfo_asia PARTITION OF record_palletinfo
FOR VALUES IN ('HK', 'TW', 'SG', 'MY');
```

#### 讀寫分離
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Write Queries  │    │  Master DB      │    │  Read Queries   │
│  (INSERT/UPDATE)│───▶│  (Primary)      │───▶│  (SELECT)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                    ┌─────────────────┐
                    │  Replica DB     │
                    │  (Read Only)    │
                    └─────────────────┘
```

## 部署架構

### 1. 環境架構

#### 多環境配置
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Development    │    │  Staging        │    │  Production     │
│  (本地開發)     │    │  (測試環境)     │    │  (生產環境)     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│  Local DB       │    │  Staging DB     │    │  Production DB  │
│  Mock APIs      │    │  Real APIs      │    │  Real APIs      │
│  Debug Mode     │    │  Test Mode      │    │  Production Mode│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### 原生部署
系統支持標準 Node.js 部署方式，無需容器化。

### 2. 高可用架構

#### 故障轉移
```
┌─────────────────┐    ┌─────────────────┐
│  Primary DC     │    │  Secondary DC   │
│  (主數據中心)   │    │  (備用數據中心) │
├─────────────────┤    ├─────────────────┤
│  Active Apps    │    │  Standby Apps   │
│  Master DB      │    │  Replica DB     │
│  Redis Primary  │    │  Redis Replica  │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
              Failover Link
```

#### 災難恢復
- **RTO**: 恢復時間目標 < 1 小時
- **RPO**: 恢復點目標 < 5 分鐘
- **備份策略**: 每日全量 + 每小時增量
- **異地備份**: 多地域分佈

## 開發工作流

### 1. 開發流程

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Feature Branch │    │  Pull Request   │    │  Code Review    │
│  (功能分支)     │───▶│  (合並請求)     │───▶│  (代碼審查)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Local Testing  │    │  CI/CD Pipeline │    │  Deployment     │
│  (本地測試)     │    │  (持續集成)     │    │  (自動部署)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2. 質量控制

#### 代碼質量
- **ESLint**: 代碼風格檢查
- **Prettier**: 代碼格式化
- **TypeScript**: 類型檢查
- **SonarQube**: 代碼質量分析

#### 測試策略
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Unit Tests     │    │  Integration    │    │  E2E Tests      │
│  (單元測試)     │    │  Tests          │    │  (端到端測試)   │
├─────────────────┤    │  (集成測試)     │    ├─────────────────┤
│  Jest           │    ├─────────────────┤    │  Playwright     │
│  React Testing  │    │  Supertest      │    │  Cypress        │
│  Library        │    │  Test Containers│    │  WebDriver      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 未來擴展計劃

### 1. 技術演進路線

#### 短期目標 (3-6 個月)
- **微服務拆分**: 按業務域拆分服務
- **API Gateway**: 統一 API 管理
- **服務網格**: Istio 或 Linkerd
- **可觀測性**: 分佈式追蹤

#### 中期目標 (6-12 個月)
- **雲原生**: Kubernetes 部署
- **多租戶**: 支援多客戶
- **國際化**: 多語言支援
- **移動應用**: React Native App

#### 長期目標 (1-2 年)
- **AI 整合**: 智能庫存管理
- **IoT 支援**: 物聯網設備整合
- **區塊鏈**: 供應鏈溯源
- **邊緣計算**: 邊緣節點部署

### 2. 架構演進

#### 當前架構 (v2.0.7)
- 單體應用 + 微服務元素
- 傳統部署 + 容器化
- 基本監控 + 告警系統

#### 目標架構 (v3.0)
- 完全微服務架構
- 雲原生部署
- 全面可觀測性
- 自動化運維

## 技術決策記錄

### 1. 架構決策

#### ADR-001: 選擇 Next.js 14
**背景**: 需要現代化前端框架  
**決策**: 選擇 Next.js 14 App Router  
**理由**:
- 優秀的性能和開發體驗
- 內建 SSR 和 SSG 支援
- 強大的生態系統
- 活躍的社區支援

#### ADR-002: 選擇 Supabase
**背景**: 需要後端即服務 (BaaS)  
**決策**: 選擇 Supabase 作為後端  
**理由**:
- 完整的認證和授權
- 實時數據庫功能
- 自動 API 生成
- 優秀的開發者體驗

#### ADR-003: 選擇 TypeScript
**背景**: 需要類型安全  
**決策**: 全面使用 TypeScript  
**理由**:
- 編譯時錯誤檢測
- 更好的 IDE 支援
- 代碼可維護性
- 團隊協作效率

### 2. 技術選型對比

#### 前端框架對比
| 特性 | Next.js | Nuxt.js | React SPA |
|------|---------|---------|-----------|
| SSR 支援 | ✅ 優秀 | ✅ 優秀 | ❌ 無 |
| 性能 | ✅ 優秀 | ✅ 良好 | ✅ 良好 |
| 學習曲線 | ✅ 溫和 | ✅ 溫和 | ✅ 簡單 |
| 生態系統 | ✅ 豐富 | ✅ 豐富 | ✅ 最豐富 |
| 維護性 | ✅ 優秀 | ✅ 良好 | ✅ 良好 |

#### 後端方案對比
| 特性 | Supabase | Firebase | 自建 API |
|------|----------|----------|----------|
| 開發速度 | ✅ 最快 | ✅ 快 | ❌ 慢 |
| 靈活性 | ✅ 高 | ✅ 中 | ✅ 最高 |
| 成本 | ✅ 合理 | ✅ 合理 | ❌ 高 |
| 可控性 | ✅ 高 | ✅ 中 | ✅ 最高 |
| 擴展性 | ✅ 優秀 | ✅ 良好 | ✅ 優秀 |

## 聯絡資訊

**架構團隊**: architecture@newpennine.com  
**技術負責人**: tech-lead@newpennine.com  
**系統管理員**: admin@newpennine.com  

### 技術支援層級
1. **開發團隊**: 日常開發問題
2. **架構團隊**: 架構設計諮詢
3. **DevOps 團隊**: 部署和運維
4. **技術委員會**: 重大技術決策

---

**版本**: v2.0.7  
**建立日期**: 2025-07-17  
**最後更新**: 2025-07-17  
**下次審查**: 2025-10-17  

### 文檔維護
- 每季度更新架構圖
- 每月更新技術棧信息
- 重大變更立即更新
- 年度架構審查

**維護者**: NewPennine Architecture Team  
**文檔路徑**: `/docs/manual/system-architecture.md`
