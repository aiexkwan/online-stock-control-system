# NewPennine 快速開始指南

## 系統需求

### 開發環境
- Node.js 18.17 或更高版本
- npm 9.0 或更高版本
- Git
- 支援 ES6+ 嘅現代瀏覽器

### 推薦 IDE
- Visual Studio Code
- 安裝擴展：
  - ESLint
  - Prettier
  - TypeScript
  - Tailwind CSS IntelliSense

## 快速設置

### 1. 克隆項目
```bash
git clone https://github.com/yourusername/NewPennine.git
cd NewPennine
```

### 2. 安裝依賴
```bash
npm install
```

### 3. 環境配置
```bash
# 複製環境變量模板
cp .env.example .env.local

# 編輯 .env.local 填入你嘅配置
```

必需嘅環境變量：
```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI 配置 (用於 Ask Me Anything)
OPENAI_API_KEY=your_openai_api_key

# mem0ai 配置 (可選)
MEM0_API_KEY=your_mem0_api_key
```

### 4. 啟動開發服務器
```bash
npm run dev
```

訪問 http://localhost:3000

## 核心功能快速導覽

### 管理面板
- 訪問路徑: `/admin`
- 功能: 拖放小部件、實時數據監控
- 默認佈局: 6x6 網格系統

### AI查詢系統
- 訪問路徑: `/ama`
- 功能: 用自然語言查詢數據
- 示例: "顯示今日生產嘅所有棧板"

### GRN標籤打印
- 訪問路徑: `/grn`
- 功能: 打印收貨標籤
- 需要: 打印機連接

### QC標籤打印
- 訪問路徑: `/qc`
- 功能: 打印品質控制標籤
- 支援: 批量打印

### 盤點系統
- 訪問路徑: `/stock-take/cycle-count`
- 功能: 掃描盤點、差異分析
- 模式: 單個/批量

### 庫存轉移
- 訪問路徑: `/stock-transfer`
- 功能: 快速轉移棧板
- 特色: 轉移代碼系統

## 常用命令

### 開發命令
```bash
# 開發服務器
npm run dev

# 構建生產版本
npm run build

# 運行生產服務器
npm start

# 類型檢查
npm run type-check

# 代碼格式化
npm run format

# 運行測試
npm test
```

### 數據庫命令
```bash
# 生成類型定義
npm run generate-types

# 運行數據庫遷移
npm run db:migrate

# 重置數據庫
npm run db:reset
```

## 項目結構

```
NewPennine/
├── app/                    # Next.js App Router
│   ├── admin/             # 管理面板
│   ├── ama/               # AI查詢系統
│   ├── grn/               # GRN標籤
│   ├── qc/                # QC標籤
│   ├── stock-take/        # 盤點系統
│   └── stock-transfer/    # 庫存轉移
├── components/            # 共享組件
├── lib/                   # 工具函數
├── public/               # 靜態資源
├── styles/               # 全局樣式
└── docs/                 # 文檔

```

## 開發流程

### 1. 創建新功能
```bash
# 創建新分支
git checkout -b feature/your-feature-name

# 開發你嘅功能
# ...

# 提交更改
git add .
git commit -m "feat: 添加新功能"

# 推送到遠程
git push origin feature/your-feature-name
```

### 2. 代碼規範
- 使用 TypeScript 強類型
- 組件用 PascalCase
- 函數用 camelCase
- 常量用 UPPER_SNAKE_CASE

### 3. 提交規範
- `feat:` 新功能
- `fix:` 修復bug
- `docs:` 文檔更新
- `style:` 代碼格式
- `refactor:` 重構
- `test:` 測試
- `chore:` 雜項

## 常見問題

### Q: 如何連接到 Supabase？
A: 確保 `.env.local` 中嘅 Supabase URL 同 ANON KEY 正確。

### Q: 打印功能唔工作？
A: 檢查瀏覽器打印設置，確保已連接打印機。

### Q: API 請求失敗？
A: 檢查網絡連接同 Supabase 服務狀態。

### Q: 如何添加新嘅小部件？
A: 參考 `docs/fn_admin_panel.md` 中嘅小部件開發指南。

## 獲取幫助

### 文檔資源
- 功能文檔: `/docs/fn_*.md`
- 技術文檔: `/docs/*_library.md`
- 改進計劃: `/docs/improvementplan-*.md`

### 社區支援
- GitHub Issues: 報告問題
- Discussions: 討論功能
- Wiki: 詳細指南

### 專業支援
- Email: support@newpennine.com
- 緊急熱線: +852-1234-5678

## 下一步

1. **探索功能**: 試用各個模組功能
2. **閱讀文檔**: 深入了解系統架構
3. **參與貢獻**: 提交改進建議
4. **加入社區**: 與其他開發者交流

---

*祝你開發愉快！🚀*