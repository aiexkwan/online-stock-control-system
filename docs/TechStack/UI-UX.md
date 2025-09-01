# UI/UX 與設計系統

_最後更新日期: 2025-09-01 22:54:59_

## 設計系統

- **組件庫**: [`components/ui/`](../../components/ui/) 52個組件, 基於 [Radix UI](https://www.radix-ui.com/) (16個組件)
- **樣式配置**: [`tailwind.config.js`](../../tailwind.config.js) 自定義主題配置

### 設計理念與實踐指南

- **Radix UI (基礎)**
  - **選用原因**: 我們選擇 Radix UI 作為底層組件庫，主要是看中其**無樣式 (unstyled)** 和**高可訪問性 (accessibility)** 的特性。這讓我們可以完全掌控組件的視覺風格，同時確保所有互動元素都符合 WAI-ARIA 標準，無需從零開始處理複雜的鍵盤交互和焦點管理。
  - **實踐指南**: 在 `components/ui/` 中建立新組件時，應優先尋找對應的 Radix UI 原語 (primitive)，並在其基礎上進行封裝，而不是重新發明輪子。

- **`tailwind.config.js` (核心)**
  - **核心配置**: 該文件定義了整個應用的設計語言，包括顏色 (`primary`, `secondary`, `destructive` 等)、字體、間距和圓角等。
  - **實踐指南**: 所有開發者在編寫樣式時，都**必須**優先使用 `tailwind.config.js` 中已定義的主題值（例如 `bg-primary`, `rounded-lg`），而不是使用硬編碼的魔術數字（例如 `bg-[#FFFFFF]`, `rounded-[10px]`），以確保全站 UI 的一致性。

## 前端架構補充

- **卡片系統**: [`lib/card-system/`](../../lib/card-system/) 10個文件，包括核心 Glassmorphic 組件
- **管理卡片**: 系統共 18個管理卡片，24個總卡片組件
- **視覺特效**: [Framer Motion](https://www.framer.com/motion/) 11.18.2
- **圖標系統**: [Lucide React](https://lucide.dev/) 0.467.0, [Heroicons](https://heroicons.com/) 2.2.0

## 視覺語言

- **核心設計**: Glassmorphic (玻璃擬態)
  - **應用理念**: 我們採用 Glassmorphic 設計來營造一種輕盈、現代的感覺。它通過模糊背景、半透明度和細微的邊框，創造出層次感，常見於卡片（`EnhancedGlassmorphicCard`）和對話框等容器組件上。
  - **實現狀況**: 完整的卡片系統實現，包含主題配置、無障礙顏色和響應式設計

- **互動特效**: Spotlight 效果
  - **應用場景**: 用於吸引用戶對特定互動元素（如按鈕、輸入框）的注意力，提供即時的視覺反饋，提升用戶體驗。
