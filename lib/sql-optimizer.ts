// SQL 優化器 - 確保查詢返回合適的數據結構

export function optimizeSQL(sql: string, question: string): string {
  let optimizedSQL = sql.trim();
  
  // 1. 檢測是否需要去重
  if (needsDeduplication(sql, question)) {
    optimizedSQL = addGroupByIfNeeded(optimizedSQL);
  }
  
  // 2. 確保有合理的 LIMIT
  if (!optimizedSQL.toUpperCase().includes('LIMIT')) {
    // 根據查詢類型決定 LIMIT
    const limit = detectQueryType(question) === 'summary' ? 20 : 100;
    optimizedSQL = optimizedSQL.replace(/;?\s*$/, ` LIMIT ${limit};`);
  }
  
  // 3. 優化 stock_level 查詢
  if (question.toLowerCase().includes('stock') && 
      question.toLowerCase().includes('level') &&
      !sql.includes('stock_level')) {
    // 建議使用 stock_level 表
    console.log('[SQL Optimizer] Consider using stock_level table for better performance');
  }
  
  return optimizedSQL;
}

function needsDeduplication(sql: string, question: string): boolean {
  const sqlLower = sql.toLowerCase();
  
  // 檢查是否已有 GROUP BY
  if (sqlLower.includes('group by')) {
    return false;
  }
  
  // 檢查是否需要去重的模式
  const deduplicationPatterns = [
    /top\s+\d+/i,
    /show.*products?/i,
    /list.*by.*product/i,
    /summary/i,
    /statistics/i,
    /report/i
  ];
  
  return deduplicationPatterns.some(pattern => pattern.test(question));
}

function addGroupByIfNeeded(sql: string): string {
  const sqlLower = sql.toLowerCase();
  
  // 如果查詢包含產品信息但沒有 GROUP BY
  if ((sqlLower.includes('product_code') || sqlLower.includes('product_name')) && 
      !sqlLower.includes('group by')) {
    
    // 嘗試智能添加 GROUP BY
    const selectMatch = sql.match(/SELECT\s+(.*?)\s+FROM/is);
    if (selectMatch) {
      const selectClause = selectMatch[1];
      
      // 查找非聚合欄位
      const nonAggregateColumns = extractNonAggregateColumns(selectClause);
      
      if (nonAggregateColumns.length > 0) {
        // 在 ORDER BY 之前或查詢末尾添加 GROUP BY
        const orderByIndex = sql.toUpperCase().lastIndexOf('ORDER BY');
        const limitIndex = sql.toUpperCase().lastIndexOf('LIMIT');
        
        let insertPosition = sql.length;
        if (orderByIndex > -1) {
          insertPosition = orderByIndex;
        } else if (limitIndex > -1) {
          insertPosition = limitIndex;
        }
        
        const groupByClause = ` GROUP BY ${nonAggregateColumns.join(', ')} `;
        sql = sql.slice(0, insertPosition) + groupByClause + sql.slice(insertPosition);
        
        console.log('[SQL Optimizer] Added GROUP BY clause to prevent duplicates');
      }
    }
  }
  
  return sql;
}

function extractNonAggregateColumns(selectClause: string): string[] {
  const columns: string[] = [];
  
  // 移除聚合函數
  const cleanedClause = selectClause
    .replace(/COUNT\s*\([^)]+\)/gi, '')
    .replace(/SUM\s*\([^)]+\)/gi, '')
    .replace(/AVG\s*\([^)]+\)/gi, '')
    .replace(/MAX\s*\([^)]+\)/gi, '')
    .replace(/MIN\s*\([^)]+\)/gi, '');
  
  // 提取欄位名
  const columnMatches = cleanedClause.match(/(\w+\.\w+|\w+)(?:\s+as\s+\w+)?/gi);
  
  if (columnMatches) {
    columnMatches.forEach(match => {
      const column = match.split(/\s+as\s+/i)[0].trim();
      if (column && !columns.includes(column)) {
        columns.push(column);
      }
    });
  }
  
  return columns;
}

function detectQueryType(question: string): 'detail' | 'summary' {
  const summaryPatterns = [
    /summary/i,
    /report/i,
    /statistics/i,
    /top\s+\d+/i,
    /overview/i
  ];
  
  return summaryPatterns.some(p => p.test(question)) ? 'summary' : 'detail';
}