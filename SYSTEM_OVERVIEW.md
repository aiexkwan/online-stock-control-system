# NewPennine 倉庫管理系統總覽

## 系統簡介
NewPennine 係一個現代化嘅倉庫管理系統（WMS），採用 React 18、TypeScript、Supabase 同 Next.js 14 構建。系統提供全面嘅倉庫操作管理功能，包括庫存管理、標籤打印、盤點、轉移等核心功能。

## 技術架構

### 前端技術棧
- **框架**: Next.js 14 (App Router)
- **UI庫**: React 18 + TypeScript
- **樣式**: Tailwind CSS + shadcn/ui
- **狀態管理**: React Hooks + Context API
- **圖表**: Recharts
- **PDF生成**: jsPDF + html2canvas

### 後端技術棧
- **數據庫**: PostgreSQL (Supabase)
- **認證**: Supabase Auth
- **存儲**: Supabase Storage
- **實時功能**: Supabase Realtime
- **API**: REST + RPC Functions
- **緩存**: React Cache + LRU Cache

### 部署架構
- **託管**: Vercel
- **數據庫**: Supabase Cloud
- **CDN**: Vercel Edge Network
- **監控**: Vercel Analytics

## 核心功能模組

### 1. 管理面板 (Admin Panel)
- **路徑**: `/admin`
- **功能**:
  - 可拖放嘅儀表板小部件系統
  - 實時數據監控同可視化
  - 6x6 網格佈局系統
  - 自定義小部件配置
  - 用戶權限管理
- **關鍵組件**:
  - `AdminPageClient.tsx`: 主頁面組件
  - `EnhancedDashboard.tsx`: 儀表板容器
  - `GridWidget.tsx`: 小部件基礎組件
  - `registerAdminWidgets.ts`: 小部件註冊系統

### 2. AI查詢系統 (Ask Me Anything)
- **路徑**: `/ama`
- **功能**:
  - 自然語言轉SQL查詢
  - OpenAI GPT-4o 整合
  - 智能結果緩存
  - 安全查詢執行
  - 記憶功能 (mem0ai)
- **技術特點**:
  - 語義相似度緩存
  - SQL注入防護
  - 結果格式化同可視化

### 3. GRN標籤打印
- **路徑**: `/grn`
- **功能**:
  - 收貨標籤生成
  - 自動重量計算
  - 條碼/QR碼生成
  - 批量打印支援
  - 棧板號碼原子性生成
- **RPC函數**:
  - `generate_atomic_pallet_numbers_v5`
  - `auto_cleanup_pallet_buffer`

### 4. QC標籤打印
- **路徑**: `/qc`
- **功能**:
  - 品質控制標籤生成
  - ACO/Slate產品特殊處理
  - 緩衝池優化機制
  - 高速批量打印
- **優化特點**:
  - V2版本性能提升
  - 智能緩衝池管理
  - 並發處理優化

### 5. 盤點系統 (Stock Count)
- **路徑**: `/stock-take/cycle-count`
- **功能**:
  - QR碼掃描盤點
  - 批量模式支援
  - 實時差異分析
  - 盤點報表生成
- **特色功能**:
  - 觸控數字鍵盤
  - 離線隊列支援
  - 移動優化介面

### 6. 庫存轉移 (Stock Transfer)
- **路徑**: `/stock-transfer`
- **功能**:
  - 快速棧板轉移
  - 轉移代碼系統
  - 實時位置更新
  - 操作歷史追蹤
- **性能優化**:
  - 5分鐘緩存策略
  - 預加載常用前綴
  - 樂觀UI更新

## 數據庫架構

### 核心數據表
```
record_palletinfo     - 棧板主數據
record_inventory      - 庫存位置數據
record_history        - 操作歷史記錄
record_transfer       - 轉移記錄
record_grn           - GRN收貨記錄
record_stocktake     - 盤點交易記錄
data_customerorder   - 客戶訂單
data_code            - 產品主數據
data_id              - 用戶資料
stock_level          - 庫存水平
```

### RPC函數庫
- 棧板號碼生成函數
- 訂單裝載函數
- 查詢執行函數
- 庫存管理函數
- 統計分析函數

## 安全架構

### 認證授權
- Supabase Auth 多因素認證
- 基於角色嘅訪問控制 (RBAC)
- Row Level Security (RLS)
- API密鑰管理

### 數據安全
- SQL注入防護
- XSS防護
- CSRF保護
- 敏感數據加密

## 性能優化

### 前端優化
- 組件懶加載
- 代碼分割
- 圖片優化
- 緩存策略

### 後端優化
- 數據庫索引優化
- 查詢優化
- 連接池管理
- 批量操作

## 監控同維護

### 系統監控
- 實時性能監控
- 錯誤追蹤
- 用戶行為分析
- 資源使用統計

### 維護任務
- 定期數據清理
- 索引重建
- 緩存更新
- 安全更新

## 未來發展方向

### 短期目標 (1-3個月)
- 性能優化提升50%
- 移動應用開發
- RFID整合
- 批量操作增強

### 中期目標 (3-6個月)
- AI預測分析
- 實時協作功能
- 高級報表系統
- IoT設備整合

### 長期願景 (6-12個月)
- 數字孿生倉庫
- 區塊鏈追溯
- 自動化機器人整合
- 全球化部署

## 開發指南

### 環境設置
```bash
# 安裝依賴
npm install

# 設置環境變量
cp .env.example .env.local

# 運行開發服務器
npm run dev
```

### 代碼規範
- 使用 TypeScript 嚴格模式
- 遵循 ESLint 規則
- 組件使用函數式編程
- 保持代碼模組化

### 測試策略
- 單元測試覆蓋率 > 80%
- 集成測試關鍵流程
- E2E測試用戶場景
- 性能測試基準

## 部署流程

### 生產部署
```bash
# 構建生產版本
npm run build

# 運行生產服務器
npm start

# 部署到 Vercel
vercel --prod
```

### 環境管理
- Development: 本地開發
- Staging: 測試環境
- Production: 生產環境

## 支援同資源

### 文檔資源
- 功能文檔: `/docs/fn_*.md`
- 技術文檔: `/docs/*_library.md`
- 改進計劃: `/docs/improvementplan-*.md`

### 聯繫方式
- 技術支援: tech@newpennine.com
- 業務諮詢: sales@newpennine.com
- 緊急支援: 24/7 熱線

## 版本歷史

### v2.0.0 (當前版本)
- 全新管理面板
- AI查詢功能
- 性能大幅提升
- 移動端優化

### v1.0.0
- 基礎WMS功能
- 標籤打印系統
- 庫存管理
- 用戶認證

---

*最後更新: 2025-06-21*
*系統版本: 2.0.0*
*文檔語言: 廣東話*