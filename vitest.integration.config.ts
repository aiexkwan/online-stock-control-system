import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: 'integration',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.integration.setup.ts'],
    include: ['__tests__/integration/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/*.e2e.spec.ts',
      '__tests__/unit/**',
      '__tests__/security/**',
      '__tests__/performance/**',
    ],
    testTimeout: 30000, // Extended timeout for integration tests
    hookTimeout: 30000,
    // Pool configuration for integration tests
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Single fork for integration tests to avoid conflicts
        maxForks: 1,
      },
    },
    // Reporter configuration
    reporters: ['default', 'json', 'html'],
    outputFile: {
      json: './test-results/integration-results.json',
      html: './test-results/integration-report.html',
    },
    // Coverage configuration for integration tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage/integration',
      exclude: [
        'coverage/**',
        'dist/**',
        '**/*.d.ts',
        'test{ s}/**',
        'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}',
        '**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}',
        '**/*{.,-}spec.{js,cjs,mjs,ts,tsx,jsx}',
        '**/__tests__/**',
        'scripts/**',
        '.next/**',
        'e2e/**',
        '**/node_modules/**',
        // Exclude test mocks and utilities
        '__tests__/mocks/**',
        '__tests__/factories/**',
        '__tests__/utils/**',
      ],
      include: [
        // Focus on integration points
        'app/(app)/admin/cards/GRNLabelCard.tsx',
        'app/(app)/admin/hooks/useAdminGrnLabelBusiness.tsx',
        'lib/services/unified-pdf-service.ts',
        'lib/database/grn-database-service.ts',
        'app/utils/supabase/optimized-client.ts',
        'app/actions/grnActions.ts',
        'lib/pdfUtils.tsx',
        // Core business logic (now using shared modules)
        'lib/grn/**',
        'lib/printing/services/**',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
        // Per-file thresholds for critical integration points
        'app/(app)/admin/hooks/useAdminGrnLabelBusiness.tsx': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        'lib/services/unified-pdf-service.ts': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/components': path.resolve(__dirname, './components'),
      '@/app': path.resolve(__dirname, './app'),
      '@/types': path.resolve(__dirname, './types'),
      '@/hooks': path.resolve(__dirname, './hooks'),
      '@/utils': path.resolve(__dirname, './utils'),
    },
  },
  define: {
    'process.env.NODE_ENV': '"test"',
    'process.env.NEXT_PUBLIC_SUPABASE_URL': '"http://localhost:54321"',
    'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': '"test-anon-key"',
    'process.env.SUPABASE_SERVICE_ROLE_KEY': '"test-service-role-key"',
  },
});
