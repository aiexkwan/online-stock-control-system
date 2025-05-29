// JWT 解碼腳本
const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWt1aXBsbnp2cHVkc3pyZW5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY4MDAxNTYwNCwiZXhwIjoxOTk1NTkxNjA0fQ.lkRDHLCdZdP4YE5c3XFu_G26F1O_N1fxEP2Wa3M1NtM";

console.log('=== JWT 解碼分析 ===');

try {
  const parts = jwt.split('.');
  if (parts.length === 3) {
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    
    console.log('Header:', header);
    console.log('Payload:', payload);
    
    const issuedAt = new Date(payload.iat * 1000);
    const expiresAt = new Date(payload.exp * 1000);
    const now = new Date();
    
    console.log('\n=== 時間分析 ===');
    console.log('發行時間 (iat):', issuedAt.toISOString());
    console.log('過期時間 (exp):', expiresAt.toISOString());
    console.log('當前時間:', now.toISOString());
    console.log('是否過期:', now > expiresAt ? '✗ 已過期' : '✓ 未過期');
    
    console.log('\n=== 角色檢查 ===');
    console.log('角色 (role):', payload.role);
    console.log('發行者 (iss):', payload.iss);
    console.log('項目參考 (ref):', payload.ref);
    
  } else {
    console.error('JWT 格式無效');
  }
} catch (error) {
  console.error('JWT 解碼失敗:', error.message);
}

console.log('\n=== 分析完成 ==='); 