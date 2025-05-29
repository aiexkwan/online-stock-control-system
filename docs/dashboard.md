# Dashboard 優化文檔

## 🎯 **優化目標**
將舊有 `/dashboard` 頁面的功能完全遷移到 `/dashboard/access`，並進行現代化改造。

## 📋 **現狀分析**

### 舊 Dashboard 功能組件
1. **PalletDonutChart** - 甜甜圈圖表顯示棧板統計
2. **PrintHistory** - 列印歷史表格（可滾動載入）
3. **GrnHistory** - GRN 歷史表格（可滾動載入）
4. **統計數據** - 每日完成棧板數和轉移棧板數

### 發現的問題
1. **自定義 Auth 系統**：
   - 使用 `getLoggedInClockNumber()`, `storeClockNumberLocally()` 
   - 複雜的 auth 檢查邏輯和 watchdog timer
   - 需要改為純 Supabase Auth

2. **設計問題**：
   - 舊式的深色主題設計
   - 缺乏現代化的 UI 元素
   - 用戶體驗不夠友好

3. **代碼結構**：
   - 複雜的初始化邏輯（約 150 行）
   - 混合了 auth 和業務邏輯

## 🔧 **優化計劃**

### 階段 1: 組件分析和準備
- [x] 分析現有組件結構
- [x] 識別 API 和 Auth 問題
- [x] 檢查組件依賴關係

### 階段 2: 創建現代化 Dashboard ✅ **已完成**
- [x] 設計新的 UI 布局
- [x] 重構 Auth 邏輯使用純 Supabase
- [x] 整合核心組件
- [x] 添加響應式設計
- [x] 設置舊頁面重定向

### 階段 3: 組件優化 ✅ **已完成**
- [x] 優化 PalletDonutChart 設計
- [x] 改進 PrintHistory 和 GrnHistory 表格
- [x] 添加載入狀態和錯誤處理
- [x] 實施更好的數據可視化

### 階段 4: 清理和測試
- [x] 設置舊 dashboard 頁面重定向
- [ ] 更新路由重定向（其他位置）
- [ ] 測試所有功能
- [ ] 驗證 Auth 流程

## 📚 **技術決策**

### Auth 架構
- **移除**: 自定義 localStorage auth
- **採用**: 純 Supabase Auth with RLS
- **實施**: `createClient()` + `auth.getUser()`

### UI 設計方針
- **主題**: 現代化深色主題
- **布局**: Grid 響應式布局
- **組件**: Shadcn/ui + Tailwind CSS
- **動畫**: Framer Motion 微動畫

### 數據管理
- **API**: 統一使用客戶端 Supabase
- **錯誤處理**: 統一錯誤邊界
- **載入狀態**: Skeleton 載入動畫

## ✨ **新 Dashboard 特色功能**

### 現代化設計
- **漸層背景**: `bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900`
- **透明卡片**: `bg-slate-800/50 border-slate-700 backdrop-blur-sm`
- **平滑動畫**: Framer Motion staggered animations
- **響應式布局**: 移動端友好的 grid 系統

### 增強的統計顯示
- **4個統計卡片**：
  1. 今日生成棧板數
  2. 今日轉移棧板數
  3. 本週生成棧板數
  4. 轉移效率百分比
- **圖標化顯示**: 使用 Heroicons 提升視覺效果
- **載入狀態**: Skeleton 組件提供更好的載入體驗

### 純 Supabase Auth 架構
- **會話檢查**: `supabase.auth.getSession()`
- **用戶驗證**: `supabase.auth.getUser()`
- **自動重定向**: 無效會話自動跳轉登入
- **狀態監聽**: `onAuthStateChange` 監聽登出事件

### 組件整合
- **PalletDonutChart**: 保持原功能，加強視覺設計
- **PrintHistory**: 嵌入到現代化卡片中
- **GrnHistory**: 嵌入到現代化卡片中
- **統計數據**: 重構為更直觀的卡片展示

## 🔧 **技術實現細節**

### 核心架構改變
```typescript
// 舊系統 (已移除)
- getLoggedInClockNumber()
- storeClockNumberLocally() 
- clearLocalClockNumber()
- 複雜的 watchdog timer

// 新系統
+ useEffect(() => initializeAuth(), [])
+ supabase.auth.getSession()
+ supabase.auth.getUser()
+ 簡潔的錯誤處理
```

### UI 組件升級
```typescript
// 新增組件
+ Badge - 用戶時鐘號碼顯示
+ Skeleton - 載入狀態
+ Card/CardHeader/CardContent - 統一卡片設計
+ motion/AnimatePresence - 動畫效果
```

### 數據結構優化
```typescript
interface DashboardStats {
  dailyDonePallets: number;
  dailyTransferredPallets: number;
  weeklyDonePallets: number;
  weeklyTransferredPallets: number;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  clockNumber: string;
}
```

## 📝 **更新日誌**

### 2024-12-29

#### 🚀 階段 2 完成 - 現代化 Dashboard 創建
- **完全重寫** `/dashboard/access/page.tsx`
- **移除自定義 Auth**: 改用純 Supabase Auth 系統
- **現代化 UI**: 使用 gradient 背景、透明卡片、動畫效果
- **響應式設計**: 支援移動端和桌面端
- **增強統計**: 新增週統計和轉移效率指標
- **組件整合**: 成功整合 PalletDonutChart, PrintHistory, GrnHistory
- **舊頁面重定向**: `/dashboard` 自動重定向到 `/dashboard/access`

#### 🔧 技術改進
- **程式碼減少**: 從 375 行縮減到約 300 行，移除複雜邏輯
- **依賴簡化**: 移除自定義 auth 工具，統一使用 Supabase
- **用戶體驗**: 加入載入動畫、錯誤處理、友好的重定向
- **維護性**: 代碼結構更清晰，職責分離更明確

#### 🚀 階段 3 完成 - 組件優化與現代化
- **PalletDonutChart 重新設計**：
  - 添加動畫效果和 hover 互動
  - 漸層色彩和陰影效果
  - 智能顏色編碼（績效基礎）
  - 載入狀態支援
  - 增強 tooltip 顯示更多資訊

- **PrintHistory 完全重構**：
  - 現代化表格設計與動畫
  - Skeleton 載入效果
  - 完整錯誤處理和重試機制
  - 空狀態處理
  - 更好的視覺設計（代碼高亮、badge）

- **GrnHistory 完全重構**：
  - 與 PrintHistory 一致的設計語言
  - 客戶端分組和分頁邏輯優化
  - 動畫和視覺效果
  - 錯誤邊界和空狀態

#### 🎨 設計改進
- **統一的設計語言**：所有組件使用一致的顏色系統和動畫
- **響應式載入狀態**：從簡單 spinner 升級為 Skeleton 組件
- **錯誤處理**：友好的錯誤訊息和重試機制
- **空狀態**：當沒有數據時提供有意義的提示

#### 🔧 技術提升
- **性能優化**：減少 API 調用，客戶端快取
- **用戶體驗**：平滑動畫和即時反饋
- **可訪問性**：更好的圖標和語義化 HTML
- **維護性**：統一的錯誤處理模式

#### 📊 功能對比總表

| 功能 | 舊 Dashboard | 新 Dashboard | 狀態 |
|------|-------------|-------------|------|
| 用戶認證 | 自定義 localStorage | 純 Supabase Auth | ✅ 改進 |
| 統計卡片 | 2個基礎卡片 | 4個增強卡片 | ✅ 增強 |
| 動畫效果 | 無 | Framer Motion | ✅ 新增 |
| 載入狀態 | 基礎 spinner | Skeleton 組件 | ✅ 改進 |
| 響應式設計 | 基礎 | 完整移動端支援 | ✅ 增強 |
| 錯誤處理 | 基礎 toast | 完整錯誤頁面 | ✅ 改進 |
| 圖表組件 | 基礎甜甜圈圖 | 動畫漸層圖表 | ✅ 增強 |
| 表格組件 | 簡單表格 | 現代化動畫表格 | ✅ 增強 |
| 程式碼量 | 375 行 | ~300 行 | ✅ 簡化 |

### 📈 統計數據計算邏輯更新 (2024-12-29)

**新的計算邏輯符合業務需求：**

#### Today's Generated
- **數據來源**: `record_palletinfo` 表
- **篩選條件**: `generate_time` = 當天日期
- **計算方式**: 計算所有當天生成的棧板數量

#### Today's Transferred
- **數據來源**: `record_palletinfo` + `record_transfer` 表
- **計算邏輯**: 
  1. 從 `record_palletinfo` 找出當天生成的所有 `plt_num`
  2. 在 `record_transfer` 中查找這些棧板的 `plt_num` 欄位
  3. 統計出現在 `record_transfer` 中的棧板數量（即已轉移）
  4. 使用 Set 去重確保棧板號碼唯一性

#### Past 3 days Generated (原 "This Week")
- **數據來源**: `record_palletinfo` 表
- **篩選條件**: `generate_time` = 過去3天
- **計算方式**: 計算過去3天內生成的棧板總數

#### Past 3 days Transfer Rate (原 "Transfer Rate")
- **數據來源**: `record_palletinfo` + `record_transfer` 表
- **計算邏輯**: 
  1. 從 `record_palletinfo` 找出過去3天生成的所有 `plt_num`
  2. 在 `record_transfer` 中查找這些棧板的 `plt_num` 欄位
  3. 統計出現在 `record_transfer` 中的棧板數量（即已轉移）
  4. 計算轉移率：(已轉移棧板數 / 總生成棧板數) × 100%

#### 圖表組件更新
- **PalletDonutChart**: 現在顯示過去3天的數據而非每日數據
- **標題更新**: "Daily Overview" → "Past 3 Days Overview"
- **中心文字**: "Transfer Rate" → "Past 3 Days Rate"
- **Tooltip**: "Daily Performance" → "Past 3 Days Performance"

---

**目前狀態**: ✅ **階段 3 完成 + 統計邏輯更新完成**  
**下一步**: 開始階段 4 - 清理和測試

## 🐛 **Bug 修正記錄**

### 2024-12-29 - 資料庫欄位名稱修正
- **問題**: `record_history.pallet_num does not exist` 錯誤
- **原因**: 使用了錯誤的欄位名稱 `pallet_num`
- **修正**: 根據 `docs/databaseStructure.md`，正確欄位名稱為 `plt_num`
- **影響範圍**: Today's Transferred 和 Past 3 days Transfer Rate 計算
- **狀態**: ✅ 已修正

### 2024-12-29 - 轉移狀態檢查邏輯更新
- **變更**: 轉移狀態檢查從 `record_history` 改為 `record_transfer` 表
- **新邏輯**: 棧板號碼如果出現在 `record_transfer` 中，表示已轉移
- **原邏輯**: 檢查 `record_history` 中 `loc` 欄位是否不等於 'await'
- **影響範圍**: Today's Transferred 和 Past 3 days Transfer Rate 計算
- **狀態**: ✅ 已更新

### 2024-12-29 - Finished Product 組件重構
- **變更**: PrintHistory 組件完全重構為 FinishedProduct
- **新功能**: 
  - 時間範圍選擇器 (Today, Yesterday, Past 3 days, Past 7 days)
  - 按產品代碼分組統計 (Product Code, TTL Qty, TTL Pallet)
  - 動態數據統計標籤 (總產品數、總棧板數、總數量)
  - 響應式下拉選單動畫
- **數據來源**: `record_palletinfo` 表，按 `product_code` 分組統計
- **UI 改進**: 
  - 新增時間篩選下拉選單
  - 表格列改為 Product Code, TTL Qty, TTL Pallet
  - 數量格式化顯示 (千分位分隔符)
  - 按總數量排序顯示
- **狀態**: ✅ 已完成

### 2024-12-29 - Dashboard 全面優化更新
- **Finished Product 數據篩選**: 
  - 排除 `plt_remark` 包含 "Material GRN-" 的記錄
  - 確保只顯示成品生產數據

- **Material Received 組件重構**:
  - GrnHistory → MaterialReceived 組件
  - 查詢包含 "Material GRN-" 的 `record_palletinfo` 記錄
  - 添加時間範圍選擇器 (Today, Yesterday, Past 3 days, Past 7 days)
  - 按材料代碼分組統計 (Material Code, TTL Qty, TTL Pallet)
  - 使用橙色和綠色配色區分材料收貨數據

- **PalletDonutChart 增強**:
  - 添加時間範圍選擇器功能
  - 將 Generated/Transferred 統計移至圖表右側
  - 圖表尺寸優化 (200px → 160px)
  - 動態卡片標題反映所選時間範圍

- **UI/UX 改進**:
  - 隱藏 Finished Product 和 Material Received 卡片標題
  - 統一的時間範圍選擇器設計語言
  - 三個組件的一致性動畫和互動效果
  - 點擊外部關閉下拉選單功能

- **組件架構優化**:
  - 統一的 TimeRange 類型定義
  - 一致的錯誤處理和載入狀態
  - 優化的數據分組和排序邏輯

- **狀態**: ✅ 已完成

### 2024-12-29 - Dashboard 統計篩選和用戶界面重構
- **統計數據篩選優化**:
  - Dashboard 所有統計數據現在排除包含 "Material GRN-" 的記錄
  - Today's Generated、Today's Transferred、Past 3 days Generated、Past 3 days Transfer Rate 都使用一致的篩選邏輯
  - 確保成品生產統計和材料收貨統計完全分離

- **用戶界面重構**:
  - 將左側導航欄的 LogOut 按鈕移至 Dashboard 右上方
  - 添加用戶信息顯示區域，包含：
    - 用戶真實姓名（從 `data_id` 表按 email 獲取）
    - 用戶 email 地址
    - 下拉選單式的 logout 功能
  - 現代化的用戶選單設計，支援動畫效果

- **數據整合優化**:
  - 統一使用 `record_palletinfo.plt_remark NOT ILIKE '%Material GRN-%'` 篩選條件
  - 優化並行查詢，提升統計數據載入性能
  - 增強用戶身份驗證和顯示邏輯

- **技術改進**:
  - 添加 `fetchUserDisplayName` 函數從 `data_id` 表獲取用戶真實姓名
  - 統一的 logout 處理邏輯，包含活動記錄和認證清理
  - 響應式用戶選單設計，支援桌面和移動端
  - 點擊外部關閉用戶選單功能

- **Navigation 組件更新**:
  - 註釋掉左側導航欄的 LogOut 按鈕，避免重複功能
  - 保持原有導航功能完整性

- **狀態**: ✅ 已完成

### 2024-12-29 - Dashboard 界面簡化優化
- **歡迎訊息優化**:
  - 將 "Welcome back • 2025/5/29" 改為 "Welcome back, [用戶名稱]"
  - 移除日期顯示，直接顯示用戶真實姓名
  - 提供更個人化的歡迎體驗

- **頂部界面簡化**:
  - 移除複雜的用戶下拉菜單（包含用戶信息、email、下拉箭頭）
  - 右上角只保留簡潔的紅色 `Logout` 按鈕
  - 提升界面簡潔性和用戶體驗

- **程式碼優化**:
  - 移除用戶菜單相關狀態變數 (`isUserMenuOpen`, `userMenuRef`)
  - 清理不必要的 imports (`UserCircleIcon`)
  - 保留時間範圍選擇器所需功能
  - 簡化 click outside 處理邏輯

- **UI/UX 改進**:
  - 統一的紅色 logout 按鈕設計 (`bg-red-600 hover:bg-red-700`)
  - 更直觀的用戶界面，減少視覺干擾
  - 保持響應式設計和動畫效果

- **狀態**: ✅ 已完成
