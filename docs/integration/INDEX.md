# 📚 技術指南文檔索引

本索引提供技術指南文檔庫的快速導航。

## 📋 技術文檔清單

| 文檔名稱 | 技術主題 | 文檔類型 | 主要內容 |
|---------|---------|----------|----------|
| [Card架構開發指南.md](./Card架構開發指南.md) | Card 架構開發 | 開發指南 | 完整的Card架構開發指南和最佳實踐 |
| [Card-API-Reference.md](./Card-API-Reference.md) | Card API 參考 | API 文檔 | 所有Card組件的詳細API參考 |
| [FormWidget-遷移技術總結.md](./FormWidget-遷移技術總結.md) | FormWidget 遷移技術總結 | 技術整合總結 | FormWidget系統遷移到Card架構的完整技術實現 |
| [card-component-architecture.md](./card-component-architecture.md) | Card 組件架構 | 架構設計文檔 | Card組件的整體架構設計 |
| [config-resolver-implementation.md](./config-resolver-implementation.md) | Config Resolver 實施 | 技術實施指南 | 配置解析器的實施細節 |
| [configcard-architecture-design.md](./configcard-architecture-design.md) | ConfigCard 架構設計 | 架構設計文檔 | ConfigCard的架構設計方案 |
| [graphql-schema-design.md](./graphql-schema-design.md) | GraphQL Schema 設計 | 技術設計文檔 | GraphQL Schema的設計規範 |
| [listcard-graphql-integration.md](./listcard-graphql-integration.md) | ListCard GraphQL 整合 | 整合指南 | ListCard與GraphQL的整合方案 |
| [rest-graphql-coexistence-guide.md](./rest-graphql-coexistence-guide.md) | REST-GraphQL 共存指南 | 技術指南 | REST API與GraphQL共存策略 |
| [searchcard-architecture-design.md](./searchcard-architecture-design.md) | SearchCard 架構設計 | 架構設計文檔 | SearchCard的架構設計方案 |
| [searchcard-comprehensive-analysis.md](./searchcard-comprehensive-analysis.md) | SearchCard 綜合分析 | 技術分析報告 | SearchCard的全面技術分析 |
| [GraphQL-First-Development-Guide.md](./GraphQL-First-Development-Guide.md) | GraphQL-First 開發指南 | 開發指南 | GraphQL優先開發策略和最佳實踐 |
| [GraphQL-Migration-Guide.md](./GraphQL-Migration-Guide.md) | GraphQL 遷移指南 | 遷移指南 | REST API到GraphQL的完整遷移指南 |
| [Single-Query-Pattern-Guide.md](./Single-Query-Pattern-Guide.md) | 單一查詢模式指南 | 技術指南 | GraphQL單一查詢模式的實施指南 |
| [TypeScript-Migration-Guide.md](./TypeScript-Migration-Guide.md) | TypeScript 遷移指南 | 遷移指南 | TypeScript類型系統遷移指南 |

## 📊 文檔分類統計

### 按文檔類型分類
- 架構設計文檔：4個
- 技術指南/總結：5個
- 開發指南：2個
- 遷移指南：3個
- API 文檔：1個
- 整合指南：1個
- 技術分析報告：1個

### 重點技術領域
- **Card 架構體系**（完整開發指南、API參考、各類Card設計）
- **Widget → Card 完全遷移**（Widget Registry 已移除）
- **GraphQL 全面採用**（GraphQL-First開發、遷移指南、單一查詢模式）
- **REST → GraphQL 遷移**（共存策略、遷移指南）
- **TypeScript 類型系統**（遷移指南、最佳實踐）
- 配置解析器實施

## 📌 格式說明
- 大部分文檔採用技術指南或設計文檔格式
- 部分文檔可能不完全符合README中定義的技術報告範本
- 這些文檔更側重於技術實施細節和架構設計

## 🔍 使用建議
1. **新開發者入門**：先閱讀 Card架構開發指南.md 和 GraphQL-First-Development-Guide.md
2. **API 查詢**：參考 Card-API-Reference.md
3. **架構理解**：查閱各Card的架構設計文檔
4. **GraphQL整合**：
   - 新開發：GraphQL-First-Development-Guide.md
   - 遷移：GraphQL-Migration-Guide.md
   - 查詢模式：Single-Query-Pattern-Guide.md
5. **遷移經驗**：
   - FormWidget → Card：FormWidget-遷移技術總結.md
   - REST → GraphQL：GraphQL-Migration-Guide.md
   - TypeScript：TypeScript-Migration-Guide.md

## ⚠️ 重要提醒
- Widget Registry 系統已完全移除
- 所有新開發應使用 Card 架構
- 不要再使用任何 Widget 相關的導入或配置
- 新功能開發必須採用 GraphQL-First 策略
- REST API 僅用於維護現有功能

---
**索引更新日期**: 2025-07-28