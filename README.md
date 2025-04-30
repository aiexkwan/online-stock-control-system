# Pennine Stock Control System

一個現代化的在線倉庫庫存控制系統，使用 Next.js 和 Supabase 構建。

## 功能特點

- 🔐 用戶認證和授權
- 📦 實時庫存管理
- 📊 庫存報表和分析
- 🔄 實時數據同步
- 📱 響應式設計，支持所有設備
- 🌐 跨平台支持（Windows/Mac）

## 技術棧

- **前端框架**: Next.js 15.3.1
- **後端服務**: Supabase
- **樣式**: Tailwind CSS
- **部署**: Vercel
- **版本控制**: GitHub

## 本地開發

1. 克隆倉庫：
   ```bash
   git clone https://github.com/aiexkwan/online-stock-control-system.git
   cd online-stock-control-system
   ```

2. 安裝依賴：
   ```bash
   npm install
   ```

3. 設置環境變數：
   創建 `.env.local` 文件並添加以下內容：
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. 運行開發服務器：
   ```bash
   npm run dev
   ```

5. 訪問 [http://localhost:3000](http://localhost:3000)（或系統分配的其他端口）

## 數據庫結構

系統使用以下 Supabase 表：
- data_code：產品代碼信息
- data_id：標識信息
- data_materiallsupplier：供應商信息
- data_slateinfo：板材信息
- record_grn：收貨記錄
- record_history：歷史記錄
- record_inventory：庫存記錄
- record_palletinfo：托盤信息
- record_transfer：轉移記錄

## 部署

項目使用 Vercel 進行自動部署。每次推送到 main 分支時都會觸發新的部署。

## 貢獻

歡迎提交 Pull Requests 和 Issues。

## 許可證

MIT 