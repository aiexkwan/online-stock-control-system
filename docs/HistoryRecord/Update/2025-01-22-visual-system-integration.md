# Visual System Integration Update
**Date**: 2025-01-22
**Author**: System
**Type**: Integration Update

## Summary
整合統一視覺系統與現有 DynamicActionBar 導航組件

## Background
用戶要求建立統一的背景管理系統，包括：
1. 唯一背景：星空背景（WebGL動態效果）
2. 唯一卡片效果：玻璃態效果（backdrop-blur + 半透明）
3. 唯一底部導航欄：除認證頁面外
4. 唯一差異：各頁面container可以有不同的border效果

## Changes Made

### 1. Visual System Core
- ✅ 建立 VisualSystemProvider 統一管理視覺效果
- ✅ 實現 UnifiedBackground（WebGL單例星空背景）
- ✅ 創建 GlassmorphicCard 系列組件
- ✅ 實現 BorderEffects 容器邊框效果

### 2. Navigation Integration
- ✅ 確認系統已有 DynamicActionBar 智能底部導航欄
- ✅ 移除多餘的 SmartBottomNav 組件
- ✅ 更新配置使用現有導航組件

### 3. Performance Optimization
- ✅ WebGL單例管理避免多context問題
- ✅ 自動性能檢測和降級
- ✅ 頁面不可見時暫停渲染

## Current Status

### 已完成
1. **統一背景系統**
   - StarfieldBackground WebGL效果
   - 全局應用於所有頁面
   - 性能優化和自動降級

2. **玻璃態效果組件**
   - GlassCard（標準）
   - StrongGlassCard（強效果）
   - LightGlassCard（輕效果）

3. **邊框效果系統**
   - BorderContainer（4種預設）
   - 特殊效果（PulseBorder、NeonBorder）

### 待整合
1. **DynamicActionBar 全局應用**
   - 需要在根布局或 ClientVisualSystemProvider 中加入
   - 根據路徑自動顯示/隱藏（認證頁面除外）

2. **頁面遷移**
   - 逐步將現有頁面遷移到新的視覺系統
   - 統一使用 GlassmorphicCard 替換現有卡片

## Next Steps

### Phase 1: 完成導航整合
```tsx
// 在 ClientVisualSystemProvider 中加入
import { DynamicActionBar } from '@/components/ui/dynamic-action-bar';

// 根據配置決定是否顯示
const shouldShowNav = !hiddenPaths.includes(pathname);
```

### Phase 2: 頁面遷移計劃
1. Admin 頁面系列
2. 功能頁面（stock-transfer等）
3. 其他頁面

### Phase 3: 移除舊樣式
- 清理舊的背景色定義
- 統一卡片樣式
- 移除重複的玻璃態效果

## Usage Example

```tsx
// 頁面使用範例
import { GlassCard, BorderContainer } from '@/app/components/visual-system';

export default function MyPage() {
  return (
    <div className="p-8">
      <GlassCard className="mb-6">
        <h1>Page Title</h1>
      </GlassCard>
      
      <BorderContainer variant="glow">
        <p>Content with glow border</p>
      </BorderContainer>
    </div>
  );
}
```

## Notes
- DynamicActionBar 已具備完整功能，無需重新開發
- 保持現有功能不變，只做視覺統一
- 優先考慮性能和用戶體驗