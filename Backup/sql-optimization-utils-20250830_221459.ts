/**
 * Shared SQL optimization utilities for query enhancement and performance
 */

// Type definitions for better type safety
type SqlString = string;
type TableName = string;
type ColumnName = string;
type DayCount = number;
type RowLimit = number;

/**
 * Adds a LIMIT clause to SQL query if not already present
 * @param sql - The SQL query string
 * @param limit - Maximum number of rows to return (default: 100)
 * @returns Modified SQL string with LIMIT clause
 * @throws {Error} If sql parameter is invalid
 */
export function addLimitIfMissing(sql: SqlString, limit: RowLimit = 100): SqlString {
  if (typeof sql !== 'string' || sql.trim().length === 0) {
    throw new Error('Invalid SQL string provided');
  }
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error('Limit must be a positive integer');
  }

  if (!sql.toUpperCase().includes('LIMIT')) {
    return sql.replace(/;?\s*$/, ` LIMIT ${limit};`);
  }
  return sql;
}

/**
 * Known table-to-time-column mappings for automatic time filtering
 */
const TIME_COLUMN_MAPPINGS: Readonly<Record<string, ColumnName>> = {
  record_history: 'time',
  record_transfer: 'tran_date',
  record_palletinfo: 'generate_time',
  data_order: 'created_at',
  record_grn: 'created_at',
} as const;

/**
 * Adds time-based filtering to SQL query if not already present
 * @param sql - The SQL query string
 * @param tableName - Name of the table being queried
 * @param days - Number of days to look back (default: 30)
 * @returns Modified SQL string with time filter
 * @throws {Error} If parameters are invalid
 */
export function addTimeFilterIfMissing(
  sql: SqlString,
  tableName: TableName,
  days: DayCount = 30
): SqlString {
  if (typeof sql !== 'string' || sql.trim().length === 0) {
    throw new Error('Invalid SQL string provided');
  }
  if (typeof tableName !== 'string' || tableName.trim().length === 0) {
    throw new Error('Invalid table name provided');
  }
  if (!Number.isInteger(days) || days <= 0) {
    throw new Error('Days must be a positive integer');
  }

  const timeColumn = TIME_COLUMN_MAPPINGS[tableName.toLowerCase()];
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

/**
 * Regex patterns for detecting SQL aggregate functions
 */
const AGGREGATE_PATTERN = /COUNT|SUM|AVG|MAX|MIN/i;
const GROUP_BY_PATTERN = /GROUP BY/i;
const SELECT_FROM_PATTERN = /SELECT\s+([\s\S]+?)\s+FROM/i;

/**
 * Automatically adds GROUP BY clause for queries with aggregate functions
 * @param sql - The SQL query string
 * @returns Modified SQL string with GROUP BY clause if needed
 * @throws {Error} If sql parameter is invalid
 */
export function addGroupByForAggregates(sql: SqlString): SqlString {
  if (typeof sql !== 'string' || sql.trim().length === 0) {
    throw new Error('Invalid SQL string provided');
  }

  const hasAggregate = AGGREGATE_PATTERN.test(sql);
  const hasGroupBy = GROUP_BY_PATTERN.test(sql);

  if (hasAggregate && !hasGroupBy) {
    const selectMatch = sql.match(SELECT_FROM_PATTERN);
    if (!selectMatch || !selectMatch[1]) return sql;

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

/**
 * Regex patterns for removing aggregate functions from SELECT clause
 */
const AGGREGATE_REMOVAL_PATTERNS = [
  /COUNT\s*\([^)]+\)/gi,
  /SUM\s*\([^)]+\)/gi,
  /AVG\s*\([^)]+\)/gi,
  /MAX\s*\([^)]+\)/gi,
  /MIN\s*\([^)]+\)/gi,
] as const;

const COLUMN_EXTRACTION_PATTERN = /(\w+\.?\w*)(?:\s+as\s+\w+)?/gi;
const EXCLUDED_KEYWORDS = ['from'] as const;

/**
 * Extracts non-aggregate column names from a SELECT clause
 * @param selectClause - The SELECT portion of a SQL query
 * @returns Array of non-aggregate column names
 * @throws {Error} If selectClause parameter is invalid
 */
export function extractNonAggregateColumns(selectClause: string): readonly string[] {
  if (typeof selectClause !== 'string') {
    throw new Error('Invalid select clause provided');
  }

  let cleaned = selectClause;

  // Remove all aggregate function calls
  for (const pattern of AGGREGATE_REMOVAL_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  const columns: string[] = [];
  let match: RegExpExecArray | null;

  // Reset regex state for consistent behavior
  COLUMN_EXTRACTION_PATTERN.lastIndex = 0;

  while ((match = COLUMN_EXTRACTION_PATTERN.exec(cleaned)) !== null) {
    const col = match[1]?.trim();
    if (
      col &&
      !columns.includes(col) &&
      !EXCLUDED_KEYWORDS.includes(col.toLowerCase() as (typeof EXCLUDED_KEYWORDS)[number])
    ) {
      columns.push(col);
    }
  }

  return Object.freeze(columns);
}
