# Pennine WMS 部署配置實際狀態報告

**報告生成時間**: 2025-08-27 08:52:22  
**系統版本**: v2.9.0  
**檢查範圍**: 部署和維運配置的實際狀態  

## 1. Vercel 部署配置

### vercel.json 配置內容
```json
{
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  },
  "framework": "nextjs",
  "installCommand": "npm install --force",
  "buildCommand": "rm -rf .next && npm run build",
  "devCommand": "npm run dev",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 15,
      "memory": 1024
    },
    "app/api/stock-count/*.ts": {
      "maxDuration": 20,
      "memory": 1024
    },
    "app/api/graphql/*.ts": {
      "maxDuration": 30,
      "memory": 1024
    },
    "app/api/pdf-extract/*.ts": {
      "maxDuration": 25,
      "memory": 1024
    }
  },
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=60, stale-while-revalidate=300"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https://bbmkuiplnzvpudszrend.supabase.co https://*.openai.com;"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/health",
      "destination": "/api/health"
    }
  ],
  "trailingSlash": false,
  "cleanUrls": true
}
```

### 部署配置特點
- **Git 分支部署**: 僅 main 分支啟用自動部署
- **構建指令優化**: 清理 .next 目錄後重新構建
- **Serverless 函數配置**: 
  - 一般 API: 15秒執行時間，1024MB 記憶體
  - GraphQL: 30秒執行時間（最高配置）
  - PDF 提取: 25秒執行時間
  - 庫存盤點: 20秒執行時間
- **地理位置**: 美國東部 (iad1)
- **安全標頭**: 完整的安全標頭配置
- **快取策略**: API 60秒快取 + 300秒過期重驗證

## 2. Next.js 部署相關設置

### next.config.js 關鍵配置
```javascript
const nextConfig = {
  // 生產環境配置
  reactStrictMode: false,
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  
  // TypeScript 和 ESLint - 生產環境強制檢查
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // 實驗性優化
  experimental: {
    optimizePackageImports: [
      '@apollo/client',
      '@heroicons/react', 
      '@supabase/supabase-js',
      'react-hook-form',
      '@tanstack/react-query',
      'date-fns',
      'lucide-react'
    ],
    webVitalsAttribution: ['CLS', 'LCP', 'FCP'],
    fetchCacheKeyPrefix: 'pennine-wms',
    isrFlushToDisk: true,
  },
  
  // Bundle Analyzer 配置（可選依賴）
  withBundleAnalyzer: {
    enabled: process.env.ANALYZE === 'true',
    openAnalyzer: false,
  }
};
```

### 安全標頭配置
- **X-Frame-Options**: DENY
- **X-Content-Type-Options**: nosniff  
- **Strict-Transport-Security**: 31536000秒 + includeSubDomains
- **Referrer-Policy**: strict-origin-when-cross-origin
- **X-XSS-Protection**: 1; mode=block
- **X-DNS-Prefetch-Control**: on

### 圖像優化配置
```javascript
images: {
  remotePatterns: [{
    protocol: 'https',
    hostname: 'bbmkuiplnzvpudszrend.supabase.co',
    pathname: '/**',
  }],
  formats: ['image/webp', 'image/avif'],
  minimumCacheTTL: 60,
  dangerouslyAllowSVG: false,
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
}
```

## 3. 構建和 CI/CD 流程

### package.json 構建相關指令
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start", 
    "postinstall": "node scripts/patch-pdf-parse.js",
    "analyze": "cross-env ANALYZE=true npm run build",
    "typecheck": "tsc --noEmit",
    "lint": "next lint",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "clean": "rimraf .next .turbo dist build .cache coverage out npm-debug.log"
  }
}
```

### GitHub Actions CI 流程

#### Lighthouse CI 工作流
- **觸發條件**: push/PR 到 main/develop 分支，每日 2AM UTC 定時執行
- **Node.js 版本**: 20
- **構建環境變數**: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- **性能預算檢查**: 
  - Performance ≥ 70%
  - Accessibility ≥ 85%  
  - Best Practices ≥ 80%
  - SEO ≥ 80%

#### 整合測試工作流
- **Node.js 版本矩陣**: [18.x, 20.x]
- **快取策略**: npm + node_modules + .next/cache
- **測試環境**: 模擬 Supabase 本地環境
- **檢查步驟**: 類型檢查 → Lint → 整合測試 → 覆蓋率報告
- **安全審計**: npm audit --audit-level high

### Lighthouse CI 配置 (.lighthouserc.js)
```javascript
{
  collect: {
    url: [
      'http://localhost:3000/',
      'http://localhost:3000/main-login',
      'http://localhost:3000/admin',
      // 其他 7 個核心頁面
    ],
    numberOfRuns: 3,
    settings: {
      preset: 'desktop',
      throttling: {
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 10240,
        uploadThroughputKbps: 10240,
      }
    }
  },
  assert: {
    // 詳細的性能預算配置
    'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
    'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
    'total-byte-weight': ['warn', { maxNumericValue: 5000000 }], // 5MB
  }
}
```

## 4. 環境配置

### 環境變數結構 (26個變數)
```
CACHE_TYPE=apollo
ENABLE_DETAILED_PERMISSION_CHECK=true
ENABLE_ROUTE_PREFETCH=true
HOST=0.0.0.0
MODEL_CHOICE=gpt-4o-turbo
NEXT_PUBLIC_GRAPHQL_URL
NEXT_PUBLIC_SECURITY_MODE=strict
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_USE_SUPABASE_GRAPHQL
NODE_ENV
OPENAI_API_KEY
PORT=8051
RESEND_API_KEY
SEMAPHORE_LIMIT
SUPABASE_ACCESS_TOKEN
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_URL
TEST_SYS_LOGIN
TEST_SYS_PASSWORD
TRANSPORT=sse
USE_AGENTIC_RAG=true
USE_CONTEXTUAL_EMBEDDINGS=true
USE_HYBRID_SEARCH=true
USE_RERANKING=true
```

### 環境配置特點
- **AI 功能配置**: 完整的 RAG 策略配置
- **安全模式**: 嚴格模式啟用
- **詳細權限檢查**: 啟用
- **GraphQL 使用**: Supabase GraphQL 端點配置
- **測試環境**: 獨立的測試認證配置

## 5. 性能和監控配置

### 性能監控框架 (lib/performance/)
- **22個性能模組**: 包含完整的基準測試和監控系統
- **核心監控**: PerformanceMonitor, WebVitalsCollector
- **基準框架**: performance-baseline-framework.ts
- **回歸檢測**: regression-detection-system.ts
- **自動化監控**: automated-monitoring-system.ts  
- **CI/CD 整合**: ci-cd-integration.ts
- **診斷系統**: performance-diagnostics.ts

### Bundle 分析配置
```javascript
// next.config.js 中的可選依賴處理
let withBundleAnalyzer;
try {
  withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
    openAnalyzer: false,
  });
} catch (error) {
  withBundleAnalyzer = (config) => config;
}
```

### 中間件性能優化 (middleware.ts)
- **關聯ID追蹤**: 所有請求添加 correlation ID  
- **API 版本管理**: v1.8 新增的版本控制系統
- **安全中間件**: 優先執行安全檢查
- **認證優化**: Supabase SSR 客戶端配置
- **日誌級別控制**: 開發/生產環境不同的日誌策略

## 6. 邊緣網路和優化

### Vercel 邊緣優化
- **地區配置**: 美國東部 (iad1) 單一地區部署
- **CDN 快取**: 
  - API 路由: 60秒快取 + 300秒過期重驗證
  - 靜態資源: Next.js 預設快取策略
- **Clean URLs**: 啟用無 .html 後綴
- **壓縮**: 啟用 Gzip 壓縮

### Next.js 優化配置
- **ISR 優化**: isrFlushToDisk 啟用
- **包導入優化**: 7個關鍵套件的預編譯優化
- **Web Vitals**: CLS, LCP, FCP 監控配置
- **靜態資源前綴**: 支援 CDN 前綴配置

### 圖像優化策略
- **現代格式**: WebP, AVIF 優先
- **響應式尺寸**: 8個設備尺寸，8個圖像尺寸
- **快取TTL**: 60秒最小快取時間
- **安全配置**: 禁用危險 SVG，CSP 沙盒保護

## 7. 實際部署狀態總結

### 部署架構成熟度
- ✅ **Vercel 配置完整**: 函數配置、安全標頭、快取策略齊全
- ✅ **CI/CD 流程完善**: Lighthouse CI + 整合測試雙重保障
- ✅ **性能監控系統**: 22個監控模組的企業級監控
- ✅ **安全配置充分**: 多層安全標頭 + CSP 策略
- ⚠️ **單一地區部署**: 僅美國東部，可考慮全球分發

### 監控覆蓋率
- **性能監控**: 完整的基準測試和回歸檢測系統
- **CI/CD 監控**: Lighthouse 自動化性能測試  
- **錯誤追蹤**: Correlation ID 全鏈路追蹤
- **安全監控**: npm audit 自動安全掃描

### 優化成就
- **構建優化**: 包導入優化和 ISR 配置
- **圖像優化**: 現代格式和響應式配置
- **快取策略**: API 和靜態資源分層快取
- **性能預算**: 嚴格的 Lighthouse 性能標準

---

**結論**: 系統具備企業級的部署和監控配置，性能優化和安全措施完善，CI/CD 流程自動化程度高。建議考慮多地區部署以提升全球用戶體驗。