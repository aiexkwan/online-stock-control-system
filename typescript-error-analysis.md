## TypeScript 錯誤分析報告

### 錯誤統計
- 總錯誤數：383
- 最常見錯誤類型：
  - TS2339 (Property does not exist): 106個
  - TS2345 (Argument not assignable): 70個
  - TS2367 (Comparison of two values): 57個
  - TS2322 (Type not assignable): 44個
  - TS2307 (Cannot find module): 19個

### 主要錯誤模式

1. **Design System 屬性缺失 (18+ 個錯誤)**
   - 缺少 'gap' 屬性
   - 缺少 'margin' 屬性
   - 缺少顏色屬性如 'destructive', 'primary', 'accent'

2. **Dynamic Import 類型錯誤 (20+ 個錯誤)**
   - Recharts 組件的動態導入類型不兼容
   - defaultProps 類型不匹配

3. **GraphQL 遺留代碼 (10+ 個錯誤)**
   - 'record_inventoryCollection' 等 GraphQL 查詢屬性
   - 'useGetInventoryLocationsQuery' 等 GraphQL hooks

4. **文件錯誤最多**
   - void-pallet/actions.ts: 45個錯誤
   - 圖表組件: 每個約 10-16 個錯誤
