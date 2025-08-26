/** @type {import('next').NextConfig} */
// Simple security headers for CommonJS compatibility
const getSecurityHeaders = (isDevelopment = false) => {
  const baseHeaders = [
    {
      key: 'X-Frame-Options',
      value: 'DENY',
    },
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=31536000; includeSubDomains; preload',
    },
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin',
    },
    {
      key: 'X-XSS-Protection',
      value: '1; mode=block',
    },
    {
      key: 'X-DNS-Prefetch-Control',
      value: 'on',
    },
  ];

  return baseHeaders;
};

// Bundle analyzer configuration
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
});

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
  // Security headers configuration
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const securityHeaders = getSecurityHeaders(isDevelopment);

    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // Additional headers for API routes
        source: '/api/:path*',
        headers: [
          ...securityHeaders,
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-API-Version', value: '1.0.0' },
        ],
      },
    ];
  },
  // Vercel 部署優化
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizeCss: false,
    // Vercel 部署優化 - 增加更多包的優化
    optimizePackageImports: [
      '@apollo/client',
      '@heroicons/react',
      '@supabase/supabase-js',
      'react-hook-form',
      '@tanstack/react-query',
      'date-fns',
      'lucide-react'
    ],
    // 關鍵路徑優先載入
    webVitalsAttribution: ['CLS', 'LCP', 'FCP'],
    // 預載關鍵資源
    fetchCacheKeyPrefix: 'pennine-wms',
    // 開啟增量靜態重新生成優化
    isrFlushToDisk: true,
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
    // Image 優化配置
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // 圖片載入優化
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // 靜態資源優化
  assetPrefix: process.env.NODE_ENV === 'production' ? process.env.ASSET_PREFIX : '',
  // 預載關鍵資源
  async rewrites() {
    return [];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
