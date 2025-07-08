/**
 * 高級查詢優化建議系統
 * 分析 GraphQL 查詢性能並提供具體改進建議
 */

import { GraphQLSchema, DocumentNode, ValidationContext, FieldNode } from 'graphql';
import { getComplexity, FieldComplexityEstimator } from 'graphql-query-complexity';

interface QueryAnalysisResult {
  queryId: string;
  query: string;
  variables?: Record<string, any>;
  complexity: number;
  depth: number;
  executionTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  fieldStats: FieldStats[];
  issues: QueryIssue[];
  suggestions: OptimizationSuggestion[];
  score: number; // 0-100 的性能評分
}

interface FieldStats {
  fieldName: string;
  path: string[];
  complexity: number;
  executionTime: number;
  resolverCalls: number;
  cacheHits: number;
  cacheMisses: number;
  dataSize: number; // 返回數據大小（字節）
}

interface QueryIssue {
  type: 'performance' | 'complexity' | 'caching' | 'nplus1' | 'overfetching';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  fieldPath: string[];
  impact: string;
}

interface OptimizationSuggestion {
  type: 'query_rewrite' | 'caching' | 'batching' | 'fragmentation' | 'pagination';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  implementation: string;
  estimatedImprovement: string;
  before?: string;
  after?: string;
}

interface QueryPattern {
  pattern: string;
  frequency: number;
  avgExecutionTime: number;
  avgComplexity: number;
  successRate: number;
}

class QueryOptimizer {
  private schema: GraphQLSchema;
  private queryHistory: Map<string, QueryAnalysisResult[]> = new Map();
  private patterns: Map<string, QueryPattern> = new Map();
  private readonly maxHistorySize = 1000;

  constructor(schema: GraphQLSchema) {
    this.schema = schema;
  }

  /**
   * 分析查詢性能
   */
  async analyzeQuery(
    document: DocumentNode,
    variables: Record<string, any> = {},
    executionResult: any
  ): Promise<QueryAnalysisResult> {
    const queryString = this.normalizeQuery(document);
    const queryId = this.generateQueryId(queryString, variables);

    // 計算查詢複雜度
    const complexity = this.calculateComplexity(document, variables);

    // 計算查詢深度
    const depth = this.calculateDepth(document);

    // 分析欄位統計
    const fieldStats = this.analyzeFieldStats(document, executionResult);

    // 檢測問題
    const issues = this.detectIssues(document, fieldStats, complexity, depth);

    // 生成優化建議
    const suggestions = this.generateSuggestions(document, fieldStats, issues);

    // 計算性能評分
    const score = this.calculatePerformanceScore(complexity, depth, fieldStats, issues);

    const result: QueryAnalysisResult = {
      queryId,
      query: queryString,
      variables,
      complexity,
      depth,
      executionTime: executionResult.executionTime || 0,
      memoryUsage: executionResult.memoryUsage || 0,
      cacheHitRate: this.calculateCacheHitRate(fieldStats),
      fieldStats,
      issues,
      suggestions,
      score,
    };

    this.recordQueryResult(result);
    this.updatePatterns(result);

    return result;
  }

  /**
   * 計算查詢複雜度
   */
  private calculateComplexity(document: DocumentNode, variables: Record<string, any>): number {
    try {
      const complexityEstimator: FieldComplexityEstimator = (args, childComplexity) => {
        // 基礎複雜度
        let complexity = 1 + childComplexity;

        // 分頁參數增加複雜度
        if (args.first || args.last) {
          const limit = args.first || args.last;
          complexity += Math.min(limit, 100); // 限制最大複雜度
        }

        return complexity;
      };

      return getComplexity({
        schema: this.schema,
        query: document,
        variables,
        estimators: [complexityEstimator],
      });
    } catch (error) {
      console.warn('[QueryOptimizer] 複雜度計算失敗:', error);
      return 1;
    }
  }

  /**
   * 計算查詢深度
   */
  private calculateDepth(document: DocumentNode): number {
    let maxDepth = 0;

    const calculateNodeDepth = (node: any, currentDepth: number): void => {
      if (node.selectionSet?.selections) {
        for (const selection of node.selectionSet.selections) {
          if (selection.kind === 'Field') {
            calculateNodeDepth(selection, currentDepth + 1);
          }
        }
      }
      maxDepth = Math.max(maxDepth, currentDepth);
    };

    document.definitions.forEach(definition => {
      if (definition.kind === 'OperationDefinition') {
        calculateNodeDepth(definition, 0);
      }
    });

    return maxDepth;
  }

  /**
   * 分析欄位統計
   */
  private analyzeFieldStats(document: DocumentNode, executionResult: any): FieldStats[] {
    const stats: FieldStats[] = [];
    const resolverInfo = executionResult.resolverInfo || {};

    const analyzeSelection = (selection: any, path: string[] = []): void => {
      if (selection.kind === 'Field') {
        const fieldName = selection.name.value;
        const fieldPath = [...path, fieldName];
        const fieldKey = fieldPath.join('.');

        const resolverData = resolverInfo[fieldKey] || {};

        stats.push({
          fieldName,
          path: fieldPath,
          complexity: resolverData.complexity || 1,
          executionTime: resolverData.executionTime || 0,
          resolverCalls: resolverData.calls || 1,
          cacheHits: resolverData.cacheHits || 0,
          cacheMisses: resolverData.cacheMisses || 0,
          dataSize: this.estimateDataSize(resolverData.result),
        });

        if (selection.selectionSet) {
          selection.selectionSet.selections.forEach((nestedSelection: any) => {
            analyzeSelection(nestedSelection, fieldPath);
          });
        }
      }
    };

    document.definitions.forEach(definition => {
      if (definition.kind === 'OperationDefinition') {
        definition.selectionSet.selections.forEach(selection => {
          analyzeSelection(selection);
        });
      }
    });

    return stats;
  }

  /**
   * 檢測查詢問題
   */
  private detectIssues(
    document: DocumentNode,
    fieldStats: FieldStats[],
    complexity: number,
    depth: number
  ): QueryIssue[] {
    const issues: QueryIssue[] = [];

    // 檢查複雜度過高
    if (complexity > 1000) {
      issues.push({
        type: 'complexity',
        severity: 'critical',
        message: `查詢複雜度過高 (${complexity})，可能導致性能問題`,
        fieldPath: [],
        impact: '響應時間大幅增加，可能導致超時',
      });
    } else if (complexity > 500) {
      issues.push({
        type: 'complexity',
        severity: 'high',
        message: `查詢複雜度較高 (${complexity})，建議優化`,
        fieldPath: [],
        impact: '響應時間增加，影響用戶體驗',
      });
    }

    // 檢查深度過深
    if (depth > 10) {
      issues.push({
        type: 'complexity',
        severity: 'high',
        message: `查詢深度過深 (${depth} 層)，可能存在循環引用`,
        fieldPath: [],
        impact: '增加解析開銷，可能導致堆疊溢出',
      });
    }

    // 檢查 N+1 問題
    const nPlusOneFields = fieldStats.filter(
      field =>
        field.resolverCalls > 10 && field.cacheHits / (field.cacheHits + field.cacheMisses) < 0.5
    );

    nPlusOneFields.forEach(field => {
      issues.push({
        type: 'nplus1',
        severity: 'high',
        message: `欄位 ${field.fieldName} 存在 N+1 查詢問題 (${field.resolverCalls} 次呼叫)`,
        fieldPath: field.path,
        impact: '大量數據庫查詢，嚴重影響性能',
      });
    });

    // 檢查緩存命中率低
    const lowCacheFields = fieldStats.filter(field => {
      const totalRequests = field.cacheHits + field.cacheMisses;
      return totalRequests > 5 && field.cacheHits / totalRequests < 0.3;
    });

    lowCacheFields.forEach(field => {
      issues.push({
        type: 'caching',
        severity: 'medium',
        message: `欄位 ${field.fieldName} 緩存命中率過低 (${Math.round((field.cacheHits / (field.cacheHits + field.cacheMisses)) * 100)}%)`,
        fieldPath: field.path,
        impact: '增加數據庫負載，響應時間變長',
      });
    });

    // 檢查過度提取
    const largeDataFields = fieldStats.filter(field => field.dataSize > 1024 * 1024); // 1MB

    largeDataFields.forEach(field => {
      issues.push({
        type: 'overfetching',
        severity: 'medium',
        message: `欄位 ${field.fieldName} 返回數據量過大 (${Math.round(field.dataSize / 1024)} KB)`,
        fieldPath: field.path,
        impact: '增加網絡傳輸時間和客戶端內存使用',
      });
    });

    return issues;
  }

  /**
   * 生成優化建議
   */
  private generateSuggestions(
    document: DocumentNode,
    fieldStats: FieldStats[],
    issues: QueryIssue[]
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // 針對 N+1 問題的建議
    const nPlusOneIssues = issues.filter(issue => issue.type === 'nplus1');
    nPlusOneIssues.forEach(issue => {
      suggestions.push({
        type: 'batching',
        priority: 'high',
        title: '實施 DataLoader 批量加載',
        description: `為欄位 ${issue.fieldPath.join('.')} 添加 DataLoader 以解決 N+1 查詢問題`,
        implementation: `
          const dataLoader = new DataLoader(async (ids) => {
            return await batchLoadFunction(ids);
          });
        `,
        estimatedImprovement: '響應時間減少 70-90%',
      });
    });

    // 針對複雜度的建議
    const complexityIssues = issues.filter(issue => issue.type === 'complexity');
    complexityIssues.forEach(() => {
      suggestions.push({
        type: 'fragmentation',
        priority: 'high',
        title: '拆分複雜查詢',
        description: '將複雜查詢拆分為多個簡單查詢，使用 Fragment 重用共同部分',
        implementation: `
          fragment UserInfo on User {
            id
            name
            email
          }
          
          query GetUserBasics {
            user(id: $id) {
              ...UserInfo
            }
          }
        `,
        estimatedImprovement: '查詢複雜度減少 50-70%',
      });
    });

    // 針對緩存的建議
    const cachingIssues = issues.filter(issue => issue.type === 'caching');
    cachingIssues.forEach(issue => {
      suggestions.push({
        type: 'caching',
        priority: 'medium',
        title: '優化欄位緩存策略',
        description: `為欄位 ${issue.fieldPath.join('.')} 調整緩存 TTL 和策略`,
        implementation: `
          @cacheControl(maxAge: 300, scope: PUBLIC)
          field ${issue.fieldPath[issue.fieldPath.length - 1]}
        `,
        estimatedImprovement: '緩存命中率提升至 80%+',
      });
    });

    // 針對大數據的建議
    const overfetchingIssues = issues.filter(issue => issue.type === 'overfetching');
    overfetchingIssues.forEach(issue => {
      suggestions.push({
        type: 'pagination',
        priority: 'medium',
        title: '實施分頁和欄位選擇',
        description: `為欄位 ${issue.fieldPath.join('.')} 添加分頁和選擇性欄位`,
        implementation: `
          query GetItems($first: Int = 20, $after: String) {
            items(first: $first, after: $after) {
              edges {
                node {
                  id
                  # 只選擇必要的欄位
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        `,
        estimatedImprovement: '數據傳輸量減少 60-80%',
      });
    });

    // 通用查詢重寫建議
    const totalComplexity = fieldStats.reduce((sum, field) => sum + field.complexity, 0);
    if (totalComplexity > 100) {
      suggestions.push({
        type: 'query_rewrite',
        priority: 'medium',
        title: '查詢結構優化',
        description: '重新組織查詢結構以減少複雜度',
        implementation: `
          # 避免深層嵌套
          # 使用別名區分相似查詢
          # 合併相關欄位請求
        `,
        estimatedImprovement: '總體性能提升 30-50%',
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * 計算性能評分
   */
  private calculatePerformanceScore(
    complexity: number,
    depth: number,
    fieldStats: FieldStats[],
    issues: QueryIssue[]
  ): number {
    let score = 100;

    // 複雜度懲罰
    if (complexity > 1000) score -= 40;
    else if (complexity > 500) score -= 20;
    else if (complexity > 200) score -= 10;

    // 深度懲罰
    if (depth > 10) score -= 20;
    else if (depth > 7) score -= 10;

    // 緩存命中率獎勵
    const avgCacheHitRate = this.calculateCacheHitRate(fieldStats);
    score += (avgCacheHitRate - 0.5) * 20; // 50% 基準

    // 問題嚴重程度懲罰
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 8;
          break;
        case 'low':
          score -= 3;
          break;
      }
    });

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * 獲取查詢優化報告
   */
  async getOptimizationReport(timeRange: { start: Date; end: Date }): Promise<{
    summary: {
      totalQueries: number;
      avgScore: number;
      topIssues: QueryIssue[];
      topSuggestions: OptimizationSuggestion[];
    };
    queryPatterns: QueryPattern[];
    worstPerformingQueries: QueryAnalysisResult[];
    recommendations: string[];
  }> {
    const allResults = Array.from(this.queryHistory.values()).flat();
    const timeFilteredResults = allResults.filter(result => {
      const queryTime = new Date(result.queryId.split('_')[1]);
      return queryTime >= timeRange.start && queryTime <= timeRange.end;
    });

    const avgScore =
      timeFilteredResults.reduce((sum, result) => sum + result.score, 0) /
      timeFilteredResults.length;

    const allIssues = timeFilteredResults.flatMap(result => result.issues);
    const topIssues = this.getTopIssues(allIssues);

    const allSuggestions = timeFilteredResults.flatMap(result => result.suggestions);
    const topSuggestions = this.getTopSuggestions(allSuggestions);

    const worstPerformingQueries = timeFilteredResults
      .sort((a, b) => a.score - b.score)
      .slice(0, 10);

    const recommendations = this.generateGeneralRecommendations(timeFilteredResults);

    return {
      summary: {
        totalQueries: timeFilteredResults.length,
        avgScore: Math.round(avgScore),
        topIssues,
        topSuggestions,
      },
      queryPatterns: Array.from(this.patterns.values()),
      worstPerformingQueries,
      recommendations,
    };
  }

  // 工具方法
  private normalizeQuery(document: DocumentNode): string {
    // 簡化的查詢標準化
    return document.loc?.source.body || '';
  }

  private generateQueryId(query: string, variables: Record<string, any>): string {
    const hash = this.simpleHash(query + JSON.stringify(variables));
    return `query_${Date.now()}_${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private estimateDataSize(data: any): number {
    if (!data) return 0;
    return JSON.stringify(data).length;
  }

  private calculateCacheHitRate(fieldStats: FieldStats[]): number {
    let totalHits = 0;
    let totalRequests = 0;

    fieldStats.forEach(field => {
      totalHits += field.cacheHits;
      totalRequests += field.cacheHits + field.cacheMisses;
    });

    return totalRequests > 0 ? totalHits / totalRequests : 0;
  }

  private recordQueryResult(result: QueryAnalysisResult): void {
    const queryKey = result.query;
    const history = this.queryHistory.get(queryKey) || [];
    history.push(result);

    if (history.length > this.maxHistorySize) {
      history.splice(0, history.length - this.maxHistorySize);
    }

    this.queryHistory.set(queryKey, history);
  }

  private updatePatterns(result: QueryAnalysisResult): void {
    const pattern = this.extractPattern(result.query);
    const existing = this.patterns.get(pattern) || {
      pattern,
      frequency: 0,
      avgExecutionTime: 0,
      avgComplexity: 0,
      successRate: 0,
    };

    existing.frequency++;
    existing.avgExecutionTime = (existing.avgExecutionTime + result.executionTime) / 2;
    existing.avgComplexity = (existing.avgComplexity + result.complexity) / 2;

    this.patterns.set(pattern, existing);
  }

  private extractPattern(query: string): string {
    // 簡化的模式提取，移除變數值
    return query
      .replace(/:\s*[^,}\s)]+/g, ': $var')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private getTopIssues(issues: QueryIssue[]): QueryIssue[] {
    const issueCount = new Map<string, { issue: QueryIssue; count: number }>();

    issues.forEach(issue => {
      const key = `${issue.type}_${issue.message}`;
      const existing = issueCount.get(key);
      if (existing) {
        existing.count++;
      } else {
        issueCount.set(key, { issue, count: 1 });
      }
    });

    return Array.from(issueCount.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => item.issue);
  }

  private getTopSuggestions(suggestions: OptimizationSuggestion[]): OptimizationSuggestion[] {
    const suggestionCount = new Map<
      string,
      { suggestion: OptimizationSuggestion; count: number }
    >();

    suggestions.forEach(suggestion => {
      const key = suggestion.title;
      const existing = suggestionCount.get(key);
      if (existing) {
        existing.count++;
      } else {
        suggestionCount.set(key, { suggestion, count: 1 });
      }
    });

    return Array.from(suggestionCount.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => item.suggestion);
  }

  private generateGeneralRecommendations(results: QueryAnalysisResult[]): string[] {
    const recommendations: string[] = [];

    const avgComplexity = results.reduce((sum, r) => sum + r.complexity, 0) / results.length;
    if (avgComplexity > 200) {
      recommendations.push('總體查詢複雜度偏高，建議實施查詢拆分和 Fragment 復用策略');
    }

    const lowScoreQueries = results.filter(r => r.score < 60).length;
    if (lowScoreQueries > results.length * 0.2) {
      recommendations.push('超過 20% 的查詢性能較差，建議進行系統性優化');
    }

    const avgCacheHitRate = results.reduce((sum, r) => sum + r.cacheHitRate, 0) / results.length;
    if (avgCacheHitRate < 0.5) {
      recommendations.push('緩存命中率偏低，建議調整緩存策略和 TTL 配置');
    }

    return recommendations;
  }
}

export { QueryOptimizer };
export type { QueryAnalysisResult, FieldStats, QueryIssue, OptimizationSuggestion, QueryPattern };
