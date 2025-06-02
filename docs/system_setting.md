# 系統設定與風格指南

## 概述

本文件旨在描述 Pennine Industries 庫存控制系統的整體系統風格、主要佈局、導航機制以及通用的使用者介面 (UI) 和使用者體驗 (UX) 原則。這些設計旨在提供一個統一、現代且高效的操作環境。

## 1. 整體佈局與導航 (`docs/globalLayout.md`)

### 1.1. 核心佈局組件
-   **`RootLayout` (`app/layout.tsx`)**: 應用程式的根佈局，設定全局 HTML 結構和基本樣式。
-   **`ClientLayout` (`app/components/ClientLayout.tsx`)**: 主要的佈局管理器，負責：
    -   條件渲染 `GlobalHeader`。
    -   整合認證檢查 (`AuthChecker`) 和狀態同步 (`AuthStateSync`, `AuthMeta`)。
    -   根據路由路徑管理是否顯示全局導航。
    -   為頁面內容提供統一的間距 (`pt-24`，以適配增高後的 `GlobalHeader`)。
-   **`GlobalHeader` (`components/GlobalHeader.tsx`)**: 常駐頂部的全局導航欄。
    -   **適用範圍**: 除登入相關頁面 (`/main-login/*`, `/new-password`, `/`) 外的所有頁面。
    -   **固定定位**: `fixed top-0 left-0 right-0 z-40`。
    -   **增強高度**: `h-24` (約 96px)。
    -   **深色主題**: 背景色為 `bg-[#23263a]` (一種深藍灰色)。

### 1.2. 全局導航欄 (`GlobalHeader`) 詳細設計
-   **三段式佈局**:
    -   **左側 - 功能選單**:
        -   使用懸浮式漢堡選單 (滑鼠懸停於 `Bars3Icon` 上即展開，無需點擊)。
        -   圖示尺寸增大 (`h-7 w-7`)。
        -   下拉選單背景為白色，提供清晰的功能項列表，每個項目包含圖示、標題、描述和連結路徑。
        -   主要導航項目包括：
            -   Home (`/home`)
            -   Print Labels (`/print-label`)
            -   Print GRN Labels (`/print-grnlabel`)
            -   Stock Transfer (`/stock-transfer`)
            -   Admin Panel (`/admin`)
    -   **中央 - 標題區**:
        -   顯示動態問候語 (例如 "Good Morning")。
        -   顯示使用者名稱 (例如 "Welcome, Matthew")。
        -   文字樣式增大，可能帶有漸層效果。
    -   **右側 - 登出功能**:
        -   一個風格化的登出按鈕 (紅色主題)，包含圖示和文字。
        -   點擊後執行 Supabase 登出，清除本地認證數據，並跳轉到 `/main-login`。

### 1.3. 管理員面板專屬導航 (`docs/adminPanel.md`)
-   位於 `/admin` 頁面，在 `GlobalHeader` 下方。
-   **透明背景設計**，與頁面內容融為一體，緊貼 `GlobalHeader`。
-   **懸浮式子功能選單**: 滑鼠懸停在主導航項 (如 "Export Reports", "User Management") 上時，自動展開子選單，無需點擊。
-   移除了多餘的 "Admin Panel" 標題和圖示，追求簡潔。

## 2. 通用 UI 設計風格與原則

### 2.1. 主題與配色
-   **主導主題**: 現代化的深色主題。
    -   背景: 通常為深灰 (`bg-gray-900`) 或深藍灰 (`bg-[#23263a]`, `bg-slate-900`)。
    -   卡片/容器: 比背景略淺的深灰色 (`bg-gray-800`, `bg-slate-800/40`)，常帶有邊框 (`border-gray-600`, `border-slate-700/50`)。
-   **強調色**:
    -   **藍色系**: 主要的互動元素、標題、圖示等常使用藍色 (`text-blue-400`, `border-blue-400`) 或藍色漸層 (如 `blue-500` 到 `cyan-500`)。這是查看歷史 (`View History`)、庫存轉移 (`Stock Transfer`) 等功能的主題色。
    -   **橙色系**: 在特定功能區塊 (如 GRN 相關頁面 `/print-grnlabel`) 作為強調色，如橙色漸層 (`orange-500` 到 `amber-500`) 用於按鈕、圖示和裝飾元素。
    -   **紅色系**: 用於警示或關鍵操作 (如作廢棧板 `/void-pallet` 的主題色，登出按鈕)。
    -   **翠綠色**: 可能用於 Admin Panel 中 "Export All Data" 等特定功能的視覺區分。
-   **文字顏色**: 主要為白色 (`text-white`)，次要文字或描述性文字為淺灰色 (`text-gray-300`, `text-slate-200/300/400`)。

### 2.2. 視覺效果
-   **玻璃擬態 (Glassmorphism)**: 廣泛應用於卡片、對話框等元素。
    -   半透明背景 (例如 `bg-slate-800/40`)。
    -   背景模糊效果 (`backdrop-blur-xl`)。
-   **漸層設計**: 用於背景 (如主頁面背景 `bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800`)、按鈕、圖示和文字。
-   **光效與陰影**:
    -   懸停 (hover) 和聚焦 (focus) 狀態常伴有邊框光效、內部光暈或陰影變化。
    -   卡片和按鈕常帶有陰影 (`shadow-xl`, `shadow-2xl`)，且陰影顏色可能與主題色匹配 (如 `shadow-blue-500/25`, `shadow-orange-500/25`)。
-   **動畫元素**:
    -   背景中可能包含動態漸層球體 (`animate-pulse`)。
    -   按鈕在懸停時有縮放動畫 (`hover:scale-[1.02]`)。
    -   狀態轉換和元件顯隱採用平滑過渡動畫。
-   **網格背景紋理**: 微妙的網格紋理增加頁面深度感和科技感。

### 2.3. 組件風格
-   **卡片 (`Card`, `ResponsiveCard`)**:
    -   圓角 (`rounded-xl`, `rounded-2xl`)。
    -   採用玻璃擬態效果。
    -   常有特定的主題色邊框或標題。
    -   `ResponsiveCard` 組件支援在標題右側添加額外操作/圖示 (如 `FloatingInstructions`)。
-   **按鈕 (`Button`)**:
    -   漸層背景，顏色根據功能主題變化。
    -   懸停時有顏色變化、縮放和光效。
    -   載入狀態時，按鈕內顯示旋轉動畫指示器。
-   **輸入欄位 (`Input`, `EnhancedInput`, `EnhancedSelect`)**:
    -   現代化圓角設計 (`rounded-xl`)。
    -   半透明背景。
    -   邊框在懸停和聚焦時有顏色和光效變化 (通常匹配主題強調色)。
    -   輸入框內左側可能帶有圖示。
-   **對話框 (`Dialog`)**:
    -   多用於 Admin Panel 中的功能 (如 Void Pallet, View History, Upload Files, Export Reports 的參數選擇)。
    -   通常採用與主頁面一致的深色主題和玻璃擬態效果。
    -   設計為在當前頁面彈出，避免頁面跳轉，提升流暢性。
    -   響應式設計，適應不同螢幕尺寸，內容過長時可滾動。
-   **進度條 (`EnhancedProgressBar`) (`docs/progressBarDesign.md`)**:
    -   統一用於顯示 PDF 生成等耗時操作的進度。
    -   背景深灰色 (`bg-gray-700`)。
    -   進度條顏色根據狀態變化 (藍色-處理中, 綠色-成功, 紅色-失敗)。
    -   包含標題、百分比、項目詳情等。
    -   響應式設計，在移動設備上可能採用更緊湊的 (`compact`) 顯示模式。
-   **懸浮式操作指南 (`FloatingInstructions`) (`docs/floatingInstructions.md`)**:
    -   統一應用於 `/print-label`, `/print-grnlabel`, `/stock-transfer` 等頁面的主要操作卡片右上角。
    -   平常只顯示一個小型圓形資訊圖示按鈕。
    -   滑鼠懸停在圖示上時，自動展開懸浮面板顯示詳細的操作步驟說明。
    -   面板背景為毛玻璃效果，內容包含標題和分步驟的描述。

## 3. 登入與認證 (`docs/mainLogin.md`)

-   **主登入頁面 (`/main-login`)**:
    -   系統的主要入口。
    -   深色主題，卡片式佈局。
    -   包含登入表單、註冊連結 (`/main-login/register`)、密碼重設連結 (`/main-login/reset`)。
-   **域名限制**: 只允許 `@pennineindustries.com` 郵箱後綴的使用者註冊和登入。
-   **認證機制**: 整合 Supabase Auth。
    -   `UnifiedAuth` 類提供不同安全模式的認證。
    -   `SecureStorage` 類用於安全地在本地存儲認證相關資訊 (帶有過期時間和域名驗證)。
-   **電郵確認**: 新用戶註冊後需要通過郵件中的連結確認帳戶。確認後跳轉回 `/main-login?confirmed=true` 並顯示成功提示。
-   **登入後跳轉**: 成功登入後，通常跳轉到 `/access` 頁面，該頁面在短暫倒計時後自動重定向到主操作界面，如 `/home` (原 `/dashboard/access`)。
-   **路由保護**:
    -   `middleware.ts` 負責路由保護。
    -   除 `/main-login`, `/new-password` (密碼重設確認頁) 及 `/api/*` 路由外，其他頁面均需要認證。
    -   未認證訪問受保護頁面會被重定向到 `/main-login`。

## 4. Admin Panel (`/admin`) (`docs/adminPanel.md`)

-   系統的管理中心，整合管理工具、數據監控和報告功能。
-   採用雙 Header 設計 (全局 `GlobalHeader` + Admin Panel 專屬導航欄)。
-   專屬導航欄為透明背景，懸浮式子選單。
-   **功能模塊**:
    -   **統計卡片**: 顯示今日/近期關鍵操作數據 (如棧板生成、轉移)。
    -   **數據可視化**: 如甜甜圈圖表展示棧板比例，支持時間範圍選擇。
    -   **歷史記錄**: 顯示最近的產品完成歷史和 GRN 接收歷史。
    -   **ACO 訂單進度**: 追蹤未完成的 ACO 訂單。
    -   **庫存快速搜尋**: 按產品代碼查詢庫存分佈。
    -   **管理工具入口**:
        -   Void Pallet (以對話框形式)
        -   View History (以對話框形式)
        -   Product Update (`/products`)
        -   Access Update (`/users`)
        -   Export Reports (包含 ACO, GRN, Transaction Report 的觸發點，以對話框形式選擇參數)
        -   Upload Files (以對話框形式)
        -   Export All Data (以對話框形式選擇表格和日期)

## 5. 主頁面 (`/home`) (`docs/dashboard.md`)

-   原路徑為 `/dashboard/access`，現已改為 `/home`。
-   用戶登入後的主要概覽頁面。
-   **核心功能**: History Log 卡片，顯示系統最近的操作歷史記錄。
    -   顯示最近 30 條，最多可滾動查看 150 條。
    -   數據來源為 `record_history`，並關聯 `record_palletinfo` 和 `data_code` 以顯示產品相關資訊。
-   移除舊有的統計卡片和圖表功能 (這些功能已移至 `/admin` Panel)。
-   整合全局 `GlobalHeader`。

## 6. 響應式設計與可訪問性

-   **響應式**: 系統各個主要頁面和組件均考慮了響應式設計，能適應桌面、平板和移動設備。
    -   使用 CSS Grid 和 Flexbox 進行佈局。
    -   在小螢幕上，多欄佈局會自動調整為單欄堆疊或優化顯示。
-   **可訪問性**:
    -   努力確保顏色對比符合 WCAG 標準。
    -   支援鍵盤導航 (Tab 鍵)。
    -   使用語義化 HTML 標籤。
    -   進度條等組件包含 ARIA 標籤。

## 7. 總結與一致性

系統致力於在所有模塊中提供一致的視覺風格和互動模式。深色主題、玻璃擬態、漸層效果以及藍色/橙色等強調色的運用是主要的視覺特點。通過創建可重用的 UI 組件 (如 `ResponsiveCard`, `UnifiedSearch`, `EnhancedProgressBar`, `FloatingInstructions`, 各類對話框) 和統一的佈局策略 (`GlobalHeader`, `ClientLayout`)，確保了系統的整體性和易用性。 