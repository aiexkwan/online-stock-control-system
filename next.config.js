/** @type {import('next').NextConfig} */
const nextConfig = {
  // 暫時禁用 strict mode 以避免開發環境的 double rendering
  reactStrictMode: false,
  typescript: {
    // 忽略構建時的 TypeScript 錯誤
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', 'sharp'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bbmkuiplnzvpudszrend.supabase.co',
        port: '',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
  // 環境變數應該從 .env 或 .env.local 文件自動讀取
  // 不應在此處硬編碼任何 API keys
  // 添加瀏覽器兼容性配置
  // future: {
  //   strictPostcssConfiguration: true,
  // },
  // 優化 Safari 的 CSS 兼容性
  // postcss: {
  //   plugins: {
  //     'postcss-flexbugs-fixes': {},
  //     'postcss-preset-env': {
  //       autoprefixer: {
  //         flexbox: 'no-2009',
  //         grid: 'autoplace',
  //       },
  //       stage: 3,
  //       features: {
  //         'custom-properties': false,
  //       },
  //     },
  //   },
  // },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/main-login',
        permanent: true,
      },
      {
        source: '/login',
        destination: '/main-login',
        permanent: true,
      },
    ];
  },
  webpack: (config, { isServer, dev }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': '.',
    };
    config.externals = [
      ...(config.externals || []),
      { 'utf-8-validate': 'commonjs utf-8-validate', bufferutil: 'commonjs bufferutil' },
    ];

    // 優化開發環境的 hot reload
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.git', '**/.next'],
      };
      
      // 緩存優化 - 減少大字符串序列化問題
      config.cache = {
        type: 'filesystem',
        compression: 'gzip',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 天
        maxMemoryGenerations: 5,
        memoryCacheUnaffected: true,
        buildDependencies: {
          config: [__filename],
        },
        store: 'pack',
        // 優化序列化性能
        hashAlgorithm: 'xxhash64',
        version: process.env.NODE_ENV || 'development',
      };
    }

    // Bundle Analyzer 配置
    if (!isServer && process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: '../bundle-analyzer/client.html',
          openAnalyzer: true,
          generateStatsFile: true,
          statsFilename: '../bundle-analyzer/client-stats.json',
        })
      );
    }

    // 新增：客戶端 fallback 配置
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'iconv-lite': false, // 嘗試將 iconv-lite 設為 false
        canvas: false,
        fs: false,
        path: false,
      };
    }

    if (isServer) {
      // 在服務器端構建時，將 canvas 模塊設置為外部依賴
      config.externals = [...(config.externals || []), { canvas: 'canvas' }];

      // 添加 Supabase realtime-js 到外部依賴以消除警告
      //config.externals = [...(config.externals || []), '@supabase/realtime-js'];

      // 為 pdfjs-dist 添加 fallback
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false,
      };
    }

    // Tree shaking 優化
    if (!isServer) {
      // 模組解析優化 (優先使用 ES modules)
      config.resolve.mainFields = ['browser', 'module', 'main'];
      
      // 配置 chunk splitting 策略
      config.optimization = {
        ...config.optimization,
        // 暫時註釋 usedExports 以解決 webpack cache 衝突
        // Next.js 14 默認已啟用 tree shaking，無需手動設定
        // usedExports: true,
        sideEffects: false,
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 20, // 增加並行請求數
          maxAsyncRequests: 30,
          minSize: 20000, // 更精細的最小大小
          maxSize: 200000, // 減少最大大小到 200KB
          minChunks: 1,
          cacheGroups: {
            // 禁用默認分組
            default: false,
            vendors: false,

            // React 核心框架 (最高優先級)
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-sync-external-store)[\\/]/,
              priority: 40,
              enforce: true,
            },

            // 圖表庫專門分組 (解決 Bundle Analyzer 發現的大型模組問題)
            charting: {
              test: /[\\/]node_modules[\\/](recharts|chart\.js|react-chartjs-2|html2canvas)[\\/]/,
              name: 'charting',
              chunks: 'all',
              priority: 35,
              enforce: true,
              maxSize: 200000, // 200KB 限制
            },

            // Apollo GraphQL 數據層
            apollo: {
              test: /[\\/]node_modules[\\/](@apollo\/client|@apollo\/utils|graphql|dataloader)[\\/]/,
              name: 'apollo',
              chunks: 'all',
              priority: 30,
              enforce: true,
              maxSize: 150000,
            },

            // Supabase 數據層
            supabase: {
              test: /[\\/]node_modules[\\/](@supabase\/supabase-js|@supabase\/ssr|@supabase\/auth-ui-react)[\\/]/,
              name: 'supabase',
              chunks: 'all',
              priority: 30,
              enforce: true,
            },

            // UI 庫分組 (Radix UI)
            radixUI: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'radix-ui',
              chunks: 'all',
              priority: 25,
              enforce: true,
              maxSize: 180000,
            },

            // 動畫和動作庫
            motion: {
              test: /[\\/]node_modules[\\/](framer-motion|@tanstack\/react-virtual)[\\/]/,
              name: 'motion',
              chunks: 'all',
              priority: 25,
              enforce: true,
            },

            // TanStack 生態系統
            tanstack: {
              test: /[\\/]node_modules[\\/]@tanstack[\\/](react-query|react-table)[\\/]/,
              name: 'tanstack',
              chunks: 'all',
              priority: 25,
              enforce: true,
            },

            // PDF 和文檔處理 (解決 Bundle Analyzer 發現的 ExcelJS/PDF 問題)
            documents: {
              test: /[\\/]node_modules[\\/](jspdf|pdf-lib|@react-pdf\/renderer|pdf-parse|exceljs)[\\/]/,
              name: 'documents',
              chunks: 'all',
              priority: 25,
              enforce: true,
              maxSize: 200000, // 限制 PDF/Excel 庫大小
            },

            // 工具庫
            utilities: {
              test: /[\\/]node_modules[\\/](date-fns|lodash|uuid|zod|axios)[\\/]/,
              name: 'utilities',
              chunks: 'all',
              priority: 20,
              enforce: true,
              maxSize: 120000,
            },

            // 其他第三方庫 (縮小範圍，排除已分組的庫)
            vendor: {
              test: /[\\/]node_modules[\\/](?!(@apollo|@supabase|@radix-ui|@tanstack|recharts|chart\.js|framer-motion|jspdf|pdf-lib|exceljs|date-fns|react|react-dom)).*[\\/]/,
              name: 'vendor',
              chunks: 'initial',
              priority: 10,
              enforce: true,
              maxSize: 180000, // 減少到 180KB
            },

            // 應用程式共用代碼
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 5,
              chunks: 'all',
              maxSize: 100000, // 減少到 100KB
              reuseExistingChunk: true,
            },
          },
        },
      };

      // Next.js 已經內建支援 dynamic imports 和 webpack magic comments
      // 不需要額外的 babel 配置

      // 配置 prefetch/preload 插件
      const { DefinePlugin } = require('webpack');
      config.plugins.push(
        new DefinePlugin({
          'process.env.ENABLE_ROUTE_PREFETCH': JSON.stringify(
            process.env.ENABLE_ROUTE_PREFETCH || 'true'
          ),
        })
      );
    }

    return config;
  },
  // 添加 Supabase WebSocket 域名到允許列表
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
          },
          // 添加 Safari 特定的安全頭
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
      // 確保 CSS 文件有正確的 MIME type
      {
        source: '/_next/static/css/:path*',
        headers: [
          { key: 'Content-Type', value: 'text/css' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // 確保 JS 文件有正確的 MIME type
      {
        source: '/_next/static/chunks/:path*',
        headers: [
          { key: 'Content-Type', value: 'application/javascript' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
