/**
 * TODO Scanner Configuration
 * 用於 TypeScript 遷移同技術債追蹤
 */

module.exports = {
  // 掃描路徑
  include: [
    'app/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'pages/**/*.{ts,tsx}',
    'types/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
  ],
  
  // 排除路徑
  exclude: [
    'node_modules/**',
    '.next/**',
    'dist/**',
    'build/**',
    'coverage/**',
    '**/*.test.{ts,tsx}',
    '**/*.spec.{ts,tsx}',
    '**/*.d.ts',
    '**/generated/**',
  ],
  
  // TODO 標記模式
  patterns: {
    // Phase 3 TypeScript 遷移標記
    typeMigration: {
      pattern: /@types-migration:todo\(phase(\d+)\)\s*\[P(\d)\]\s*(.+?)(?:\s*-\s*Target:\s*(\d{4}-\d{2}))?(?:\s*-\s*Owner:\s*@(\w+))?/g,
      fields: ['phase', 'priority', 'description', 'target', 'owner'],
      category: 'TypeScript Migration',
    },
    
    // 標準 TODO/FIXME/HACK
    standard: {
      pattern: /(TODO|FIXME|HACK|BUG|OPTIMIZE|REFACTOR):\s*(.+)/g,
      fields: ['type', 'description'],
      category: 'Standard',
    },
    
    // 技術債標記
    techDebt: {
      pattern: /@tech-debt:\s*\[(\w+)\]\s*(.+?)(?:\s*-\s*Impact:\s*(\w+))?/g,
      fields: ['area', 'description', 'impact'],
      category: 'Technical Debt',
    },
    
    // 安全相關
    security: {
      pattern: /@security-todo:\s*(.+?)(?:\s*-\s*Severity:\s*(\w+))?/g,
      fields: ['description', 'severity'],
      category: 'Security',
    },
    
    // 性能優化
    performance: {
      pattern: /@perf-todo:\s*(.+?)(?:\s*-\s*Impact:\s*(\w+))?/g,
      fields: ['description', 'impact'],
      category: 'Performance',
    },
  },
  
  // 優先級映射
  priorityMap: {
    'P1': { label: 'Critical', color: 'red', weight: 100 },
    'P2': { label: 'Important', color: 'yellow', weight: 50 },
    'P3': { label: 'Nice to have', color: 'green', weight: 10 },
    'HIGH': { label: 'High', color: 'red', weight: 80 },
    'MEDIUM': { label: 'Medium', color: 'yellow', weight: 40 },
    'LOW': { label: 'Low', color: 'green', weight: 20 },
  },
  
  // 報告配置
  report: {
    // 按類別分組
    groupBy: ['category', 'priority'],
    
    // 排序規則
    sortBy: ['priority', 'target', 'file'],
    
    // 輸出格式
    formats: {
      markdown: {
        template: 'templates/todo-report.md',
        includeStats: true,
        includeCharts: true,
      },
      json: {
        pretty: true,
        includeMetadata: true,
      },
      html: {
        template: 'templates/todo-report.html',
        includeSearch: true,
        includeFilters: true,
      },
    },
    
    // 統計信息
    statistics: {
      byCategory: true,
      byPriority: true,
      byOwner: true,
      byFile: true,
      trendsOverTime: true,
    },
  },
  
  // 整合配置
  integrations: {
    // GitHub Issues 整合
    github: {
      createIssues: false, // 是否自動創建 issues
      labelPrefix: 'todo:',
      assigneeMapping: {
        '@frontend-team': ['frontend-dev1', 'frontend-dev2'],
        '@backend-team': ['backend-dev1', 'backend-dev2'],
        '@qa-team': ['qa-dev1', 'qa-dev2'],
      },
    },
    
    // Slack 通知
    slack: {
      enabled: false,
      webhookUrl: process.env.SLACK_TODO_WEBHOOK,
      channels: {
        critical: '#dev-urgent',
        weekly: '#dev-team',
      },
    },
    
    // Jira 整合
    jira: {
      enabled: false,
      projectKey: 'NEWPEN',
      issueType: 'Technical Debt',
    },
  },
  
  // 閾值設置
  thresholds: {
    // PR 檢查閾值
    pullRequest: {
      maxP1: 5,
      maxTotal: 100,
      blockOnP1: true,
      warnOnTotal: true,
    },
    
    // 每週報告閾值
    weekly: {
      increaseTolerance: 10, // 允許增加 10%
      alertOnIncrease: true,
    },
  },
  
  // 自定義規則
  customRules: [
    {
      name: 'TypeScript Any Usage',
      pattern: /:\s*any\s*[;,\s\)]/g,
      message: 'Consider adding proper TypeScript types',
      severity: 'warning',
      autoFix: false,
    },
    {
      name: 'Console Logs',
      pattern: /console\.(log|debug|info|warn|error)/g,
      message: 'Remove console statements before production',
      severity: 'info',
      autoFix: true,
      fixWith: '// TODO: Remove console statement',
    },
  ],
};