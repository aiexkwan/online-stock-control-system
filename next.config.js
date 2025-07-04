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