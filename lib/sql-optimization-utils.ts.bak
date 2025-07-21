// Shared SQL optimization utilities
export function addLimitIfMissing(sql: string, limit: number = 100): string {
  if (!sql.toUpperCase().includes('LIMIT')) {
    return sql.replace(/;?\s*$/, ` LIMIT ${limit};`);
  }
  return sql;
}

export function addTimeFilterIfMissing(sql: string, tableName: string, days: number = 30): string {
  const timeColumns: Record<string, string> = {
    record_history: 'time',
    record_transfer: 'tran_date',
    record_palletinfo: 'generate_time',
    data_order: 'created_at',
    record_grn: 'created_at',
  };

  const timeColumn = timeColumns[tableName.toLowerCase()];
  if (!timeColumn || sql.toLowerCase().includes(timeColumn)) {
    return sql;
  }

  const whereMatch = sql.match(/WHERE/i);
  if (whereMatch) {
    return sql.replace(
      /WHERE/i,
      `WHERE ${timeColumn} >= CURRENT_DATE - INTERVAL '${days} days' AND `
    );
  } else {
    return sql.replace(
      new RegExp(`FROM\\s+${tableName}`, 'i'),
      `FROM ${tableName} WHERE ${timeColumn} >= CURRENT_DATE - INTERVAL '${days} days'`
    );
  }
}

export function addGroupByForAggregates(sql: string): string {
  const hasAggregate = /COUNT|SUM|AVG|MAX|MIN/i.test(sql);
  const hasGroupBy = /GROUP BY/i.test(sql);

  if (hasAggregate && !hasGroupBy) {
    const selectMatch = sql.match(/SELECT\s+([\s\S]+?)\s+FROM/i);
    if (!selectMatch) return sql;

    const nonAggColumns = extractNonAggregateColumns(selectMatch[1]);

    if (nonAggColumns.length > 0) {
      let insertPos = sql.length;
      const orderByPos = sql.toUpperCase().indexOf('ORDER BY');
      const limitPos = sql.toUpperCase().indexOf('LIMIT');

      if (orderByPos > -1) insertPos = orderByPos;
      else if (limitPos > -1) insertPos = limitPos;

      return (
        sql.slice(0, insertPos) + ` GROUP BY ${nonAggColumns.join(', ')} ` + sql.slice(insertPos)
      );
    }
  }

  return sql;
}

export function extractNonAggregateColumns(selectClause: string): string[] {
  let cleaned = selectClause;
  cleaned = cleaned.replace(/COUNT\s*\([^)]+\)/gi, '');
  cleaned = cleaned.replace(/SUM\s*\([^)]+\)/gi, '');
  cleaned = cleaned.replace(/AVG\s*\([^)]+\)/gi, '');
  cleaned = cleaned.replace(/MAX\s*\([^)]+\)/gi, '');
  cleaned = cleaned.replace(/MIN\s*\([^)]+\)/gi, '');

  const columns: string[] = [];
  const columnPattern = /(\w+\.?\w*)(?:\s+as\s+\w+)?/gi;
  let match;

  while ((match = columnPattern.exec(cleaned)) !== null) {
    const col = match[1].trim();
    if (col && !columns.includes(col) && col.toLowerCase() !== 'from') {
      columns.push(col);
    }
  }

  return columns;
}
