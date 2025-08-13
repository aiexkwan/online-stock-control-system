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
  // Vercel 部署優化
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizeCss: false,
    // Vercel 部署優化
    optimizePackageImports: ['@apollo/client', '@heroicons/react'],
  },
  // 外部套件配置 (已移出 experimental)
  serverExternalPackages: ['@prisma/client'],
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

    // 修復動態導入和緩存問題
    if (dev) {
      config.cache = false; // 開發環境禁用緩存，避免 chunk 文件問題
    }

    // 優化模塊解析
    config.resolve.symlinks = false;
    
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
