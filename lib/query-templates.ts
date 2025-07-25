/**
 * 查詢模板系統
 * 用於提升 Ask Database 查詢準確性
 */

// 查詢模板定義
export interface QueryTemplate {
  name: string;
  keywords: string[];
  pattern?: RegExp;
  template: string;
  variables?: string[];
  description: string;
}

// 查詢模板集合
export const QUERY_TEMPLATES: QueryTemplate[] = [
  // 庫存查詢
  {
    name: 'stockLevel',
    keywords: ['庫存', 'stock', 'inventory', '有幾多', '總數'],
    pattern: /(?:顯示|查詢|check)?.*?(?:庫存|stock|inventory).*?(?:數量|level|total)?/i,
    template: `
      SELECT p.product_code,
             dc.description,
             COUNT(DISTINCT p.plt_num) as pallet_count,
             SUM(p.product_qty) as total_qty
      FROM record_palletinfo p
      JOIN record_inventory i ON p.plt_num = i.plt_num
      LEFT JOIN data_code dc ON p.product_code = dc.code
      WHERE (i.injection + i.pipeline + i.await + i.fold + i.bulk + i.backcarpark) > 0
      {{product_filter}}
      GROUP BY p.product_code, dc.description
      ORDER BY total_qty DESC
    `,
    variables: ['product_filter'],
    description: '查詢產品庫存總量',
  },

  // Await location 查詢
  {
    name: 'awaitPallets',
    keywords: ['await', '等待', 'waiting', '暫存'],
    pattern: /(?:在|at|in)?.*?await.*?(?:棧板|pallet)?/i,
    template: `
      SELECT p.plt_num,
             p.product_code,
             dc.description as product_name,
             p.product_qty,
             p.generate_time,
             h.time as moved_to_await_time,
             EXTRACT(day FROM (CURRENT_TIMESTAMP - h.time)) as days_in_await
      FROM record_palletinfo p
      JOIN record_inventory i ON p.plt_num = i.plt_num
      LEFT JOIN data_code dc ON p.product_code = dc.code
      LEFT JOIN (
        SELECT plt_num, MAX(time) as time
        FROM record_history
        WHERE action = 'Move' AND loc = 'Await'
        GROUP BY plt_num
      ) h ON p.plt_num = h.plt_num
      WHERE i.await > 0
      {{product_filter}}
      ORDER BY h.time DESC
    `,
    variables: ['product_filter'],
    description: '查詢在 Await location 的棧板',
  },

  // 今日生產統計
  {
    name: 'dailyProduction',
    keywords: ['今日', 'today', '生產', 'production', 'produced', '製造'],
    pattern: /(?:今日|today).*?(?:生產|produce|製造).*?(?:幾多|how many|數量)?/i,
    template: `
      SELECT COUNT(DISTINCT p.plt_num) as pallet_count,
             COUNT(DISTINCT p.product_code) as product_types,
             SUM(p.product_qty) as total_qty,
             STRING_AGG(DISTINCT p.product_code, ', ' ORDER BY p.product_code) as product_codes
      FROM record_palletinfo p
      WHERE DATE(p.generate_time) = CURRENT_DATE
      AND p.plt_remark LIKE '%finished in production%'
    `,
    description: '今日生產統計',
  },

  // 未完成訂單
  {
    name: 'pendingOrders',
    keywords: ['訂單', 'order', '未完成', 'pending', 'incomplete', '未出'],
    pattern: /(?:未完成|pending|incomplete).*?(?:訂單|order)/i,
    template: `
      SELECT o.order_ref,
             o.product_code,
             dc.description as product_name,
             o.product_qty::integer as ordered_qty,
             COALESCE(o.loaded_qty::integer, 0) as loaded_qty,
             (o.product_qty::integer - COALESCE(o.loaded_qty::integer, 0)) as remaining_qty,
             ROUND((COALESCE(o.loaded_qty::numeric, 0) / o.product_qty::numeric * 100), 1) as completion_percentage,
             o.created_at,
             o.account_num
      FROM data_order o
      LEFT JOIN data_code dc ON o.product_code = dc.code
      WHERE COALESCE(o.loaded_qty::integer, 0) < o.product_qty::integer
      {{order_filter}}
      ORDER BY o.created_at DESC
    `,
    variables: ['order_filter'],
    description: '查詢未完成的訂單',
  },

  // 轉移歷史
  {
    name: 'transferHistory',
    keywords: ['轉移', 'transfer', 'moved', '搬運', '移動'],
    pattern: /(?:轉移|transfer|move).*?(?:記錄|history|紀錄)?/i,
    template: `
      SELECT t.plt_num,
             t.f_loc as from_location,
             t.t_loc as to_location,
             t.tran_date,
             d.name as operator_name,
             p.product_code,
             p.product_qty
      FROM record_transfer t
      LEFT JOIN data_id d ON t.operator_id = d.id
      LEFT JOIN record_palletinfo p ON t.plt_num = p.plt_num
      WHERE DATE(t.tran_date) >= CURRENT_DATE - INTERVAL '7 days'
      {{transfer_filter}}
      ORDER BY t.tran_date DESC
      LIMIT 100
    `,
    variables: ['transfer_filter'],
    description: '查詢近期轉移記錄',
  },

  // 收貨記錄
  {
    name: 'grnReceiving',
    keywords: ['收貨', 'receiving', 'grn', '今日收', '入貨'],
    pattern: /(?:今日|today)?.*?(?:收貨|receiving|grn|入貨)/i,
    template: `
      SELECT g.grn_ref,
             g.plt_num,
             g.material_code,
             g.unit_qty,
             g.created_at,
             p.product_code,
             p.product_qty
      FROM record_grn g
      LEFT JOIN record_palletinfo p ON g.plt_num = p.plt_num
      WHERE DATE(g.created_at) = CURRENT_DATE
      {{grn_filter}}
      ORDER BY g.created_at DESC
    `,
    variables: ['grn_filter'],
    description: '查詢收貨記錄',
  },

  // 長期滯留棧板
  {
    name: 'stuckPallets',
    keywords: ['滯留', 'stuck', '超過', '未移動', '長期', 'not moved'],
    pattern: /(?:超過|over|more than).*?(?:日|days).*?(?:未移動|not moved|滯留)?/i,
    template: `
      SELECT p.plt_num,
             p.product_code,
             dc.description as product_name,
             p.product_qty,
             h.loc as current_location,
             h.time as last_move_time,
             EXTRACT(day FROM (CURRENT_TIMESTAMP - h.time)) as days_since_move
      FROM record_palletinfo p
      JOIN (
        SELECT plt_num, loc, time,
               ROW_NUMBER() OVER (PARTITION BY plt_num ORDER BY time DESC) as rn
        FROM record_history
      ) h ON p.plt_num = h.plt_num AND h.rn = 1
      LEFT JOIN data_code dc ON p.product_code = dc.code
      WHERE EXTRACT(day FROM (CURRENT_TIMESTAMP - h.time)) > {{days_threshold}}
      ORDER BY days_since_move DESC
    `,
    variables: ['days_threshold'],
    description: '查詢長期未移動的棧板',
  },

  // 產品分佈
  {
    name: 'productDistribution',
    keywords: ['分佈', 'distribution', '位置', 'location', '在哪', 'where'],
    pattern: /(?:產品|product).*?(?:分佈|distribution|位置|在哪)?/i,
    template: `
      SELECT p.product_code,
             dc.description as product_name,
             SUM(i.injection) as in_injection,
             SUM(i.pipeline) as in_pipeline,
             SUM(i.await) as in_await,
             SUM(i.fold) as in_fold,
             SUM(i.bulk) as in_bulk,
             SUM(i.backcarpark) as in_backcarpark,
             SUM(i.damage) as in_damage,
             COUNT(DISTINCT p.plt_num) as total_pallets
      FROM record_palletinfo p
      JOIN record_inventory i ON p.plt_num = i.plt_num
      LEFT JOIN data_code dc ON p.product_code = dc.code
      WHERE (i.injection + i.pipeline + i.await + i.fold + i.bulk + i.backcarpark + i.damage) > 0
      {{product_filter}}
      GROUP BY p.product_code, dc.description
      ORDER BY total_pallets DESC
    `,
    variables: ['product_filter'],
    description: '查詢產品在各位置的分佈',
  },
];

/**
 * 根據用戶查詢匹配最適合的模板
 */
export function matchQueryTemplate(userQuery: string): QueryTemplate | null {
  const lowerQuery = userQuery.toLowerCase();
  let bestMatch: { template: QueryTemplate; score: number } | null = null;

  for (const template of QUERY_TEMPLATES) {
    let score = 0;

    // 關鍵詞匹配
    for (const keyword of template.keywords) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        score += 2;
      }
    }

    // 正則匹配
    if (template.pattern && template.pattern.test(userQuery)) {
      score += 3;
    }

    // 更新最佳匹配
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { template, score };
    }
  }

  return bestMatch ? bestMatch.template : null;
}

/**
 * 從用戶查詢中提取變量值
 */
export function extractVariables(userQuery: string): Record<string, string> {
  const variables: Record<string, string> = {};

  // 提取產品代碼
  const productMatch = userQuery.match(/(?:MH|ALDR|S|SA|U|DB)\d*/i);
  if (productMatch) {
    variables.product_filter = `AND p.product_code = '${productMatch[0].toUpperCase()}'`;
  } else if (userQuery.includes('所有') || userQuery.includes('all')) {
    variables.product_filter = '';
  } else {
    // 嘗試提取其他產品描述
    const productKeywords = ['pipe', 'fitting', 'valve', 'flange'];
    for (const keyword of productKeywords) {
      if (userQuery.toLowerCase().includes(keyword)) {
        variables.product_filter = `AND dc.description ILIKE '%${keyword}%'`;
        break;
      }
    }
  }

  // 提取天數
  const daysMatch = userQuery.match(/(\d+)\s*(?:日|天|days?)/i);
  if (daysMatch) {
    variables.days_threshold = daysMatch[1];
  } else {
    variables.days_threshold = '30'; // 默認30天
  }

  // 提取訂單號
  const orderMatch = userQuery.match(/(?:order|訂單).*?(\w+)/i);
  if (orderMatch && orderMatch[1].length > 3) {
    variables.order_filter = `AND o.order_ref = '${orderMatch[1]}'`;
  } else {
    variables.order_filter = '';
  }

  // 提取位置
  const locationMatch = userQuery.match(/(?:from|從|to|去|至)\s*(\w+)/i);
  if (locationMatch) {
    variables.transfer_filter = `AND (t.f_loc = '${locationMatch[1]}' OR t.t_loc = '${locationMatch[1]}')`;
  } else {
    variables.transfer_filter = '';
  }

  // 提取 GRN 號
  const grnMatch = userQuery.match(/(?:grn|GRN)\s*(\d+)/i);
  if (grnMatch) {
    variables.grn_filter = `AND g.grn_ref = ${grnMatch[1]}`;
  } else {
    variables.grn_filter = '';
  }

  return variables;
}

/**
 * 應用變量到模板
 */
export function applyTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;

  // 替換所有變量
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value || '');
  }

  // 清理多餘的空格和換行
  result = result.replace(/\n\s*\n/g, '\n').trim();

  return result;
}

/**
 * 生成模板提示
 */
export function generateTemplateHint(template: QueryTemplate): string {
  return `
-- Template: ${template.name}
-- Description: ${template.description}
-- This template is optimized for ${template.keywords.join(', ')} queries
`;
}

/**
 * 增強查詢 - 主函數
 */
export function enhanceQueryWithTemplate(userQuery: string): {
  enhanced: boolean;
  template?: string;
  hint?: string;
} {
  // 匹配模板
  const template = matchQueryTemplate(userQuery);
  if (!template) {
    return { enhanced: false };
  }

  // 提取變量
  const variables = extractVariables(userQuery);

  // 應用模板
  const sql = applyTemplateVariables(template.template, variables);
  const hint = generateTemplateHint(template);

  return {
    enhanced: true,
    template: sql,
    hint: hint,
  };
}
