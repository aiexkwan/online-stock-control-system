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