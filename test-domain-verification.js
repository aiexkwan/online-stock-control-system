// 測試域名驗證助手工具
// 在瀏覽器控制台中運行此腳本

console.log('=== 域名驗證助手工具測試 ===');

// 測試診斷功能
if (typeof window !== 'undefined') {
  // 模擬導入（在實際使用中，這些會通過正常的模塊導入）
  const testDomainVerification = () => {
    console.log('1. 測試環境信息:');
    console.log('   - 當前域名:', window.location.hostname);
    console.log('   - 環境:', process.env.NODE_ENV || 'development');
    console.log('   - localStorage 可用:', typeof localStorage !== 'undefined');
    
    console.log('\n2. 檢查本地存儲:');
    const storageKey = 'pennine_secure_login_domain_verified';
    const item = localStorage.getItem(storageKey);
    if (item) {
      try {
        const parsed = JSON.parse(item);
        console.log('   - 驗證標記存在:', parsed);
        console.log('   - 過期時間:', new Date(parsed.expires));
        console.log('   - 是否過期:', Date.now() > parsed.expires);
        console.log('   - 存儲域名:', parsed.domain);
        console.log('   - 域名匹配:', parsed.domain === window.location.hostname);
      } catch (error) {
        console.log('   - 驗證標記格式錯誤:', error);
      }
    } else {
      console.log('   - 驗證標記不存在');
    }
    
    console.log('\n3. 建議的修復步驟:');
    console.log('   - 如果遇到 "Domain verification failed" 錯誤:');
    console.log('   - 1. 檢查是否已登入');
    console.log('   - 2. 嘗試重新登入');
    console.log('   - 3. 清除瀏覽器緩存');
    console.log('   - 4. 在開發環境下，系統會自動嘗試恢復');
    
    console.log('\n4. 手動恢復測試:');
    console.log('   - 運行以下命令來手動恢復驗證:');
    console.log('   - domainVerificationHelper.recover()');
    console.log('   - domainVerificationHelper.diagnose()');
  };
  
  // 運行測試
  testDomainVerification();
  
  // 提供手動測試函數
  window.testDomainVerification = testDomainVerification;
  
  console.log('\n=== 測試完成 ===');
  console.log('可以運行 testDomainVerification() 來重新測試');
} else {
  console.log('此腳本需要在瀏覽器環境中運行');
} 