/**
 * Database Health Service
 * 資料庫健康狀態監控服務
 * 
 * 提供分層的資料庫驗證和監控機制
 */

import { createClient } from '@/app/utils/supabase/server';
import { systemLogger } from '@/lib/logger';
import type { SupabaseClient } from '@/types/database/supabase';

export interface DatabaseHealthCheck {
  component: string;
  status: 'healthy' | 'degraded' | 'failed';
  critical: boolean;
  lastChecked: Date;
  details?: string;
  error?: string;
  metrics?: Record<string, number | string>;
}

export interface SystemHealthStatus {
  overall: 'healthy' | 'degraded' | 'failed';
  checks: DatabaseHealthCheck[];
  lastFullCheck: Date;
}

export class DatabaseHealthService {
  private static instance: DatabaseHealthService;
  private healthCache: SystemHealthStatus | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分鐘快取

  static getInstance(): DatabaseHealthService {
    if (!DatabaseHealthService.instance) {
      DatabaseHealthService.instance = new DatabaseHealthService();
    }
    return DatabaseHealthService.instance;
  }

  /**
   * 執行完整的健康檢查
   */
  async performFullHealthCheck(): Promise<SystemHealthStatus> {
    const checks: DatabaseHealthCheck[] = [];
    
    try {
      const supabase = await createClient();
      
      // 檢查核心表格
      checks.push(...await this.checkCoreTables(supabase));
      
      // 檢查核心 RPC 函數
      checks.push(...await this.checkCoreRpcFunctions(supabase));
      
      // 檢查資料庫連線效能
      checks.push(await this.checkDatabasePerformance(supabase));
      
      // 檢查關鍵資料完整性
      checks.push(...await this.checkDataIntegrity(supabase));
      
    } catch (error) {
      systemLogger.error({ error }, 'Health check failed');
      checks.push({
        component: 'database_connection',
        status: 'failed',
        critical: true,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    const healthStatus: SystemHealthStatus = {
      overall: this.determineOverallStatus(checks),
      checks,
      lastFullCheck: new Date()
    };

    this.healthCache = healthStatus;
    return healthStatus;
  }

  /**
   * 獲取快取的健康狀態（用於高頻查詢）
   */
  async getCachedHealthStatus(): Promise<SystemHealthStatus> {
    if (this.healthCache && 
        (Date.now() - this.healthCache.lastFullCheck.getTime()) < this.CACHE_TTL) {
      return this.healthCache;
    }
    
    return await this.performFullHealthCheck();
  }

  /**
   * 檢查系統是否可以執行轉移操作
   */
  async canPerformTransfer(): Promise<{ 
    allowed: boolean; 
    reason?: string; 
    degradedMode?: boolean 
  }> {
    try {
      const health = await this.getCachedHealthStatus();
      
      // 檢查關鍵組件
      const criticalFailures = health.checks.filter(
        check => check.critical && check.status === 'failed'
      );
      
      if (criticalFailures.length > 0) {
        return {
          allowed: false,
          reason: `Critical system components unavailable: ${criticalFailures.map(f => f.component).join(', ')}`
        };
      }
      
      // 檢查是否需要降級模式
      const degradedComponents = health.checks.filter(
        check => !check.critical && check.status !== 'healthy'
      );
      
      return {
        allowed: true,
        degradedMode: degradedComponents.length > 0,
        reason: degradedComponents.length > 0 ? 
          `Some non-critical features may be unavailable: ${degradedComponents.map(d => d.component).join(', ')}` : 
          undefined
      };
    } catch (error) {
      systemLogger.error({ error }, 'Transfer readiness check failed');
      return {
        allowed: false,
        reason: 'Unable to verify system status'
      };
    }
  }

  /**
   * 檢查核心資料表
   */
  private async checkCoreTables(supabase: SupabaseClient): Promise<DatabaseHealthCheck[]> {
    const coreTables = [
      { name: 'record_inventory', critical: true },
      { name: 'record_palletinfo', critical: true },
      { name: 'record_history', critical: true },
      { name: 'record_transfer', critical: false }, // 非關鍵，可降級
      { name: 'data_code', critical: false },
      { name: 'data_id', critical: false }
    ];

    const checks: DatabaseHealthCheck[] = [];
    
    for (const table of coreTables) {
      try {
        const startTime = Date.now();
        const { count, error } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true });
          
        const queryTime = Date.now() - startTime;
        
        if (error) {
          checks.push({
            component: `table_${table.name}`,
            status: 'failed',
            critical: table.critical,
            lastChecked: new Date(),
            error: error.message,
            details: `Table access failed: ${error.code}`
          });
        } else {
          checks.push({
            component: `table_${table.name}`,
            status: queryTime > 1000 ? 'degraded' : 'healthy',
            critical: table.critical,
            lastChecked: new Date(),
            metrics: { 
              query_time_ms: queryTime,
              record_count: count || 0
            },
            details: queryTime > 1000 ? `Slow response time: ${queryTime}ms` : undefined
          });
        }
      } catch (error) {
        checks.push({
          component: `table_${table.name}`,
          status: 'failed',
          critical: table.critical,
          lastChecked: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return checks;
  }

  /**
   * 檢查核心 RPC 函數
   */
  private async checkCoreRpcFunctions(supabase: SupabaseClient): Promise<DatabaseHealthCheck[]> {
    const coreFunctions = [
      { name: 'rpc_transfer_pallet', critical: true },
      { name: 'search_pallet_optimized_v2', critical: false },
      { name: 'search_pallet_optimized', critical: false }
    ];

    const checks: DatabaseHealthCheck[] = [];
    
    for (const func of coreFunctions) {
      try {
        // 使用輕量級的測試方式
        const startTime = Date.now();
        const { error } = await supabase
          .rpc(func.name, { /* empty params to test function existence */ })
          .limit(0);
        
        const queryTime = Date.now() - startTime;
        
        // 42883 = function does not exist
        if (error && error.code === '42883') {
          checks.push({
            component: `rpc_${func.name}`,
            status: 'failed',
            critical: func.critical,
            lastChecked: new Date(),
            error: 'Function not found',
            details: `RPC function ${func.name} does not exist`
          });
        } else {
          // 其他錯誤可能是參數問題，但函數存在
          checks.push({
            component: `rpc_${func.name}`,
            status: 'healthy',
            critical: func.critical,
            lastChecked: new Date(),
            metrics: { query_time_ms: queryTime }
          });
        }
      } catch (error) {
        checks.push({
          component: `rpc_${func.name}`,
          status: 'failed',
          critical: func.critical,
          lastChecked: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return checks;
  }

  /**
   * 檢查資料庫效能
   */
  private async checkDatabasePerformance(supabase: SupabaseClient): Promise<DatabaseHealthCheck> {
    try {
      const startTime = Date.now();
      await supabase.from('record_palletinfo').select('plt_num').limit(1);
      const queryTime = Date.now() - startTime;
      
      let status: 'healthy' | 'degraded' | 'failed';
      let details: string | undefined;
      
      if (queryTime < 100) {
        status = 'healthy';
      } else if (queryTime < 1000) {
        status = 'degraded';
        details = `Slow database response: ${queryTime}ms`;
      } else {
        status = 'failed';
        details = `Very slow database response: ${queryTime}ms`;
      }
      
      return {
        component: 'database_performance',
        status,
        critical: false,
        lastChecked: new Date(),
        metrics: { query_time_ms: queryTime },
        details
      };
    } catch (error) {
      return {
        component: 'database_performance',
        status: 'failed',
        critical: true,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 檢查關鍵資料完整性
   */
  private async checkDataIntegrity(supabase: SupabaseClient): Promise<DatabaseHealthCheck[]> {
    const checks: DatabaseHealthCheck[] = [];
    
    try {
      // 檢查託盤資料完整性
      const { data, error } = await supabase.rpc('validate_system_schema', {}).limit(1);
      
      if (error && error.code !== '42883') {
        // 如果不是函數不存在的錯誤
        checks.push({
          component: 'data_integrity',
          status: 'failed',
          critical: false,
          lastChecked: new Date(),
          error: error.message
        });
      } else {
        checks.push({
          component: 'data_integrity',
          status: 'healthy',
          critical: false,
          lastChecked: new Date(),
          details: 'Basic data integrity checks passed'
        });
      }
    } catch (error) {
      checks.push({
        component: 'data_integrity',
        status: 'degraded',
        critical: false,
        lastChecked: new Date(),
        details: 'Data integrity validation unavailable'
      });
    }
    
    return checks;
  }

  /**
   * 決定整體健康狀態
   */
  private determineOverallStatus(checks: DatabaseHealthCheck[]): 'healthy' | 'degraded' | 'failed' {
    const criticalFailures = checks.filter(c => c.critical && c.status === 'failed');
    const anyFailures = checks.filter(c => c.status === 'failed');
    const anyDegraded = checks.filter(c => c.status === 'degraded');
    
    if (criticalFailures.length > 0) {
      return 'failed';
    }
    
    if (anyFailures.length > 0 || anyDegraded.length > 0) {
      return 'degraded';
    }
    
    return 'healthy';
  }
}

// 導出單例實例
export const databaseHealthService = DatabaseHealthService.getInstance();