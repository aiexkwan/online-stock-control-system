import type { CodegenConfig } from '@graphql-codegen/cli';

// 簡化的 GraphQL Codegen 配置
// 專注於從 Supabase GraphQL schema 生成基本類型

const config: CodegenConfig = {
  overwrite: true,
  schema: {
    [`${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`]: {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
      },
    },
  },
  generates: {
    // 只生成 schema 類型
    'lib/graphql/generated/schema-types.ts': {
      plugins: ['typescript'],
      config: {
        // Supabase GraphQL 標量映射
        scalars: {
          UUID: 'string',
          Datetime: 'string',
          Date: 'string', 
          Time: 'string',
          JSON: 'Record<string, any>',
          BigInt: 'string',
          BigFloat: 'string',
          Opaque: 'any',
        },
        enumsAsTypes: true,
        useTypeImports: true,
      },
    },
  },
  hooks: {
    afterAllFileWrite: ['prettier --write'],
  },
};

export default config;