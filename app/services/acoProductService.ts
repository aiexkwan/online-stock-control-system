/**
 * ACO Product Service
 * 動態從資料庫查詢 ACO 產品，避免硬編碼
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

export class ACOProductService {
  private static instance: ACOProductService;
  private supabase: SupabaseClient<Database> | null = null;
  private acoProductsCache: Set<string> | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分鐘快取

  private constructor() {}
  
  /**
   * 延遲初始化 Supabase 客戶端
   */
  private getSupabase(): SupabaseClient<Database> {
    if (!this.supabase) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!url || !key) {
        throw new Error('Supabase URL and key are required');
      }
      
      this.supabase = createClient<Database>(url, key);
    }
    return this.supabase;
  }

  public static getInstance(): ACOProductService {
    if (!ACOProductService.instance) {
      ACOProductService.instance = new ACOProductService();
    }
    return ACOProductService.instance;
  }

  /**
   * 從資料庫載入所有 type='ACO' 的產品代碼
   */
  private async loadACOProducts(): Promise<Set<string>> {
    try {
      console.log('[ACOProductService] Loading ACO products from database...');
      
      const { data, error } = await this.getSupabase()
        .from('data_code')
        .select('code')
        .eq('type', 'ACO');
      
      if (error) {
        console.error('[ACOProductService] Database query error:', error);
        // 返回空集合，讓系統繼續運作
        return new Set();
      }
      
      const codes = new Set(data?.map(item => item.code.toUpperCase()) || []);
      console.log(`[ACOProductService] Loaded ${codes.size} ACO products from database`);
      
      return codes;
    } catch (error) {
      console.error('[ACOProductService] Unexpected error:', error);
      return new Set();
    }
  }

  /**
   * 檢查產品代碼是否為 ACO 產品
   */
  public async isACOProduct(productCode: string): Promise<boolean> {
    if (!productCode) return false;
    
    // 檢查快取是否過期
    if (!this.acoProductsCache || Date.now() > this.cacheExpiry) {
      this.acoProductsCache = await this.loadACOProducts();
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;
    }
    
    return this.acoProductsCache.has(productCode.toUpperCase());
  }

  /**
   * 批量檢查多個產品代碼
   */
  public async filterACOProducts(productCodes: string[]): Promise<string[]> {
    if (!productCodes || productCodes.length === 0) return [];
    
    // 確保快取已載入
    if (!this.acoProductsCache || Date.now() > this.cacheExpiry) {
      this.acoProductsCache = await this.loadACOProducts();
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;
    }
    
    return productCodes.filter(code => 
      this.acoProductsCache!.has(code.toUpperCase())
    );
  }

  /**
   * 清除快取（用於測試或強制重新載入）
   */
  public clearCache(): void {
    this.acoProductsCache = null;
    this.cacheExpiry = 0;
  }

  /**
   * 獲取所有 ACO 產品代碼（用於調試）
   */
  public async getAllACOProducts(): Promise<string[]> {
    if (!this.acoProductsCache || Date.now() > this.cacheExpiry) {
      this.acoProductsCache = await this.loadACOProducts();
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;
    }
    
    return Array.from(this.acoProductsCache);
  }
}

// 導出單例實例
export default ACOProductService.getInstance();