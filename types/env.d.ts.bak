/**
 * Global environment variable type definitions
 * Fixes TypeScript NODE_ENV type overlap issues
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'test' | 'production';
      NEXT_PUBLIC_SUPABASE_URL?: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
      SUPABASE_SERVICE_ROLE_KEY?: string;
      SYS_LOGIN?: string;
      SYS_PASSWORD?: string;
      E2E_USER_EMAIL?: string;
      E2E_USER_PASSWORD?: string;
      PUPPETEER_LOGIN?: string;
      PUPPETEER_PASSWORD?: string;
      UNIFIED_TEST_EMAIL?: string;
      UNIFIED_TEST_PASSWORD?: string;
      PLAYWRIGHT_BASE_URL?: string;
      NEXTAUTH_SECRET?: string;
      NEXTAUTH_URL?: string;
      OPENAI_API_KEY?: string;
      ANALYZE?: string;
    }
  }
}

export {};
