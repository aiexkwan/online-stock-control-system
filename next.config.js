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
      '@': '.'
    };
    config.externals = [...(config.externals || []), { 'utf-8-validate': 'commonjs utf-8-validate', 'bufferutil': 'commonjs bufferutil' }];
    
    // 優化開發環境的 hot reload
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.git', '**/.next']
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
        'canvas': false,
        'fs': false,
        'path': false,
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

    // Phase 3.1.2: 路由級代碼分割優化
    if (!isServer) {
      // 配置 chunk splitting 策略
      config.optimization = {
        ...config.optimization,
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
          cacheGroups: {
            // 默認緩存組
            default: false,
            vendors: false,
            
            // 框架核心
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-sync-external-store)[\\/]/,
              priority: 40,
              enforce: true,
            },
            
            // UI 組件庫
            lib: {
              test(module) {
                return module.size() > 160000 &&
                  /node_modules[\\/]/.test(module.identifier());
              },
              name(module) {
                const hash = require('crypto')
                  .createHash('sha1')
                  .update(module.identifier())
                  .digest('hex')
                  .substring(0, 8);
                return `lib-${hash}`;
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            
            // 共用組件
            commons: {
              name: 'commons',
              minChunks: 3, // 提高到 3 次引用才打包到 commons
              priority: 10, // 降低優先級
              maxSize: 200000, // 限制 commons chunk 大小為 200KB
            },
            
            // 主題特定 chunks
            adminThemes: {
              test: /[\\/]app[\\/]admin[\\/]components[\\/]dashboard[\\/](CustomThemeLayout|UploadUpdateLayout|StockManagementLayout|SystemLayout|AnalysisLayout)/,
              name: (module, chunks, key) => {
                const path = module.identifier();
                const layoutMatch = path.match(/([A-Z][a-z]+)+Layout/);
                if (layoutMatch) {
                  return `theme-${layoutMatch[0].toLowerCase().replace('layout', '')}`;
                }
                return 'theme-common';
              },
              priority: 25,
              reuseExistingChunk: true,
            },
            
            // Widget chunks
            widgets: {
              test: /[\\/]app[\\/]admin[\\/]components[\\/]dashboard[\\/]widgets[\\/]/,
              name: (module, chunks, key) => {
                const path = module.identifier();
                const widgetMatch = path.match(/widgets[\\/]([^\/]+)/);
                if (widgetMatch) {
                  const widgetName = widgetMatch[1].replace(/\.tsx?$/, '');
                  // 將相關 widgets 分組
                  if (widgetName.includes('Analysis')) return 'widgets-analysis';
                  if (widgetName.includes('Report')) return 'widgets-reports';
                  if (widgetName.includes('Chart')) return 'widgets-charts';
                  if (widgetName.includes('Upload')) return 'widgets-uploads';
                  return 'widgets-common';
                }
                return 'widgets-misc';
              },
              priority: 15,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            
            // Recharts 單獨打包
            recharts: {
              test: /[\\/]node_modules[\\/](recharts|d3-[^\/]+|victory[^\/]*)[\\/]/,
              name: 'charts-vendor',
              priority: 35,
              reuseExistingChunk: true,
            },
            
            // Supabase SDK
            supabase: {
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              name: 'supabase-sdk',
              priority: 35,
              reuseExistingChunk: true,
            },
            
            // Apollo GraphQL
            apollo: {
              test: /[\\/]node_modules[\\/](@apollo|graphql|apollo-[^\/]+)[\\/]/,
              name: 'apollo-graphql',
              priority: 34,
              reuseExistingChunk: true,
            },
            
            // PDF 相關庫
            pdfLibs: {
              test: /[\\/]node_modules[\\/](pdf-lib|pdf-parse|pdf2pic|@react-pdf|jspdf|puppeteer)[\\/]/,
              name: 'pdf-libs',
              priority: 33,
              reuseExistingChunk: true,
            },
            
            // Excel 處理庫
            excelLibs: {
              test: /[\\/]node_modules[\\/](exceljs|xlsx|file-saver|papaparse)[\\/]/,
              name: 'excel-libs',
              priority: 33,
              reuseExistingChunk: true,
            },
            
            // Radix UI
            radixUI: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'radix-ui',
              priority: 32,
              minChunks: 2,
              reuseExistingChunk: true,
            },
            
            // Tanstack 庫
            tanstack: {
              test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
              name: 'tanstack-libs',
              priority: 32,
              reuseExistingChunk: true,
            },
            
            // AI/LLM 相關庫
            aiLibs: {
              test: /[\\/]node_modules[\\/](langchain|@anthropic-ai|openai)[\\/]/,
              name: 'ai-libs',
              priority: 31,
              reuseExistingChunk: true,
            },
            
            // 其他大型庫
            largeVendors: {
              test: /[\\/]node_modules[\\/](axios|lodash|date-fns|zod|framer-motion|formik)[\\/]/,
              name: 'vendor-utils',
              priority: 30,
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
          'process.env.ENABLE_ROUTE_PREFETCH': JSON.stringify(process.env.ENABLE_ROUTE_PREFETCH || 'true'),
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
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
          // 添加 Safari 特定的安全頭
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 