/**
 * Lighthouse CI 配置
 * 用於 ChatbotCard 重構性能基準測試
 */

module.exports = {
  ci: {
    collect: {
      // 要測試的 URL
      url: ['http://localhost:3000/admin', 'http://localhost:3000/admin#chatbot-test'],

      // 收集設置
      numberOfRuns: 3, // 運行3次取平均值
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
      },
    },

    assert: {
      // 性能基準斷言
      assertions: {
        // 核心 Web Vitals
        'categories:performance': ['warn', { minScore: 0.75 }], // 75分以上
        'categories:accessibility': ['error', { minScore: 0.9 }], // 90分以上
        'categories:best-practices': ['warn', { minScore: 0.8 }], // 80分以上
        'categories:seo': ['warn', { minScore: 0.8 }], // 80分以上

        // 具體指標 - ChatbotCard 重構目標
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }], // 2秒內
        'largest-contentful-paint': ['warn', { maxNumericValue: 3000 }], // 3秒內
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // CLS < 0.1
        'total-blocking-time': ['warn', { maxNumericValue: 300 }], // TBT < 300ms

        // 重構特定指標
        'speed-index': ['warn', { maxNumericValue: 2500 }], // 視覺完成 < 2.5秒
        interactive: ['warn', { maxNumericValue: 4000 }], // 互動就緒 < 4秒

        // 資源優化
        'unused-javascript': ['warn', { maxLength: 1 }],
        'unused-css-rules': ['warn', { maxLength: 1 }],
        'unminified-javascript': ['error', { maxLength: 0 }],
        'unminified-css': ['error', { maxLength: 0 }],

        // 圖像優化
        'modern-image-formats': ['warn', { maxLength: 0 }],
        'offscreen-images': ['warn', { maxLength: 0 }],
        'uses-optimized-images': ['warn', { maxLength: 0 }],

        // 網路優化
        'uses-http2': ['warn', { minScore: 1 }],
        'uses-text-compression': ['warn', { minScore: 1 }],

        // 快取策略
        'uses-long-cache-ttl': ['warn', { minScore: 0.8 }],

        // JavaScript 執行
        'bootup-time': ['warn', { maxNumericValue: 2000 }],
        'mainthread-work-breakdown': ['warn', { maxNumericValue: 3000 }],
      },
    },

    upload: {
      // 上傳到 GitHub Actions artifacts
      target: 'filesystem',
      outputDir: '.lighthouseci',

      // 如果有 LHCI 伺服器可以啟用
      // target: 'lhci',
      // serverBaseUrl: process.env.LHCI_SERVER_BASE_URL,
      // token: process.env.LHCI_TOKEN,
    },

    server: {
      // 如果需要本地 LHCI 伺服器
      // port: 9001,
      // storage: {
      //   storageMethod: 'filesystem',
      //   storagePath: '.lighthouseci'
      // }
    },
  },
};
