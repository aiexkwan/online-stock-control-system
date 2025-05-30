# Pennine Manufacturing Stock Control System
# Pennine Manufacturing 庫存控制系統

[English](#english) | [中文](#中文)

---

## English

### Overview
A comprehensive stock control and management system built with Next.js 14, TypeScript, and Supabase. This system provides real-time inventory tracking, pallet management, label printing, and administrative tools for Pennine Industries.

### 🚀 Key Features

#### **Home Dashboard**
- Real-time inventory overview with interactive charts
- History log with enhanced display (25% larger viewing area)
- User-friendly interface with improved navigation

#### **Label Printing System**
- **QC Label Printing**: Support for regular products, ACO orders, and Slate products
- **GRN Label Printing**: Material receipt label generation
- **PDF Generation**: High-quality label output with barcode support
- **Batch Processing**: Multiple pallet label generation

#### **Stock Management**
- **Stock Transfer**: Location-based inventory movement
- **Inventory Tracking**: Real-time stock levels across multiple locations
- **Void Pallet**: Pallet cancellation and management
- **History Tracking**: Complete audit trail of all operations

#### **Admin Panel**
- **Dual Header Design**: Global navigation + dedicated admin navigation
- **Transparent Navigation**: Seamless integration with page content
- **Hover-based Interactions**: Intuitive dropdown menus without clicking
- **Dashboard Analytics**: Real-time statistics and performance metrics
- **User Management**: Role-based access control
- **Report Generation**: ACO, GRN, Transaction, and Slate reports

#### **Enhanced UI/UX**
- **50% Larger GlobalHeader**: Improved readability and accessibility
- **Hover-based Navigation**: Floating dropdown menus for better UX
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Dark Theme**: Professional appearance with consistent styling

### 🛠 Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **PDF Generation**: React-PDF, jsPDF
- **UI Components**: Radix UI, Lucide Icons
- **State Management**: React Hooks, Context API
- **Authentication**: Supabase Auth with role-based access

### 📁 Project Structure

```
online-stock-control-system/
├── app/
│   ├── home/                    # Main dashboard (formerly /dashboard/access)
│   ├── admin/                   # Admin panel with dual header design
│   ├── print-label/            # QC label printing system
│   ├── print-grnlabel/         # GRN label printing
│   ├── stock-transfer/         # Stock movement management
│   ├── void-pallet/            # Pallet cancellation
│   ├── users/                  # User management
│   ├── products/               # Product catalog
│   ├── tables/                 # Database structure viewer
│   └── components/             # Shared components
├── components/
│   ├── ui/                     # UI component library
│   ├── GlobalHeader.tsx        # Enhanced global navigation
│   └── products/               # Product-related components
├── docs/                       # Comprehensive documentation
├── lib/                        # Utility libraries
└── public/                     # Static assets
```

### 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd online-stock-control-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   # Configure your Supabase credentials
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

### 🔐 Authentication & Security

- **Supabase Authentication**: Secure user login with email/password
- **Role-based Access**: Different permission levels (Admin, QC, Receive, etc.)
- **Session Management**: Automatic session handling and cleanup
- **Route Protection**: Middleware-based route protection

### 📊 Database Schema

The system uses PostgreSQL through Supabase with the following main tables:
- `record_palletinfo`: Pallet information and tracking
- `record_history`: Complete audit trail
- `record_transfer`: Stock movement records
- `record_inventory`: Real-time inventory levels
- `data_id`: User management and permissions
- `data_code`: Product catalog and specifications

### 🚀 Recent Updates (v4.0.0)

#### **Path Restructuring**
- Renamed `/dashboard/access` to `/home` for better user understanding
- Updated all navigation and authentication checks
- Maintained backward compatibility with redirects

#### **GlobalHeader Enhancements**
- Increased height by 50% (`h-16` → `h-24`) for better visibility
- Implemented hover-based hamburger menu (no clicking required)
- Improved text sizing and icon scaling
- Removed complex sidebar animations for simpler dropdown menus

#### **Admin Panel Improvements**
- Removed "Admin Panel" title and icon for cleaner design
- Transparent background navigation bar
- Seamless integration with GlobalHeader
- Hover-based sub-menu interactions

#### **Home Page UI Improvements**
- History Log height increased by 25% for more data visibility
- Enhanced scrolling and pagination functionality
- Better information density

### 📖 Documentation

Comprehensive documentation is available in the `/docs` folder:
- [Dashboard Documentation](./docs/dashboard.md)
- [Admin Panel Guide](./docs/adminPanel.md)
- [Global Layout System](./docs/globalLayout.md)
- [Project Details](./docs/projectDetail.md)

### 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 📄 License

This project is proprietary software developed for Pennine Industries.

---

## 中文

### 概述
基於 Next.js 14、TypeScript 和 Supabase 構建的綜合庫存控制和管理系統。該系統為賓尼工業提供實時庫存追蹤、棧板管理、標籤列印和管理工具。

### 🚀 主要功能

#### **主頁儀表板**
- 帶有互動圖表的實時庫存概覽
- 增強顯示的歷史記錄（顯示區域增加 25%）
- 改進導航的用戶友好界面

#### **標籤列印系統**
- **QC 標籤列印**：支援普通產品、ACO 訂單和 Slate 產品
- **GRN 標籤列印**：物料收貨標籤生成
- **PDF 生成**：支援條碼的高品質標籤輸出
- **批量處理**：多個棧板標籤生成

#### **庫存管理**
- **庫存轉移**：基於位置的庫存移動
- **庫存追蹤**：跨多個位置的實時庫存水平
- **作廢棧板**：棧板取消和管理
- **歷史追蹤**：所有操作的完整審計軌跡

#### **管理面板**
- **雙 Header 設計**：全局導航 + 專用管理導航
- **透明導航**：與頁面內容無縫整合
- **懸停式交互**：無需點擊的直觀下拉選單
- **儀表板分析**：實時統計和性能指標
- **用戶管理**：基於角色的訪問控制
- **報告生成**：ACO、GRN、交易和 Slate 報告

#### **增強的 UI/UX**
- **50% 更大的 GlobalHeader**：改善可讀性和可訪問性
- **懸停式導航**：更好用戶體驗的浮動下拉選單
- **響應式設計**：針對桌面、平板和手機優化
- **深色主題**：一致樣式的專業外觀

### 🛠 技術棧

- **前端**：Next.js 14、React 18、TypeScript
- **樣式**：Tailwind CSS、Framer Motion
- **後端**：Supabase（PostgreSQL、Auth、實時）
- **PDF 生成**：React-PDF、jsPDF
- **UI 組件**：Radix UI、Lucide Icons
- **狀態管理**：React Hooks、Context API
- **身份驗證**：Supabase Auth 與基於角色的訪問

### 📁 專案結構

```
online-stock-control-system/
├── app/
│   ├── home/                    # 主儀表板（原 /dashboard/access）
│   ├── admin/                   # 雙 header 設計的管理面板
│   ├── print-label/            # QC 標籤列印系統
│   ├── print-grnlabel/         # GRN 標籤列印
│   ├── stock-transfer/         # 庫存移動管理
│   ├── void-pallet/            # 棧板取消
│   ├── users/                  # 用戶管理
│   ├── products/               # 產品目錄
│   ├── tables/                 # 數據庫結構查看器
│   └── components/             # 共享組件
├── components/
│   ├── ui/                     # UI 組件庫
│   ├── GlobalHeader.tsx        # 增強的全局導航
│   └── products/               # 產品相關組件
├── docs/                       # 綜合文檔
├── lib/                        # 工具庫
└── public/                     # 靜態資源
```

### 🔧 安裝與設置

1. **克隆倉庫**
   ```bash
   git clone <repository-url>
   cd online-stock-control-system
   ```

2. **安裝依賴**
   ```bash
   npm install
   ```

3. **環境設置**
   ```bash
   cp .env.example .env.local
   # 配置您的 Supabase 憑證
   ```

4. **運行開發服務器**
   ```bash
   npm run dev
   ```

5. **生產構建**
   ```bash
   npm run build
   npm start
   ```

### 🔐 身份驗證與安全

- **Supabase 身份驗證**：使用電子郵件/密碼的安全用戶登錄
- **基於角色的訪問**：不同權限級別（管理員、QC、接收等）
- **會話管理**：自動會話處理和清理
- **路由保護**：基於中間件的路由保護

### 📊 數據庫架構

系統通過 Supabase 使用 PostgreSQL，主要表格包括：
- `record_palletinfo`：棧板信息和追蹤
- `record_history`：完整審計軌跡
- `record_transfer`：庫存移動記錄
- `record_inventory`：實時庫存水平
- `data_id`：用戶管理和權限
- `data_code`：產品目錄和規格

### 🚀 最新更新 (v4.0.0)

#### **路徑重構**
- 將 `/dashboard/access` 重命名為 `/home`，提升用戶理解度
- 更新所有導航和身份驗證檢查
- 通過重定向保持向後兼容性

#### **GlobalHeader 增強**
- 高度增加 50%（`h-16` → `h-24`）以提高可見性
- 實現懸停式漢堡選單（無需點擊）
- 改進文字大小和圖標縮放
- 移除複雜的側邊欄動畫，改為簡單的下拉選單

#### **管理面板改進**
- 移除 "Admin Panel" 標題和圖標，設計更簡潔
- 透明背景導航欄
- 與 GlobalHeader 無縫整合
- 懸停式子選單交互

#### **主頁 UI 改進**
- 歷史記錄高度增加 25%，提高數據可見性
- 增強滾動和分頁功能
- 更好的信息密度

### 📖 文檔

`/docs` 文件夾中提供了綜合文檔：
- [儀表板文檔](./docs/dashboard.md)
- [管理面板指南](./docs/adminPanel.md)
- [全局佈局系統](./docs/globalLayout.md)
- [專案詳情](./docs/projectDetail.md)

### 🤝 貢獻

1. Fork 倉庫
2. 創建功能分支（`git checkout -b feature/amazing-feature`）
3. 提交更改（`git commit -m 'Add amazing feature'`）
4. 推送到分支（`git push origin feature/amazing-feature`）
5. 打開 Pull Request

### 📄 許可證

本專案是為Pennine Manufacturing的專有軟件。
