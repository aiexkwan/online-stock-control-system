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
  // 只包含成功驗證的查詢文件
  documents: [
    // 已成功的查詢
    'lib/graphql/queries/warehouse/awaitLocationQty.graphql',
    'lib/graphql/queries/warehouse/stillInAwait.graphql',
    'lib/graphql/queries/warehouse/stillInAwaitOptimized.graphql',
    'lib/graphql/queries/warehouse/transferTimeDistribution.graphql',
    'lib/graphql/queries/warehouse/transferTimeDistributionOptimized.graphql',
    'lib/graphql/queries/warehouse/warehouseTransferList.graphql',
    'lib/graphql/queries/warehouse/warehouseWorkLevel.graphql',
    'lib/graphql/queries/warehouse/orderStateList.graphql',
    'lib/graphql/queries/stock/inventoryOrderedAnalysis.graphql',
    'lib/graphql/queries/upload/ordersList.graphql',
    'lib/graphql/queries/upload/otherFilesList.graphql',
    'lib/graphql/queries/test/simple.graphql',
    // 排除有錯誤的查詢
    '!lib/graphql/queries/unified.graphql',
    '!lib/graphql/queries/injection/**/*.graphql',
    '!lib/graphql/queries/shared/**/*.graphql',
    '!lib/graphql/queries/stock/statsCard.graphql',
    '!lib/graphql/generated/**/*',
    '!node_modules/**/*',
  ],
  generates: {
    'lib/graphql/generated/widget-types.ts': {
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
        avoidOptionals: false,
        maybeValue: 'T | null',
        futureProofEnums: true,
        fragmentMatching: 'strict',
        nonOptionalTypename: true,
        dedupeOperationSuffix: true,
        documentMode: 'documentNode',
        useTypeImports: true,
        skipTypename: true,
      },
    },
    'lib/graphql/generated/widget-hooks.ts': {
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
        namedClient: 'apolloClient',
        omitOperationSuffix: false,
        dedupeOperationSuffix: true,
      },
    },
  },
};

export default config;