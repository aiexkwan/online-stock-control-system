import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: 'lib/graphql/schema.graphql',
  documents: [
    'lib/graphql/**/*.ts',
    'lib/graphql/**/*.graphql',
    'app/**/*.{ts,tsx}',
    '!**/*.generated.{ts,tsx}',
    '!**/*.test.{ts,tsx}'
  ],
  generates: {
    // 生成標準化類型
    'lib/graphql/generated/types.ts': {
      plugins: ['typescript', 'typescript-operations'],
      config: {
        scalars: {
          UUID: 'string',
          DateTime: 'string',
          Date: 'string',
          Time: 'string',
          JSON: 'any',
          BigInt: 'number',
          BigFloat: 'number',
          Cursor: 'string',
          Opaque: 'any'
        },
        enumsAsTypes: true,
        skipTypename: false,
        avoidOptionals: false,
        maybeValue: 'T | null',
        futureProofEnums: true,
        // 生成統一的 Fragment 類型
        fragmentMatching: 'strict',
        // 支援 Apollo Client
        apolloClientVersion: 3
      }
    },
    
    // 生成 React Hooks (第五週功能)
    'lib/graphql/generated/hooks.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo'
      ],
      config: {
        withHooks: true,
        withComponent: false,
        withHOC: false,
        apolloReactHooksImportFrom: '@apollo/client',
        scalars: {
          UUID: 'string',
          DateTime: 'string',
          Date: 'string',
          Time: 'string',
          JSON: 'any'
        }
      }
    },
    
    // 生成 GraphQL introspection
    'lib/graphql/generated/introspection.json': {
      plugins: ['introspection']
    }
  }
};

export default config;