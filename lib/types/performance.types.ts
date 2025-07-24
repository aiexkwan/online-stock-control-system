/**
 * Performance Benchmark Types
 * 效能監控專用類型定義
 */

// 品牌類型確保度量單位正確性
export type Milliseconds = number & { readonly brand: 'milliseconds' };
export type Bytes = number & { readonly brand: 'bytes' };
export type Percentage = number & { readonly brand: 'percentage' };

// 類型安全的效能指標
export interface TypeSafePerformanceMetrics {
  endpoint: string;
  responseTime: Milliseconds;
  payloadSize: Bytes;
  memoryUsage: Bytes;
  networkRequests: number;
  dbQueries: number;
  timestamp: number;
  userAgent?: string;
  errorCount: number;
}

// 效能統計摘要接口
export interface PerformanceSummary {
  avgResponseTime: number;
  p95ResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  totalTests: number;
  errorRate: number;
}

// Memory API 類型守衛
export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface PerformanceWithMemory extends Performance {
  memory?: MemoryInfo;
}

// 基準測試配置
export interface BenchmarkTest<TResponse = unknown> {
  name: string;
  endpoint: string;
  apiCall: () => Promise<TResponse>;
  expectedDbQueries?: number;
  iterations?: number;
}

// JSON 序列化類型
export type JSONSerializable = 
  | string 
  | number 
  | boolean 
  | null 
  | JSONSerializable[] 
  | { [key: string]: JSONSerializable };

// 類型守衛函數
export function hasMemoryAPI(perf: Performance): perf is PerformanceWithMemory {
  return 'memory' in perf && 
         typeof (perf as unknown as PerformanceWithMemory).memory === 'object' &&
         (perf as unknown as PerformanceWithMemory).memory !== null;
}

export function isJSONSerializable(data: unknown): data is JSONSerializable {
  if (data === null || 
      typeof data === 'string' || 
      typeof data === 'number' || 
      typeof data === 'boolean') {
    return true;
  }
  
  if (Array.isArray(data)) {
    return data.every(isJSONSerializable);
  }
  
  if (typeof data === 'object' && data !== null) {
    try {
      JSON.stringify(data);
      return Object.values(data).every(isJSONSerializable);
    } catch {
      return false;
    }
  }
  
  return false;
}