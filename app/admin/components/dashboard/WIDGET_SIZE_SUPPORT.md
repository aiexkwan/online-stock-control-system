# Widget 尺寸支援列表

## 尺寸定義
- **1×1 (Small)**: 最小尺寸，適合簡單統計
- **3×3 (Medium)**: 中等尺寸，標準功能
- **5×5 (Large)**: 大尺寸，完整功能包括圖表
- **6×6 (XLarge)**: 超大尺寸，擴展功能

## Widget 支援情況

### 僅支援特定尺寸的 Widgets

| Widget | 支援尺寸 | 說明 |
|--------|---------|------|
| **Ask Database** | 6×6 only | 需要完整的對話介面空間 |
| **View History** | 5×5 only | Pallet History 搜尋需要大空間 |
| **Database Update** | 3×3 only | System Update 功能適合中等尺寸 |

### 不支援 Small (1×1) 的 Widgets

| Widget | 支援尺寸 | 說明 |
|--------|---------|------|
| **Inventory Search** | 3×3, 5×5 | 搜尋介面需要較大空間 |
| **Recent Activity** | 3×3, 5×5 | 活動列表需要空間顯示 |
| **Product Mix Chart** | 3×3, 5×5 | 圖表需要較大空間 |
| **Document Upload** | 3×3, 5×5 | 上傳介面需要空間 |
| **Report Center** | 3×3, 5×5 | 報表列表需要空間 |

### 支援 Medium 和 Large 的 Widgets

| Widget | 支援尺寸 | 說明 |
|--------|---------|------|
| **Finished Product** | 3×3, 5×5 | 生產數據顯示 |
| **Material Received** | 3×3, 5×5 | 物料接收數據 |
| **ACO Order Progress** | 3×3, 5×5 | 訂單進度追蹤 |
| **Void Pallet** | 3×3, 5×5 | 作廢功能 |

### 支援所有尺寸的 Widgets

| Widget | 支援尺寸 | 說明 |
|--------|---------|------|
| **Output Stats** | 1×1, 3×3, 5×5 | 產出統計，自適應顯示 |
| **Booked Out Stats** | 1×1, 3×3, 5×5 | Stock Transfer 統計 |
| **Void Stats** | 1×1, 3×3, 5×5 | 作廢統計 |

## 尺寸選擇器行為

當選擇不支援的尺寸時：
- 選項顯示為 "(N/A)"
- 選項被禁用（disabled）
- 無法選擇該尺寸

## 開發指引

1. 新增 Widget 時，必須在 `WidgetSizeConfig.ts` 的 `isWidgetSizeSupported` 函數中定義支援的尺寸
2. Widget 組件內部應檢查尺寸並提供適當的錯誤提示
3. 使用 `WidgetSizeSelector` 組件時會自動處理不支援的尺寸顯示