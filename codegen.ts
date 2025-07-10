import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  ignoreNoDocuments: true,
  emitLegacyCommonJSImports: false,
  schema: [
    {
      [`${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`]: {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
        },
      },
    },
  ],
  // 包含所有 widget 中的 GraphQL 查詢
  documents: [
    // 所有 GraphQL 查詢檔案
    'lib/graphql/queries/**/*.graphql',
    // widget 檔案 - 批量更新 (移除因為已經使用生成嘅 hooks)
    '!app/admin/components/dashboard/widgets/**/*.test.tsx',
    '!app/admin/components/dashboard/widgets/**/*.example.tsx',
    '!lib/graphql/generated/**/*',
    '!node_modules/**/*',
  ],
  generates: {
    // 生成 TypeScript 類型定義同 TypedDocumentNode
    'lib/graphql/generated/types.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typed-document-node'
      ],
      config: {
        skipDocumentValidation: true,
        skipValidation: true,
        strictScalars: false,
        allowCustomScalars: true,
        skipGraphQLConfig: true,
        scalars: {
          UUID: 'string',
          DateTime: 'string',
          Datetime: 'string', // Supabase 使用 Datetime
          Date: 'string',
          Time: 'string',
          JSON: 'Record<string, unknown>',
          BigInt: 'number',
          BigFloat: 'number',
          Cursor: 'string',
          Opaque: 'unknown',
        },
        enumsAsTypes: true,
        avoidOptionals: false,
        maybeValue: 'T | null',
        futureProofEnums: true,
        fragmentMatching: 'strict',
        // 優化配置
        nonOptionalTypename: true,
        dedupeOperationSuffix: true,
        documentMode: 'documentNode',
        useTypeImports: true,
        // 避免生成不必要嘅 __typename
        skipTypename: true,
      },
    },

    // 生成 Apollo Client React hooks
    'lib/graphql/generated/apollo-hooks.ts': {
      plugins: ['typescript-react-apollo'],
      config: {
        skipDocumentValidation: true,
        skipValidation: true,
        strictScalars: false,
        withHooks: true,
        withHOC: false,
        withComponent: false,
        withMutationFn: true,
        withResultType: true,
        withMutationOptionsType: true,
        apolloReactHooksImportFrom: '@apollo/client',
        apolloReactCommonImportFrom: '@apollo/client',
        // 使用 Supabase GraphQL 的標量類型
        scalars: {
          UUID: 'string',
          DateTime: 'string',
          Datetime: 'string',
          Date: 'string',
          Time: 'string',
          JSON: 'Record<string, unknown>',
          BigInt: 'number',
          BigFloat: 'number',
          Cursor: 'string',
          Opaque: 'unknown',
        },
        enumsAsTypes: true,
        useTypeImports: true,
        skipTypename: true,
        // 生成具名的 hooks
        namedClient: 'apolloClient',
        // 添加前綴避免命名衝突
        omitOperationSuffix: false,
        dedupeOperationSuffix: true,
      },
    },

    // 保留 GraphQL introspection 用於開發工具
    'lib/graphql/generated/introspection.json': {
      plugins: ['introspection'],
    },
  },
};

export default config;
