# Card 架構開發指南

**版本**: 1.0  
**建立日期**: 2025-07-26  
**更新日期**: 2025-07-26  
**狀態**: 🎉 完成

## 📋 概覽

本指南介紹 PennineWMS 系統從 Widget 架構完全遷移到 Card 架構後的開發模式。所有舊的 Widget 系統已被移除，開發者應使用新的 Card 架構進行組件開發。

## 🏗️ Card 架構概述

### 核心概念

Card 架構是一個基於組合的組件系統，提供：
- **統一的接口**：所有 Card 共享一致的 Props 和行為
- **類型安全**：完整的 TypeScript 支援
- **組合式設計**：通過基礎 Card 組合創建複雜功能
- **性能優化**：內建的懶加載和錯誤邊界

### Card 類型層次

```
BaseCard (抽象基礎)
├── BaseOperationCard (操作類)
│   ├── VoidPalletCard
│   ├── DepartmentSelectorOperationCard
│   └── StockTypeSelectorCard
├── BaseUploadCard (上傳類)
│   ├── UploadOrdersCard
│   ├── UploadProductSpecCard
│   └── UploadPhotoCard
├── BaseAnalysisCard (分析類)
│   ├── AcoProgressAnalysisCard
│   ├── ExpandableAnalysisCard
│   └── PagedAnalysisCard
└── SpecialCardKit (特殊功能)
    ├── Folder3DCard
    ├── PerformanceTestCard
    └── SimpleHistoryTreeCard
```

## 🚀 快速開始

### 1. 創建基本 Card

```typescript
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface MyCardProps {
  title?: string;
  description?: string;
  // 其他 props
}

export const MyCard: React.FC<MyCardProps> = ({
  title = 'My Card',
  description = 'Card description',
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* 你的內容 */}
      </CardContent>
    </Card>
  );
};
```

### 2. 使用 BaseOperationCard

```typescript
import { BaseOperationCard } from './BaseOperationCard';

export const MyOperationCard: React.FC = () => {
  const handleAction = async () => {
    // 執行操作
    return { success: true, message: '操作成功' };
  };

  return (
    <BaseOperationCard
      title="我的操作"
      description="執行某個操作"
      operationType="action"
      actionConfig={{
        buttonText: '執行',
        confirmRequired: true,
        confirmMessage: '確定要執行此操作嗎？',
        dangerLevel: 'medium',
      }}
      onAction={handleAction}
    />
  );
};
```

### 3. 使用 BaseUploadCard

```typescript
import { BaseUploadCard } from './BaseUploadCard';

export const MyUploadCard: React.FC = () => {
  const handleUpload = async (files) => {
    // 處理上傳
    console.log('上傳文件:', files);
  };

  return (
    <BaseUploadCard
      title="文件上傳"
      description="上傳您的文件"
      uploadConfig={{
        acceptedTypes: ['.pdf', '.doc'],
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        multiple: true,
      }}
      onUpload={handleUpload}
    />
  );
};
```

## 📐 開發規範

### 1. 命名規範
- Card 組件使用 PascalCase，以 `Card` 結尾
- Props 接口以 `Props` 結尾
- 文件名與組件名一致

### 2. 文件結構
```
components/
  dashboard/
    cards/
      MyCard.tsx          # Card 組件
      MyCard.test.tsx     # 測試文件
      MyCard.stories.tsx  # Storybook 故事
```

### 3. Props 設計原則
- 提供合理的默認值
- 使用 TypeScript 接口定義
- 避免過度配置

### 4. 錯誤處理
- 使用 try-catch 處理異步操作
- 提供用戶友好的錯誤消息
- 記錄錯誤日誌

## 🧪 測試指南

### 單元測試

```typescript
import { render, screen } from '@testing-library/react';
import { MyCard } from './MyCard';

describe('MyCard', () => {
  it('should render with default props', () => {
    render(<MyCard />);
    expect(screen.getByText('My Card')).toBeInTheDocument();
  });
});
```

### E2E 測試

```typescript
test('MyCard functionality', async ({ page }) => {
  await page.goto('/admin/test-my-card');
  await expect(page.locator('[data-testid="my-card"]')).toBeVisible();
});
```

## 🔧 遷移指南

### 從 Widget 遷移到 Card

1. **識別 Widget 類型**
   - Stats → StatsCard
   - Chart → ChartCard
   - List → ListCard
   - Operation → BaseOperationCard
   - Upload → BaseUploadCard

2. **更新 Props**
   ```typescript
   // 舊 Widget
   interface WidgetProps {
     widget: WidgetConfig;
     timeFrame?: TimeFrame;
   }
   
   // 新 Card
   interface CardProps {
     title?: string;
     description?: string;
     // 具體的 props
   }
   ```

3. **更新導入**
   ```typescript
   // 舊
   import { widgetRegistry } from '@/lib/widgets';
   
   // 新
   import { MyCard } from '@/components/dashboard/cards/MyCard';
   ```

## 📊 性能優化

### 1. 懶加載
```typescript
const MyCard = lazy(() => import('./MyCard'));

<Suspense fallback={<CardSkeleton />}>
  <MyCard />
</Suspense>
```

### 2. Memoization
```typescript
export const MyCard = React.memo(({ data }: MyCardProps) => {
  const processedData = useMemo(() => processData(data), [data]);
  // ...
});
```

### 3. 虛擬化長列表
```typescript
import { VirtualList } from '@tanstack/react-virtual';
```

## 🎨 樣式指南

### 使用 Tailwind CSS
```typescript
<Card className="hover:shadow-lg transition-shadow">
  <CardContent className="space-y-4">
    {/* 內容 */}
  </CardContent>
</Card>
```

### 使用 shadcn/ui 組件
```typescript
import { Button, Badge, Alert } from '@/components/ui';
```

## 🚨 常見問題

### Q: Widget Registry 相關錯誤
A: Widget Registry 已被完全移除。請直接導入和使用 Card 組件。

### Q: 如何添加新的 Card？
A: 
1. 在 `/components/dashboard/cards/` 創建新文件
2. 基於適當的 Base Card 實現
3. 在需要的地方直接導入使用

### Q: 如何調試 Card？
A: 
1. 使用 React DevTools
2. 查看瀏覽器控制台
3. 使用 `console.log` 或斷點調試

## 📚 相關文檔

- [系統架構遷移計劃](../planning/系統架構遷移計劃.md)
- [Card 組件 API 文檔](./Card-API-Reference.md)
- [最佳實踐指南](./Card-Best-Practices.md)

## 🔄 版本歷史

- v1.0 (2025-07-26): 初始版本，Widget 系統完全遷移到 Card 架構

---

**注意**: 本文檔會隨著系統演進持續更新。如有問題，請聯繫開發團隊。