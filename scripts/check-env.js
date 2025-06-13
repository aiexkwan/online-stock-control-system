// 檢查環境變數腳本
console.log('=== 環境變數檢查 ===');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ 已設置' : '✗ 未設置');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ 已設置' : '✗ 未設置');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ 已設置' : '✗ 未設置');

// 檢查 Service Role Key 格式
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log('Service Role Key 長度:', key.length);
  console.log('Service Role Key 開頭:', key.substring(0, 20) + '...');
  
  // 嘗試解碼 JWT
  try {
    const parts = key.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log('JWT Payload:', {
        role: payload.role,
        iss: payload.iss,
        exp: new Date(payload.exp * 1000).toISOString()
      });
    }
  } catch (error) {
    console.error('JWT 解碼失敗:', error.message);
  }
}

console.log('=== 檢查完成 ==='); 