/** @type {import('next').NextConfig} */
const nextConfig = {
  // 基本配置
  reactStrictMode: false,
  // 抑制開發環境的棄用警告
  onDemandEntries: {
    // 抑制 Next.js 內部警告
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // TypeScript 和 ESLint 配置 - 生產環境不應忽略錯誤
  typescript: {
    // 在生產環境中強制類型檢查
    ignoreBuildErrors: false,
  },
  eslint: {
    // 在生產環境中強制 ESLint 檢查
    ignoreDuringBuilds: false,
  },
  experimental: {
    optimizeCss: false,
  },
  // webpack 配置 - 根據搜索結果嘅最佳實踐
  webpack: (config, { isServer, dev }) => {
    // 根據官方建議添加 fallbacks 來解決 Node.js polyfills 問題
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: false,
        crypto: false,
        events: false,
        fs: false,
        http: false,
        https: false,
        net: false,
        os: false,
        path: false,
        querystring: false,
        stream: false,
        tty: false,
        util: false,
        zlib: false,
      };
    }

    // 讓 Next.js 處理其他配置，移除 webpack 警告抑制
    // 因為我哋已經通過 Supabase client 配置解決根本問題
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bbmkuiplnzvpudszrend.supabase.co',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
