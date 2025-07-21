/** @type {import('next').NextConfig} */
const nextConfig = {
  // 最基本的配置
  reactStrictMode: false, // 暫時禁用嚴格模式
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    optimizeCss: false, // 禁用 CSS 優化
  },
  // 最簡單的 webpack 配置
  webpack: (config, { dev, isServer }) => {
    // 只保留必要的配置
    if (dev && !isServer) {
      config.devtool = 'eval-cheap-module-source-map';
    }
    
    // 防止客戶端載入 Node.js 模組
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
    
    // 移除複雜的 splitChunks 配置
    if (config.optimization.splitChunks) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
        },
      };
    }
    
    return config;
  },
  images: {
    domains: ['bbmkuiplnzvpudszrend.supabase.co'],
  },
};

module.exports = nextConfig; 