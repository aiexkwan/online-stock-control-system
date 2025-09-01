/**
 * Lighthouse CI Configuration
 * Continuous performance monitoring for production
 */

module.exports = {
  ci: {
    collect: {
      // Target URLs for performance monitoring
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/main-login',
        'http://localhost:3000/admin',
        'http://localhost:3000/order-loading',
      ],

      // Number of runs per URL for averaging
      numberOfRuns: 3,

      // Puppeteer settings
      settings: {
        preset: 'desktop',
        throttling: {
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 10240,
          uploadThroughputKbps: 10240,
        },
        skipAudits: ['uses-http2'],
        extraHeaders: JSON.stringify({
          'X-Performance-Test': 'lighthouse-ci',
        }),
      },

      // Browser options
      puppeteerScript: 'scripts/lighthouse-ci-puppeteer.js',
      puppeteerLaunchOptions: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      },
    },

    assert: {
      // Performance budgets - assertions that must pass
      assertions: {
        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 600 }],
        'speed-index': ['warn', { maxNumericValue: 4000 }],

        // Performance metrics
        interactive: ['warn', { maxNumericValue: 5000 }],
        'mainthread-work-breakdown': ['warn', { maxNumericValue: 4000 }],
        'bootup-time': ['warn', { maxNumericValue: 3000 }],

        // Resource optimization
        'uses-responsive-images': 'warn',
        'uses-optimized-images': 'warn',
        'uses-text-compression': 'error',
        'uses-rel-preconnect': 'warn',
        'font-display': 'warn',

        // JavaScript optimization
        'unminified-javascript': 'error',
        'unused-javascript': ['warn', { maxNumericValue: 100000 }],
        'legacy-javascript': 'warn',

        // CSS optimization
        'unminified-css': 'error',
        'unused-css-rules': 'warn',

        // Security & Best Practices
        'is-on-https': 'off', // Development environment
        'geolocation-on-start': 'error',
        'notification-on-start': 'error',
        'no-vulnerable-libraries': 'error',

        // Accessibility
        'color-contrast': 'warn',
        'heading-order': 'warn',
        'meta-viewport': 'error',

        // SEO
        'document-title': 'error',
        'meta-description': 'warn',

        // Bundle size budgets
        'total-byte-weight': ['warn', { maxNumericValue: 5000000 }], // 5MB total
        'resource-summary:script:size': ['warn', { maxNumericValue: 2000000 }], // 2MB JS
        'resource-summary:stylesheet:size': ['warn', { maxNumericValue: 500000 }], // 500KB CSS
        'resource-summary:image:size': ['warn', { maxNumericValue: 2000000 }], // 2MB images
        'resource-summary:font:size': ['warn', { maxNumericValue: 500000 }], // 500KB fonts

        // Network
        'network-requests': ['warn', { maxNumericValue: 100 }],
        'network-rtt': ['warn', { maxNumericValue: 100 }],
        'network-server-latency': ['warn', { maxNumericValue: 500 }],
      },

      // Budget presets
      preset: 'lighthouse:no-pwa',

      // Assertion levels
      includePassedAssertions: true,
    },

    upload: {
      // Storage configuration
      target: 'filesystem',
      outputDir: './lighthouse-ci-reports',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%',
    },

    server: {
      // Local server configuration for viewing reports
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDatabasePath: './lighthouse-ci-db.sql',
      },
    },
  },
};
