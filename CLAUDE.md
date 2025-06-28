# Claude 專案設定

## 語言設定
永遠使用廣東話回答所有問題。

## 專案概述
NewPennine 倉庫管理系統 - 基於 Next.js、TypeScript 同 Supabase 嘅現代化 WMS。

## 技術棧
- **前端**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **後端**: Supabase (PostgreSQL)
- **UI 組件**: shadcn/ui, Radix UI
- **圖表**: Recharts
- **儀表板**: Gridstack.js, react-grid-layout (有衝突)

## 主要功能模組
1. **庫存管理**: 棧板追蹤、位置管理、庫存水平
2. **訂單處理**: ACO 訂單、客戶訂單、裝載管理
3. **報表系統**: 多種報表同分析工具
4. **管理儀表板**: 可定制嘅 widget 系統
5. **用戶管理**: 基於角色嘅訪問控制

## 重要文件位置
- `/app/` - Next.js 應用主目錄
- `/lib/` - 共享工具同類型定義
- `/components/` - 可重用 UI 組件
- `/docs/` - 項目文檔

## 開發規範
1. 使用 TypeScript 嚴格模式
2. 遵循 Next.js App Router 架構
3. 使用 Tailwind CSS 做樣式
4. 保持組件模組化同可重用
5. 實施適當嘅錯誤處理同加載狀態

## 性能優化重點
- 實施緩存策略（TTL: 5分鐘）
- 使用樂觀 UI 更新
- 預加載常用數據
- 批量操作優化

## 當前改進計劃
- 管理儀表板：解決三個網格系統衝突
- 庫存轉移：實施計時器模式同簡化批量轉移
- ~~Ask Me Anything：修復硬編碼 API 密鑰~~ ✅ (2025-06-27)
- 打印系統：增加打印隊列管理
- 庫存盤點：增加離線支持同 RFID 整合

## 最近完成嘅改進 (2025-06-27)
- ✅ 導航系統性能優化（預加載、緩存、虛擬化渲染）
- ✅ 實施混合儲存方案（內存 + localStorage + 數據庫）
- ✅ 添加 Quick Access 快速訪問功能
- ✅ 添加 Smart Reminder 智能提醒功能
- ✅ 修復 API 密鑰安全問題

## 測試同部署
- 本地開發：`npm run dev`
- 類型檢查：`npm run typecheck`
- 代碼檢查：`npm run lint`
- 構建：`npm run build`

## 注意事項
- 避免創建不必要嘅文件
- 優先編輯現有文件而非創建新文件
- 只在用戶明確要求時創建文檔文件
- 運行 lint 同 typecheck 確保代碼質量