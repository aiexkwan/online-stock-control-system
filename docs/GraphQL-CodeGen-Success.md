# GraphQL Code Generator 設置成功！

## 完成的配置

### 1. 安裝的依賴
```json
"@graphql-codegen/cli": "^5.0.7",
"@graphql-codegen/schema-ast": "^4.1.0",
"@graphql-codegen/typescript": "^4.1.6",
"@graphql-codegen/typescript-operations": "^4.6.1",
"graphql": "^16.11.0",
"dotenv-cli": "^8.0.0"
```

### 2. 配置文件 (codegen.ts)
```typescript
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: 'lib/graphql/schema.json',
  documents: [
    'lib/graphql/**/*.ts',
    'app/**/*.{ts,tsx}',
    '!**/*.generated.{ts,tsx}',
    '!**/*.test.{ts,tsx}'
  ],
  generates: {
    'lib/graphql/generated/types.ts': {
      plugins: ['typescript', 'typescript-operations'],
      config: {
        scalars: {
          UUID: 'string',
          Datetime: 'string',
          Date: 'string',
          Time: 'string',
          JSON: 'any',
          BigInt: 'number',
          BigFloat: 'number',
          Cursor: 'string',
          Opaque: 'any'
        },
        enumsAsTypes: true,
        skipTypename: true,
        avoidOptionals: false,
        maybeValue: 'T | null'
      }
    }
  }
};

export default config;
```

### 3. NPM Scripts
```json
"codegen": "graphql-codegen --config codegen.ts",
"codegen:watch": "graphql-codegen --config codegen.ts --watch",
"codegen:check": "graphql-codegen --config codegen.ts --check"
```

### 4. Schema 獲取腳本
創建了 `scripts/fetch-graphql-schema.js` 來獲取最新的 GraphQL schema：
```bash
node scripts/fetch-graphql-schema.js
```

## 使用方式

### 1. 獲取最新 Schema
```bash
node scripts/fetch-graphql-schema.js
```

### 2. 生成 TypeScript 類型
```bash
npm run codegen
```

### 3. Watch 模式（開發時）
```bash
npm run codegen:watch
```

### 4. 在組件中使用生成的類型
```typescript
import type { 
  Record_Palletinfo,
  GetProductionStatsQuery,
  GetProductionStatsQueryVariables 
} from '@/lib/graphql/generated/types';

// 使用類型安全的變量
const variables: GetProductionStatsQueryVariables = {
  startDate: startDate.toISOString(),
  endDate: endDate.toISOString()
};
```

## 已解決的問題

1. **依賴衝突**: 
   - 更新了多個過期的 package 版本
   - 移除了不存在的 package

2. **Schema 類型問題**:
   - `timestamptz` → `Datetime`
   - `date` → `Date` 
   - `nilike` → 使用其他過濾方式
   - 移除不支持的字段

3. **生成配置**:
   - 使用 TypeScript 配置文件而非 YAML
   - 配置了正確的 scalar 映射
   - 使用本地 schema.json 文件避免每次查詢

## 下一步

1. **更新現有組件**：
   - 使用生成的類型替換手動定義的類型
   - 確保所有查詢都有對應的類型

2. **創建 Hooks**：
   - 考慮安裝 `@graphql-codegen/typescript-react-apollo` 生成 React hooks
   - 或使用 `@graphql-codegen/typescript-urql` for urql

3. **持續維護**：
   - 定期更新 schema
   - 在 CI/CD 中加入類型檢查

---

**設置日期**: 2025-06-25  
**作者**: Claude AI Assistant