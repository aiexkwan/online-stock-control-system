# Pennine 庫存控制系統

一個功能完整的在線倉庫庫存控制系統，使用 Supabase 作為後端和 Next.js 作為前端。

## 特點

- 使用者認證與權限管理
- 產品庫存管理
- 庫存入庫、出庫和轉移操作
- 庫存報表和統計
- 用戶管理
- 響應式設計，支持桌面和移動裝置
- 多語言支持（中文）

## 技術堆棧

- **前端**: Next.js 13.5.6, React, TypeScript, Tailwind CSS
- **後端**: Supabase (PostgreSQL, Auth, Storage)
- **部署**: Vercel
- **版本控制**: Git, GitHub

## 項目結構

```
/app                       # Next.js 應用程序目錄
  /components              # 共享組件
    Navigation.tsx         # 導航組件
  /login                   # 登錄頁面
  /change-password         # 密碼更改頁面
  /products                # 產品管理頁面
  /inventory               # 庫存操作頁面
  /reports                 # 報表頁面
  /users                   # 用戶管理頁面
  layout.tsx               # 主佈局組件
  page.tsx                 # 首頁
/lib                       # 共享庫和 utilities
  supabase.ts              # Supabase 客戶端配置
/public                    # 靜態資源
```

## 數據表結構

### 1. data_id

用戶表，存儲用戶信息和權限。

- id: 用戶工號（主鍵）
- name: 用戶名
- department: 部門
- password: 密碼
- qc: 管理員權限
- receive: 入庫權限
- void: 出庫權限
- view: 查看權限
- resume: 編輯權限
- report: 報表權限

### 2. products

產品表，存儲產品和庫存信息。

- id: 產品 ID（主鍵）
- name: 產品名稱
- sku: 產品編號
- quantity: 庫存數量
- location: 存放位置
- last_updated: 最後更新時間

### 3. inventory_movements

庫存移動表，記錄所有庫存操作。

- id: 記錄 ID（主鍵）
- product_id: 產品 ID（外鍵）
- quantity: 操作數量
- type: 操作類型（'in'=入庫, 'out'=出庫, 'transfer'=轉移）
- from_location: 來源位置
- to_location: 目標位置
- created_by: 操作者
- created_at: 操作時間
- notes: 備註

## 功能說明

### 用戶認證

- 基於 Supabase 認證系統，使用工號和密碼登錄
- 首次登錄時，密碼默認為工號，並強制更改密碼
- 權限基於用戶表中的權限設置

### 產品管理

- 查看所有產品及庫存狀態
- 添加、編輯和刪除產品
- 搜尋產品功能

### 庫存操作

- 入庫：增加產品數量並指定位置
- 出庫：減少產品數量
- 轉移：更改產品存放位置
- 記錄所有庫存操作，包括操作者和時間

### 報表

- 庫存總覽：總產品數、總庫存量、低庫存產品數、零庫存產品數
- 按位置查看庫存分佈
- 查看最近庫存操作記錄

### 用戶管理

- 查看所有用戶
- 添加、編輯和刪除用戶
- 設置用戶權限
- 重置用戶密碼

## 運行本地開發環境

1. 克隆倉庫

```bash
git clone <repository-url>
cd pennine-stock
```

2. 安裝依賴

```bash
npm install
```

3. 設置環境變量

創建 `.env.local` 文件，添加以下配置：

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. 啟動開發服務器

```bash
npm run dev
```

5. 在瀏覽器中訪問 http://localhost:3000

## 部署到 Vercel

1. 註冊一個 Vercel 帳戶
2. 導入 GitHub 倉庫
3. 設置環境變量（同本地開發環境）
4. 部署 