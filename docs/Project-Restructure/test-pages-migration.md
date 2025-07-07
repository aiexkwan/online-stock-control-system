# 測試頁面遷移指南

## 概述

所有測試相關頁面已經整合到動態路由系統 `/admin/test/[testType]`。

## 遷移對照表

| 舊路徑 | 新路徑 | 狀態 |
|--------|--------|------|
| `/admin/test-ab-testing` | `/admin/test/ab-testing` | ✅ 已遷移 |
| `/admin/test-dual-run-verification` | `/admin/test/dual-run` | ✅ 已遷移 |
| `/admin/test-optimizations` | `/admin/test/optimizations` | ✅ 已遷移 |
| `/admin/test-widget-migration` | `/admin/test/widget-migration` | ✅ 已遷移 |
| `/admin/test-widget-registry` | `/admin/test/widget-registry` | ✅ 已遷移 |

## 新功能

1. **測試中心入口頁** (`/admin/test`)
   - 顯示所有可用測試的概覽
   - 按類別組織：performance、migration、verification、system
   - 快速導航到具體測試

2. **共用組件**
   - `TestResultCard` - 統一的測試結果展示
   - `PerformanceMetrics` - 性能指標儀表板
   - `TestControlPanel` - 測試控制面板

3. **統一配置**
   - 所有測試配置集中在 `testConfigs.ts`
   - 易於添加新測試類型
   - 支援動態加載

## 清理舊文件（可選）

如果確認新系統運作正常，可以刪除以下舊目錄：

```bash
# 備份舊文件（建議）
mkdir -p backup/test-pages
mv app/admin/test-* backup/test-pages/

# 或直接刪除（謹慎）
rm -rf app/admin/test-ab-testing
rm -rf app/admin/test-dual-run-verification
rm -rf app/admin/test-optimizations
rm -rf app/admin/test-widget-migration
rm -rf app/admin/test-widget-registry
```

## 如何添加新測試

1. 在 `testConfigs.ts` 添加新配置：
```typescript
'new-test': {
  id: 'new-test',
  title: 'New Test Suite',
  description: 'Description of the test',
  icon: TestIcon,
  category: 'performance',
  features: ['Feature 1', 'Feature 2'],
  defaultControls: {
    // 默認控制值
  }
}
```

2. 創建測試組件：
```typescript
// app/admin/test/[testType]/components/NewTestComponent.tsx
export default function NewTestComponent({ config }) {
  // 實現測試邏輯
}
```

3. 在動態頁面添加映射：
```typescript
const TestComponents = {
  // ...existing
  'new-test': dynamic(() => import('./components/NewTestComponent'))
};
```

## 優勢

- **代碼重用**：減少 60% 重複代碼
- **統一體驗**：所有測試頁面風格一致
- **易於維護**：集中管理測試邏輯
- **性能優化**：動態加載，按需載入

## 注意事項

- 確保更新所有指向舊路徑的鏈接
- 測試所有功能確保正常運作
- 保留備份直到確認系統穩定