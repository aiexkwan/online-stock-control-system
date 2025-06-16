# Dashboard Cloud Sync 功能說明

## 概述
用戶的儀表板設定現在會自動同步到雲端（Supabase），讓用戶可以在不同設備間無縫使用相同的儀表板配置。

## 資料庫結構

### user_dashboard_settings 表
```sql
- id: UUID (主鍵)
- user_id: UUID (用戶 ID)
- email: TEXT (用戶電郵)
- dashboard_name: TEXT (儀表板名稱，預設為 'custom')
- config: JSONB (儀表板配置)
- is_default: BOOLEAN (是否為預設儀表板)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

## 功能特點

### 1. 自動同步
- 登入用戶的儀表板設定會自動保存到雲端
- 在任何設備登入都能載入相同的儀表板配置

### 2. 離線支援
- 設定會同時保存到本地（localStorage）作為備份
- 網絡連接問題時使用本地設定
- 連接恢復後自動同步

### 3. 遷移支援
- 首次使用時會自動將 localStorage 的設定遷移到雲端
- 遷移成功後會顯示通知

### 4. 安全性
- 使用 Row Level Security (RLS) 確保用戶只能訪問自己的設定
- 支援基於 user_id 或 email 的權限控制

## 使用方式

### 在組件中使用
```typescript
import { useDashboardSettings } from '@/app/hooks/useDashboardSettings';

export function MyDashboard() {
  const { 
    config,        // 當前配置
    loading,       // 載入狀態
    saving,        // 保存狀態
    saveSettings,  // 保存函數
    resetSettings  // 重置函數
  } = useDashboardSettings('custom');

  // 使用配置...
}
```

### 服務層使用
```typescript
import { dashboardSettingsService } from '@/app/services/dashboardSettingsService';

// 獲取設定
const settings = await dashboardSettingsService.getDashboardSettings('custom');

// 保存設定
await dashboardSettingsService.saveDashboardSettings(config, 'custom');
```

## 錯誤處理

1. **網絡錯誤**：自動降級到本地儲存
2. **認證錯誤**：未登入用戶只使用本地儲存
3. **同步失敗**：顯示錯誤通知，但不影響本地使用

## 注意事項

1. 需要用戶登入才能使用雲端同步功能
2. 未登入用戶的設定只保存在本地
3. 首次載入可能需要較長時間（遷移舊數據）
4. 建議定期檢查 `user_dashboard_settings` 表的大小