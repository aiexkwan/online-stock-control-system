/**
 * 系統常量配置
 * 集中管理所有環境變量和常量
 */

// Supabase 配置
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 驗證環境變量
export function validateEnvironment(): void {
  const requiredVars = [
    { name: 'NEXT_PUBLIC_SUPABASE_URL', value: SUPABASE_URL },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: SUPABASE_ANON_KEY },
  ];

  const missing = requiredVars.filter(v => !v.value);

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.map(v => v.name).join(', '));
    // 在開發環境中警告，在生產環境中可能需要拋出錯誤
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        `Missing critical environment variables: ${missing.map(v => v.name).join(', ')}`
      );
    }
  }
}

// 獲取動態的 Supabase URL（用於客戶端渲染）
export function getSupabaseUrl(): string {
  if (typeof window !== 'undefined') {
    // 客戶端：從環境變量獲取
    return SUPABASE_URL;
  }
  // 服務端：直接使用環境變量
  return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
}

// 資源 URL 生成器
export function getStorageUrl(path: string): string {
  const baseUrl = getSupabaseUrl();
  if (!baseUrl) {
    console.warn('Supabase URL not configured');
    return '';
  }
  return `${baseUrl}/storage/v1/object/public/${path}`;
}

// Logo URL
export function getLogoUrl(): string {
  return getStorageUrl('web-ui/P_Logo_DB.PNG');
}
