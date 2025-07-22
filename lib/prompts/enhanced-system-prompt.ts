/**
 * Enhanced System Prompt for Ask Database
 * 提升查詢準確性的系統提示詞
 */

import { format } from 'date-fns';

// 數據庫 Schema 定義
const DATABASE_SCHEMA = {
  // 核心庫存表
  inventory: {
    record_palletinfo: {
      description: '棧板主資料表',
      key_columns: ['plt_num (PK)', 'product_code', 'product_qty', 'generate_time'],
      notes: '棧板號格式: DDMMYY#### (例: 280625001)',
    },
    record_inventory: {
      description: '實時庫存位置表',
      key_columns: ['plt_num', 'injection', 'pipeline', 'await', 'fold', 'bulk', 'damage'],
      notes: '每個位置欄位代表該位置的數量，0表示不在該位置',
    },
  },

  // 操作歷史
  history: {
    record_history: {
      description: '所有操作歷史記錄',
      key_columns: ['plt_num', 'action', 'loc', 'time', 'id (操作員)'],
      notes: 'action包括: Move, Stock Transfer, Finish QC, Loaded等',
    },
    record_transfer: {
      description: '倉庫轉移記錄',
      key_columns: ['plt_num', 'f_loc', 't_loc', 'tran_date', 'operator_id'],
      notes: '記錄所有位置間的轉移',
    },
  },

  // 訂單管理
  orders: {
    data_order: {
      description: '客戶訂單',
      key_columns: ['order_ref', 'product_code', 'product_qty', 'loaded_qty', 'created_at'],
      notes: 'loaded_qty < product_qty 表示未完成',
    },
    record_aco: {
      description: 'ACO訂單主表',
      key_columns: ['order_ref', 'created_at', 'latest_update'],
    },
  },

  // 基礎資料
  master: {
    data_code: {
      description: '產品主數據',
      key_columns: ['code (PK)', 'description', 'type', 'standard_qty'],
      notes: '產品代碼模式: MH*, ALDR*, S*, SA*',
    },
    data_id: {
      description: '用戶資料',
      key_columns: ['id (PK)', 'name', 'department', 'position'],
    },
  },
};

// 業務規則說明
const BUSINESS_RULES = {
  locations: {
    Await: '默認暫存區，新收貨或待處理的棧板',
    Await_grn: '收貨暫存區，剛完成GRN的棧板',
    Injection: '生產區，正在生產的材料',
    Pipeline: '管道處理區',
    Fold: '摺疊加工區',
    Bulk: '散裝儲存區',
    Backcarpark: '外部停車場儲存',
    Damage: '損壞品區',
  },

  workflows: {
    receiving: 'GRN收貨 → await_grn → 轉移到其他位置',
    production: '材料 → injection(生產) → 完成QC → await',
    shipping: 'await → 分配到訂單 → loaded → 出貨',
  },

  common_queries: {
    stock_in_await: `
      -- 查詢在Await的棧板
      SELECT p.plt_num, p.product_code, p.product_qty
      FROM record_palletinfo p
      JOIN record_inventory i ON p.plt_num = i.plt_num
      WHERE i.await > 0
    `,
    daily_production: `
      -- 今日生產統計
      SELECT COUNT(*) as pallet_count, SUM(product_qty) as total_qty
      FROM record_palletinfo
      WHERE DATE(generate_time) = CURRENT_DATE
      AND plt_remark LIKE '%finished in production%'
    `,
    pending_orders: `
      -- 未完成訂單
      SELECT order_ref, product_code, product_qty, loaded_qty,
             (product_qty - COALESCE(loaded_qty, 0)) as remaining_qty
      FROM data_order
      WHERE COALESCE(loaded_qty, 0) < product_qty
    `,
  },
};

// 生成增強的系統提示詞
export function generateEnhancedSystemPrompt(): string {
  const currentDate = format(new Date(), 'yyyy-MM-dd');

  return `You are an expert SQL assistant for Pennine warehouse management system.
Current date: ${currentDate} (UK timezone)

DATABASE SCHEMA:
${generateSchemaDescription()}

BUSINESS RULES:
${generateBusinessRules()}

QUERY OPTIMIZATION TIPS:
1. Always use proper JOINs instead of subqueries when possible
2. Use indexed columns (plt_num, product_code) in WHERE clauses
3. For date queries, use DATE() function or date range for better performance
4. Add LIMIT to prevent overwhelming results
5. Consider timezone - system uses UK time

COMMON PATTERNS:
${generateCommonPatterns()}

IMPORTANT NOTES:
- Pallet numbers follow DDMMYY#### format (e.g., ${format(new Date(), 'ddMMyy')}001)
- Product codes patterns: MH*, ALDR*, S*, SA*, U*, DB*
- 'Await' location means products waiting for next action
- Use COALESCE for nullable columns like loaded_qty
- History table uses 'time' column (timestamp), not 'date'

When generating SQL:
1. Understand the business context first
2. Choose the most efficient query approach
3. Include meaningful column aliases
4. Handle NULL values properly
5. Sort results logically (usually by date DESC or quantity DESC)

You must ONLY generate SELECT queries. Any other operation should be rejected.
`;
}

// 生成 Schema 描述
function generateSchemaDescription(): string {
  let description = '';

  for (const [category, tables] of Object.entries(DATABASE_SCHEMA)) {
    description += `\n${category.toUpperCase()} TABLES:\n`;
    for (const [tableName, info] of Object.entries(tables)) {
      description += `- ${tableName}: ${info.description}\n`;
      description += `  Columns: ${info.key_columns.join(', ')}\n`;
      if ('notes' in info && info.notes) {
        description += `  Note: ${info.notes}\n`;
      }
    }
  }

  return description;
}

// 生成業務規則
function generateBusinessRules(): string {
  let rules = '';

  rules += '\nLOCATION MEANINGS:\n';
  for (const [loc, desc] of Object.entries(BUSINESS_RULES.locations)) {
    rules += `- ${loc}: ${desc}\n`;
  }

  rules += '\nWORKFLOWS:\n';
  for (const [workflow, desc] of Object.entries(BUSINESS_RULES.workflows)) {
    rules += `- ${workflow}: ${desc}\n`;
  }

  return rules;
}

// 生成常見查詢模式
function generateCommonPatterns(): string {
  let patterns = '';

  for (const [queryType, sql] of Object.entries(BUSINESS_RULES.common_queries)) {
    patterns += `\n${queryType.toUpperCase()}:${sql}\n`;
  }

  return patterns;
}

// 查詢模板系統
export const QUERY_TEMPLATES = {
  // 庫存相關
  stockLevel: {
    keywords: ['庫存', 'stock', 'inventory', '有幾多'],
    template: `
      SELECT p.product_code,
             dc.description,
             COUNT(DISTINCT p.plt_num) as pallet_count,
             SUM(p.product_qty) as total_qty
      FROM record_palletinfo p
      JOIN record_inventory i ON p.plt_num = i.plt_num
      LEFT JOIN data_code dc ON p.product_code = dc.code
      WHERE (i.injection + i.pipeline + i.await + i.fold + i.bulk + i.backcarpark) > 0
      {{CONDITIONS}}
      GROUP BY p.product_code, dc.description
      ORDER BY total_qty DESC
    `,
  },

  // Await location 查詢
  awaitPallets: {
    keywords: ['await', '等待', 'waiting', '暫存'],
    template: `
      SELECT p.plt_num,
             p.product_code,
             p.product_qty,
             p.generate_time,
             h.time as last_move_time
      FROM record_palletinfo p
      JOIN record_inventory i ON p.plt_num = i.plt_num
      LEFT JOIN (
        SELECT plt_num, MAX(time) as time
        FROM record_history
        WHERE action = 'Move' AND loc = 'Await'
        GROUP BY plt_num
      ) h ON p.plt_num = h.plt_num
      WHERE i.await > 0
      {{CONDITIONS}}
      ORDER BY h.time DESC
    `,
  },

  // 今日生產
  dailyProduction: {
    keywords: ['今日', 'today', '生產', 'production', 'produced'],
    template: `
      SELECT COUNT(DISTINCT p.plt_num) as pallet_count,
             SUM(p.product_qty) as total_qty,
             COUNT(DISTINCT p.product_code) as product_types
      FROM record_palletinfo p
      WHERE DATE(p.generate_time) = CURRENT_DATE
      AND p.plt_remark LIKE '%finished in production%'
      {{CONDITIONS}}
    `,
  },

  // 訂單狀態
  orderStatus: {
    keywords: ['訂單', 'order', '未完成', 'pending', 'incomplete'],
    template: `
      SELECT o.order_ref,
             o.product_code,
             o.product_qty as ordered_qty,
             COALESCE(o.loaded_qty, 0) as loaded_qty,
             (o.product_qty - COALESCE(o.loaded_qty, 0)) as remaining_qty,
             ROUND((COALESCE(o.loaded_qty, 0)::numeric / o.product_qty::numeric * 100), 1) as completion_percentage
      FROM data_order o
      WHERE COALESCE(o.loaded_qty, 0) < o.product_qty
      {{CONDITIONS}}
      ORDER BY o.created_at DESC
    `,
  },

  // 轉移歷史
  transferHistory: {
    keywords: ['轉移', 'transfer', 'moved', '搬運'],
    template: `
      SELECT t.plt_num,
             t.f_loc as from_location,
             t.t_loc as to_location,
             t.tran_date,
             d.name as operator_name
      FROM record_transfer t
      LEFT JOIN data_id d ON t.operator_id = d.id
      WHERE DATE(t.tran_date) >= CURRENT_DATE - INTERVAL '7 days'
      {{CONDITIONS}}
      ORDER BY t.tran_date DESC
      LIMIT 100
    `,
  },
};

// 根據問題選擇合適的模板
export function selectQueryTemplate(question: string): string | null {
  const lowerQuestion = question.toLowerCase();

  for (const [templateName, config] of Object.entries(QUERY_TEMPLATES)) {
    if (config.keywords.some(keyword => lowerQuestion.includes(keyword))) {
      return config.template;
    }
  }

  return null;
}

// 處理模板條件
export function processTemplateConditions(template: string, conditions: string = ''): string {
  return template.replace('{{CONDITIONS}}', conditions ? `AND ${conditions}` : '');
}
