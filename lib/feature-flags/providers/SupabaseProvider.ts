import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BaseFeatureFlagProvider } from './BaseProvider';
import { FeatureFlag, FeatureFlagStatus } from '../types';

/**
 * Supabase Feature Flag 提供者
 * 使用 Supabase 作為後端存儲
 */
export class SupabaseFeatureFlagProvider extends BaseFeatureFlagProvider {
  private supabase: SupabaseClient;
  private tableName: string = 'feature_flags';
  private pollingInterval?: NodeJS.Timeout;
  private cacheTTL: number;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    options?: {
      tableName?: string;
      cacheTTL?: number;
      pollingInterval?: number;
    }
  ) {
    super();
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.tableName = options?.tableName || this.tableName;
    this.cacheTTL = options?.cacheTTL || 60000; // 默認 1 分鐘
    
    if (options?.pollingInterval) {
      this.startPolling(options.pollingInterval);
    }
  }

  /**
   * 初始化
   */
  async initialize(): Promise<void> {
    // 創建表（如果不存在）
    await this.ensureTableExists();
    
    // 加載初始數據
    await this.refreshCache();
    
    // 設置實時訂閱
    this.setupRealtimeSubscription();
  }

  /**
   * 獲取所有 Feature Flags
   */
  async getAllFlags(): Promise<FeatureFlag[]> {
    // 檢查緩存
    if (this.isCacheValid()) {
      return Array.from(this.cache.values());
    }

    // 從數據庫加載
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching feature flags:', error);
      return Array.from(this.cache.values()); // 返回緩存數據
    }

    // 更新緩存
    const flags = this.transformDbRecords(data || []);
    this.updateCache(flags);
    
    return flags;
  }

  /**
   * 獲取單個 Feature Flag
   */
  async getFlag(key: string): Promise<FeatureFlag | null> {
    // 檢查緩存
    if (this.isCacheValid() && this.cache.has(key)) {
      return this.cache.get(key) || null;
    }

    // 從數據庫加載
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('key', key)
      .single();

    if (error || !data) {
      return null;
    }

    const flag = this.transformDbRecord(data);
    this.cache.set(key, flag);
    
    return flag;
  }

  /**
   * 更新 Feature Flag
   */
  async updateFlag(key: string, updates: Partial<FeatureFlag>): Promise<void> {
    const dbRecord = this.transformToDbRecord(key, updates);
    
    const { error } = await this.supabase
      .from(this.tableName)
      .update(dbRecord)
      .eq('key', key);

    if (error) {
      throw new Error(`Failed to update feature flag: ${error.message}`);
    }

    // 更新緩存
    const existingFlag = this.cache.get(key);
    if (existingFlag) {
      this.cache.set(key, { ...existingFlag, ...updates });
    }
  }

  /**
   * 創建新的 Feature Flag
   */
  async createFlag(flag: FeatureFlag): Promise<void> {
    const dbRecord = this.transformToDbRecord(flag.key, flag);
    
    const { error } = await this.supabase
      .from(this.tableName)
      .insert(dbRecord);

    if (error) {
      throw new Error(`Failed to create feature flag: ${error.message}`);
    }

    // 更新緩存
    this.cache.set(flag.key, flag);
  }

  /**
   * 刪除 Feature Flag
   */
  async deleteFlag(key: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('key', key);

    if (error) {
      throw new Error(`Failed to delete feature flag: ${error.message}`);
    }

    // 從緩存中移除
    this.cache.delete(key);
  }

  /**
   * 清理資源
   */
  dispose(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    // 取消實時訂閱
    this.supabase.removeAllChannels();
  }

  /**
   * 確保表存在
   */
  private async ensureTableExists(): Promise<void> {
    // 注意：這需要適當的數據庫權限
    // 在生產環境中，通常通過遷移腳本創建表
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL DEFAULT 'boolean',
        status VARCHAR(50) NOT NULL DEFAULT 'disabled',
        default_value JSONB,
        rules JSONB,
        variants JSONB,
        rollout_percentage INTEGER,
        start_date TIMESTAMP WITH TIME ZONE,
        end_date TIMESTAMP WITH TIME ZONE,
        tags TEXT[],
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON ${this.tableName}(key);
      CREATE INDEX IF NOT EXISTS idx_feature_flags_status ON ${this.tableName}(status);
      CREATE INDEX IF NOT EXISTS idx_feature_flags_tags ON ${this.tableName} USING GIN(tags);
    `;

    // 執行 SQL（需要適當權限）
    const { error } = await this.supabase.rpc('exec_sql', { 
      sql: createTableSQL 
    }).catch(() => ({ error: 'Table creation skipped' }));

    if (error) {
      console.warn('Could not create feature flags table:', error);
    }
  }

  /**
   * 設置實時訂閱
   */
  private setupRealtimeSubscription(): void {
    this.supabase
      .channel('feature-flags-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: this.tableName
        },
        (payload) => {
          this.handleRealtimeUpdate(payload);
        }
      )
      .subscribe();
  }

  /**
   * 處理實時更新
   */
  private handleRealtimeUpdate(payload: any): void {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
      case 'UPDATE':
        if (newRecord) {
          const flag = this.transformDbRecord(newRecord);
          this.cache.set(flag.key, flag);
        }
        break;
        
      case 'DELETE':
        if (oldRecord) {
          this.cache.delete(oldRecord.key);
        }
        break;
    }

    // 通知訂閱者
    this.notifySubscribers(Array.from(this.cache.values()));
  }

  /**
   * 開始輪詢
   */
  private startPolling(interval: number): void {
    this.pollingInterval = setInterval(() => {
      this.refreshCache();
    }, interval);
  }

  /**
   * 刷新緩存
   */
  private async refreshCache(): Promise<void> {
    const flags = await this.getAllFlags();
    this.updateCache(flags);
  }

  /**
   * 更新緩存
   */
  private updateCache(flags: FeatureFlag[]): void {
    this.cache.clear();
    flags.forEach(flag => this.cache.set(flag.key, flag));
    this.cacheExpiry = Date.now() + this.cacheTTL;
  }

  /**
   * 檢查緩存是否有效
   */
  private isCacheValid(): boolean {
    return Date.now() < this.cacheExpiry;
  }

  /**
   * 轉換數據庫記錄為 FeatureFlag
   */
  private transformDbRecord(record: any): FeatureFlag {
    return {
      key: record.key,
      name: record.name,
      description: record.description,
      type: record.type,
      status: record.status as FeatureFlagStatus,
      defaultValue: record.default_value,
      rules: record.rules || [],
      variants: record.variants || [],
      rolloutPercentage: record.rollout_percentage,
      startDate: record.start_date ? new Date(record.start_date) : undefined,
      endDate: record.end_date ? new Date(record.end_date) : undefined,
      tags: record.tags || [],
      metadata: record.metadata || {}
    };
  }

  /**
   * 轉換數據庫記錄數組
   */
  private transformDbRecords(records: any[]): FeatureFlag[] {
    return records.map(record => this.transformDbRecord(record));
  }

  /**
   * 轉換 FeatureFlag 為數據庫記錄
   */
  private transformToDbRecord(key: string, flag: Partial<FeatureFlag>): any {
    const record: any = {
      key,
      updated_at: new Date().toISOString()
    };

    if (flag.name !== undefined) record.name = flag.name;
    if (flag.description !== undefined) record.description = flag.description;
    if (flag.type !== undefined) record.type = flag.type;
    if (flag.status !== undefined) record.status = flag.status;
    if (flag.defaultValue !== undefined) record.default_value = flag.defaultValue;
    if (flag.rules !== undefined) record.rules = flag.rules;
    if (flag.variants !== undefined) record.variants = flag.variants;
    if (flag.rolloutPercentage !== undefined) record.rollout_percentage = flag.rolloutPercentage;
    if (flag.startDate !== undefined) record.start_date = flag.startDate?.toISOString();
    if (flag.endDate !== undefined) record.end_date = flag.endDate?.toISOString();
    if (flag.tags !== undefined) record.tags = flag.tags;
    if (flag.metadata !== undefined) record.metadata = flag.metadata;

    return record;
  }
}