/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://bbmkuiplnzvpudszrend.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWt1aXBsbnp2cHVkc3pyZW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3MTU2MDQsImV4cCI6MjA2MTI5MTYwNH0._xBzFK-3gOqyztwpvR6xfMbLd3ynTubEg5Z1iLYj92Q',
  },
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
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': '.'
    };
    config.externals = [...(config.externals || []), { 'utf-8-validate': 'commonjs utf-8-validate', 'bufferutil': 'commonjs bufferutil' }];

    // 新增：客戶端 fallback 配置
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'iconv-lite': false, // 嘗試將 iconv-lite 設為 false
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