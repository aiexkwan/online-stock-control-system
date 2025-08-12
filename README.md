[English](#english) | [中文](#中文)

---
# Pennine Manufacturing Stock Control System
## English

### Overview
A comprehensive stock control and management system built with Next.js 14, TypeScript, and Supabase. This system provides real-time inventory tracking, pallet management, label printing, AI-powered order analysis, and administrative tools for Pennine Manufacturing Industries.

### 🚀 Key Features

#### **QC Label Printing System**
- **Multi-Product Support**: Regular products, ACO orders, and Slate products
- **Automated Processing**: Pallet number and series generation
- **PDF Generation**: High-quality label output with automatic storage
- **Batch Processing**: Multiple pallet label generation with progress tracking
- **Error Handling**: Comprehensive error management and recovery

#### **GRN Label Printing System**
- **Material Receipt Management**: Complete GRN workflow
- **Weight Calculation**: Automatic net weight calculation (up to 22 pallets)
- **Supplier Validation**: Real-time supplier code verification
- **Atomic Operations**: Database consistency with RPC functions
- **Professional Labels**: Industrial-grade receipt labels

#### **Stock Transfer System**
- **Automated Transfers**: One-click pallet movement
- **Smart Location Calculation**: Predefined business rules
- **QR Code Support**: Barcode scanning integration
- **Real-time Updates**: Instant inventory adjustments
- **Transfer History**: Complete audit trail

#### **Admin Panel & Dashboard**
- **Real-time Statistics**: Daily, weekly production metrics
- **ACO Order Tracking**: Order progress monitoring
- **Quick Inventory Search**: Instant stock level queries
- **Report Generation**: ACO, GRN, Transaction, Slate reports
- **Data Export**: Comprehensive database export tools
- **Universal Upload Card**: Configurable upload system with plugins for folder selection, preview, and AI analysis

#### **AI-Powered Features**
- **PDF Order Analysis**: Automatic order data extraction
- **Duplicate Detection**: Smart duplicate record checking
- **Natural Language Queries**: AI database querying
- **Document Processing**: Intelligent PDF content analysis

#### **System Tools**
- **File Upload**: PDF document processing
- **Pallet Voiding**: Advanced cancellation with reprint options
- **History Tracking**: Complete operation timeline
- **Database Updates**: Product master data management
- **User Management**: Role-based access control

### 🛠 Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion, Glassmorphism design
- **Backend**: Supabase (PostgreSQL, Auth, Real-time, Storage)
- **AI Integration**: OpenAI GPT-4o for document analysis
- **PDF Processing**: pdf2pic, GraphicsMagick, Ghostscript
- **UI Components**: Radix UI, Heroicons
- **State Management**: React Hooks, Custom business logic hooks
- **Authentication**: Supabase Auth with role-based permissions

### 📁 Project Structure

```
online-stock-control-system/
├── app/
│   ├── admin/                  # Comprehensive admin panel with dashboard cards
│   │   └── components/dashboard/cards/common/UniversalUploadCard/ # New universal upload component
│   ├── api/                    # API endpoints including AI analysis and reports
│   ├── print-label/            # QC label printing system
│   ├── print-grnlabel/         # GRN label printing
│   ├── stock-transfer/         # Automated stock movement
│   └── ... (other routes)
├── components/
│   ├── ui/                     # UI component library
│   ├── qr-scanner/             # QR code scanning
│   └── ...
├── docs/                      # Comprehensive documentation
├── lib/                       # Utility libraries including cards config
├── supabase/                  # Supabase configurations and migrations
├── tests/                     # Unit and integration tests
└── public/                    # Static assets
```

### 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd NewPennine
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install system dependencies**
   ```bash
   # macOS
   brew install graphicsmagick ghostscript

   # Ubuntu/Debian
   sudo apt-get install graphicsmagick ghostscript
   ```

4. **Environment setup**
   ```bash
   cp .env.example .env.local
   # Configure your credentials:
   # - Supabase URL and Service Role Key
   # - OpenAI API Key for PDF analysis
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   npm start
   ```

### 🔐 Authentication & Security

- **Supabase Authentication**: Secure user login with email/password
- **Role-based Access**: Multiple permission levels (Admin, QC, Receive, etc.)
- **Session Management**: Automatic session handling and cleanup
- **Route Protection**: Middleware-based route protection
- **Operation Logging**: Complete audit trail for all actions

### 📊 Database Schema

The system uses PostgreSQL through Supabase with the following main tables:
- `record_palletinfo`: Pallet information and tracking
- `record_history`: Complete audit trail of all operations
- `record_transfer`: Stock movement records
- `record_inventory`: Real-time inventory levels by location
- `record_aco`: ACO order management and tracking
- `record_grn`: GRN receipt records with weight information
- `data_code`: Product catalog and specifications
- `data_supplier`: Supplier information and validation
- `data_id`: User management and permissions
- `data_order`: AI-extracted order data

### 🤖 AI Features

#### **PDF Order Analysis**
- **Document Processing**: Automatic PDF to image conversion
- **AI Vision Analysis**: OpenAI GPT-4o for data extraction
- **Smart Parsing**: Intelligent order information recognition
- **Duplicate Prevention**: Automatic duplicate record detection
- **Data Validation**: Comprehensive data integrity checks

#### **Natural Language Database Queries**
- **AI Query Generation**: Convert natural language to SQL
- **Permission Control**: Role-based query access
- **Result Formatting**: User-friendly data presentation
- **Query History**: Track and manage query usage

### 🚀 Recent Updates

#### **AI Integration**
- Implemented OpenAI GPT-4o for PDF document analysis
- Added intelligent order data extraction
- Smart duplicate detection and prevention
- Automated data insertion with validation

#### **System Optimization**
- Enhanced PDF processing pipeline
- Improved error handling and recovery
- Optimized database operations
- Better user experience with progress tracking

#### **Security Enhancements**
- Strengthened authentication system
- Improved session management
- Enhanced data validation
- Better error logging and monitoring

#### **Recent Updates**

##### **Phase V1.2 Enhancements**
- Implemented UniversalUploadCard with plugin system for modular upload features
- Added plugins: FolderSelector, Preview, AIAnalysis
- Updated card configurations for better modularity
- Enhanced design system unification

### 📖 Documentation

Comprehensive documentation is available in the `/docs` folder:
- [QC Label Printing](./docs/print_QC_Label.md)
- [GRN Label Printing](./docs/print_GRN_Label.md)
- [Stock Transfer System](./docs/stock_transfer.md)
- [Admin Panel Guide](./docs/admin_panel.md)
- [User Manual](./docs/userManual.md)
- [Database Structure](./docs/databaseStructure.md)

### 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 📄 License

This project is proprietary software developed for Pennine Manufacturing Industries.

---

## 中文
# Pennine Manufacturing 庫存控制系統

### 概述
基於 Next.js 14、TypeScript 和 Supabase 構建的綜合庫存控制和管理系統。該系統為 Pennine Manufacturing Industries 提供實時庫存追蹤、棧板管理、標籤列印、AI 驅動的訂單分析和管理工具。

### 主要功能

#### **QC 標籤列印系統**
- **多產品支援**：正常產品、ACO 訂單和 Slate 產品
- **自動化處理**：棧板號碼和系列號生成
- **PDF 生成**：高品質標籤輸出與自動儲存
- **批量處理**：多個棧板標籤生成與進度追蹤
- **錯誤處理**：全面的錯誤管理和恢復機制

#### **GRN 標籤列印系統**
- **物料收貨管理**：完整的 GRN 工作流程
- **重量計算**：自動淨重計算（最多 22 個棧板）
- **供應商驗證**：即時供應商代碼驗證
- **原子性操作**：使用 RPC 函數確保資料庫一致性
- **專業標籤**：工業級收貨標籤

#### **庫存轉移系統**
- **自動化轉移**：一鍵式棧板移動
- **智能位置計算**：預定義業務規則
- **QR Code 支援**：條碼掃描整合
- **即時更新**：瞬間庫存調整
- **轉移歷史**：完整的審計軌跡

#### **管理面板與儀表板**
- **即時統計**：每日、每週生產指標
- **ACO 訂單追蹤**：訂單進度監控
- **快速庫存搜尋**：即時庫存水平查詢
- **報表生成**：ACO、GRN、交易、Slate 報表
- **資料匯出**：全面的資料庫匯出工具
- **通用上傳小部件**：可配置的上傳系統，包含文件夾選擇、預覽和AI分析插件

#### **AI 驅動功能**
- **PDF 訂單分析**：自動訂單資料提取
- **重複檢測**：智能重複記錄檢查
- **自然語言查詢**：AI 資料庫查詢
- **文件處理**：智能 PDF 內容分析

#### **系統工具**
- **檔案上傳**：PDF 文件處理
- **棧板作廢**：進階取消功能與重印選項
- **歷史追蹤**：完整的操作時間軸
- **資料庫更新**：產品主檔資料管理
- **使用者管理**：基於角色的存取控制

### 技術棧

- **前端**：Next.js 14、React 18、TypeScript
- **樣式**：Tailwind CSS、Framer Motion、玻璃擬態設計
- **後端**：Supabase（PostgreSQL、Auth、即時、儲存）
- **AI 整合**：OpenAI GPT-4o 用於文件分析
- **PDF 處理**：pdf2pic、GraphicsMagick、Ghostscript
- **UI 組件**：Radix UI、Heroicons
- **狀態管理**：React Hooks、自訂業務邏輯 hooks
- **身份驗證**：Supabase Auth 與基於角色的權限

### 專案結構

```
online-stock-control-system/
├── app/
│   ├── admin/                  # 綜合管理面板與儀表板卡片
│   │   └── components/dashboard/cards/common/UniversalUploadCard/ # 新的通用上傳組件
│   ├── api/                    # API端點包括AI分析和報表
│   ├── print-label/            # QC標籤列印系統
│   ├── print-grnlabel/         # GRN標籤列印
│   ├── stock-transfer/         # 自動化庫存移動
│   └── ... (其他路由)
├── components/
│   ├── ui/                     # UI組件庫
│   ├── qr-scanner/             # QR碼掃描
│   └── ...
├── docs/                      # 綜合文檔
├── lib/                       # 工具庫包括卡片配置
├── supabase/                  # Supabase配置和遷移
├── tests/                     # 單元和整合測試
└── public/                    # 靜態資源
```

### 安裝與設置

1. **克隆倉庫**
   ```bash
   git clone <repository-url>
   cd NewPennine
   ```

2. **安裝依賴**
   ```bash
   npm install
   ```

3. **安裝系統依賴**
   ```bash
   # macOS
   brew install graphicsmagick ghostscript

   # Ubuntu/Debian
   sudo apt-get install graphicsmagick ghostscript
   ```

4. **環境設置**
   ```bash
   cp .env.example .env.local
   # 配置您的憑證：
   # - Supabase URL 和 Service Role Key
   # - OpenAI API Key 用於 PDF 分析
   ```

5. **運行開發服務器**
   ```bash
   npm run dev
   ```

6. **生產構建**
   ```bash
   npm run build
   npm start
   ```

### 身份驗證與安全

- **Supabase 身份驗證**：使用電子郵件/密碼的安全用戶登錄
- **基於角色的存取**：多種權限級別（管理員、QC、接收等）
- **會話管理**：自動會話處理和清理
- **路由保護**：基於中間件的路由保護
- **操作日誌**：所有操作的完整審計軌跡

### 資料庫架構

系統通過 Supabase 使用 PostgreSQL，主要表格包括：
- `record_palletinfo`：棧板資訊和追蹤
- `record_history`：所有操作的完整審計軌跡
- `record_transfer`：庫存移動記錄
- `record_inventory`：按位置的即時庫存水平
- `record_aco`：ACO 訂單管理和追蹤
- `record_grn`：包含重量資訊的 GRN 收貨記錄
- `data_code`：產品目錄和規格
- `data_supplier`：供應商資訊和驗證
- `data_id`：使用者管理和權限
- `data_order`：AI 提取的訂單資料

### AI 功能

#### **PDF 訂單分析**
- **文件處理**：自動 PDF 轉圖像轉換
- **AI 視覺分析**：OpenAI GPT-4o 用於資料提取
- **智能解析**：智能訂單資訊識別
- **重複預防**：自動重複記錄檢測
- **資料驗證**：全面的資料完整性檢查

#### **Ask Me Anything - 智能資料庫查詢**
- **自然語言查詢**：支援中文和英文自然語言問題
- **OpenAI SQL 生成**：使用 GPT-4o 根據 docs/openAIprompt 指示生成精確的 SQL 查詢
- **智能回答生成**：OpenAI 分析查詢結果並生成專業的英式風格回答
- **會話記憶**：支援上下文對話，記住之前的查詢歷史
- **安全執行**：所有 SQL 查詢經過安全驗證，僅允許 SELECT 操作
- **實時緩存**：智能緩存機制提高查詢響應速度
- **Token 追蹤**：完整的 OpenAI API 使用量監控

### 最新更新

#### **AI 整合**
- 實施 OpenAI GPT-4o 用於 PDF 文件分析
- 新增智能訂單資料提取
- 智能重複檢測和預防
- 自動化資料插入與驗證

#### **系統優化**
- 增強 PDF 處理管道
- 改進錯誤處理和恢復
- 優化資料庫操作
- 更好的使用者體驗與進度追蹤

#### **安全增強**
- 強化身份驗證系統
- 改進會話管理
- 增強資料驗證
- 更好的錯誤日誌和監控

#### **Phase V1.2 增強**
- 實施UniversalUploadCard與插件系統用於模塊化上傳功能
- 新增插件：FolderSelector、Preview、AIAnalysis
- 更新卡片配置以提高模塊性
- 增強設計系統統一

### 文檔

`/docs` 文件夾中提供了綜合文檔：
- [QC 標籤列印](./docs/print_QC_Label.md)
- [GRN 標籤列印](./docs/print_GRN_Label.md)
- [庫存轉移系統](./docs/stock_transfer.md)
- [管理面板指南](./docs/admin_panel.md)
- [使用者手冊](./docs/userManual.md)
- [資料庫結構](./docs/databaseStructure.md)

### 貢獻

1. Fork 倉庫
2. 創建功能分支（`git checkout -b feature/amazing-feature`）
3. 提交更改（`git commit -m 'Add amazing feature'`）
4. 推送到分支（`git push origin feature/amazing-feature`）
5. 打開 Pull Request

### 許可證

本專案是為 Pennine Manufacturing Industries 開發的專有軟件。
