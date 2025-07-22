/** @type {import('next').NextConfig} */
const nextConfig = {
  // 基本配置
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    optimizeCss: false,
  },
  // Next.js 15 更新的設定名稱
  serverExternalPackages: [],
  // 最小化 webpack 配置以避免 Next.js 15 bootstrap script 錯誤
  webpack: (config, { isServer }) => {
    // 只保留最必要的客戶端 fallback
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
      };
    }

    // 讓 Next.js 15 處理所有其他配置
    return config;
  },
  images: {
    domains: ['bbmkuiplnzvpudszrend.supabase.co'],
  },
};

module.exports = nextConfig;
