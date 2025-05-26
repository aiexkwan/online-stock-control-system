const { createClient } = require('@supabase/supabase-js');

async function getDetailedDatabaseInfo() {
    const supabaseUrl = 'https://bbmkuiplnzvpudszrend.supabase.co';
    const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWt1aXBsbnp2cHVkc3pyZW5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTcxNTYwNCwiZXhwIjoyMDYxMjkxNjA0fQ.B0pQF2V0kWdrU2_2VEYXR6qxZzt2oMDvwxD7qiR3huM';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🔍 開始詳細檢查Supabase資料庫...\n');
    
    // 擴展的已知表格列表
    const knownTables = [
        'users', 'products', 'inventory', 'transactions', 'orders', 'customers',
        'suppliers', 'categories', 'stock_movements', 'purchase_orders',
        'sales_orders', 'invoices', 'payments', 'locations', 'warehouses',
        'items', 'batches', 'lots', 'serial_numbers', 'barcodes',
        'audit_logs', 'user_sessions', 'permissions', 'roles',
        'settings', 'configurations', 'reports', 'notifications'
    ];
    
    const foundTables = [];
    
    console.log('📊 檢查已知表格:');
    console.log('='.repeat(80));
    
    for (const tableName of knownTables) {
        try {
            // 嘗試獲取表格的記錄數
            const { data, error, count } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });
            
            if (!error) {
                foundTables.push(tableName);
                console.log(`✅ ${tableName} (記錄數: ${count || 0})`);
                
                // 獲取表格的樣本數據來了解結構
                const { data: sample, error: sampleError } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);
                
                if (!sampleError && sample && sample.length > 0) {
                    console.log('   欄位結構:');
                    Object.entries(sample[0]).forEach(([column, value]) => {
                        const type = value === null ? 'null' : typeof value;
                        const displayValue = value === null ? 'NULL' : 
                                           type === 'string' && value.length > 50 ? 
                                           `"${value.substring(0, 47)}..."` : 
                                           JSON.stringify(value);
                        console.log(`     • ${column}: ${type} (範例: ${displayValue})`);
                    });
                } else if (!sampleError && sample && sample.length === 0) {
                    console.log('   ⚠️  表格為空，無法獲取欄位結構');
                } else {
                    console.log(`   ❌ 無法獲取樣本數據: ${sampleError?.message}`);
                }
                console.log('');
            }
        } catch (e) {
            // 靜默忽略不存在的表格
        }
    }
    
    console.log(`\n📈 總結: 找到 ${foundTables.length} 個表格`);
    console.log('='.repeat(80));
    
    if (foundTables.length > 0) {
        console.log('✅ 存在的表格:');
        foundTables.forEach(table => console.log(`   • ${table}`));
        
        // 獲取每個表格的詳細統計信息
        console.log('\n📊 詳細統計信息:');
        console.log('-'.repeat(80));
        
        for (const tableName of foundTables) {
            try {
                const { count } = await supabase
                    .from(tableName)
                    .select('*', { count: 'exact', head: true });
                
                console.log(`${tableName.padEnd(20)} | ${(count || 0).toString().padStart(8)} 筆記錄`);
            } catch (e) {
                console.log(`${tableName.padEnd(20)} | ${'錯誤'.padStart(8)}`);
            }
        }
    }
    
    // 檢查Auth用戶
    console.log('\n👥 Auth系統信息:');
    console.log('-'.repeat(80));
    try {
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        if (!authError) {
            console.log(`✅ 註冊用戶總數: ${authUsers.users.length}`);
            
            // 顯示前幾個用戶的基本信息
            if (authUsers.users.length > 0) {
                console.log('\n前5個用戶:');
                authUsers.users.slice(0, 5).forEach((user, index) => {
                    console.log(`   ${index + 1}. ${user.email} (ID: ${user.id.substring(0, 8)}...)`);
                    console.log(`      建立時間: ${new Date(user.created_at).toLocaleString('zh-TW')}`);
                    console.log(`      最後登入: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('zh-TW') : '從未登入'}`);
                });
            }
        } else {
            console.log(`❌ 無法獲取Auth用戶: ${authError.message}`);
        }
    } catch (e) {
        console.log(`❌ Auth系統錯誤: ${e.message}`);
    }
    
    // 嘗試獲取Storage信息
    console.log('\n💾 Storage信息:');
    console.log('-'.repeat(80));
    try {
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        if (!bucketsError && buckets) {
            console.log(`✅ Storage Buckets: ${buckets.length}`);
            buckets.forEach(bucket => {
                console.log(`   • ${bucket.name} (${bucket.public ? '公開' : '私有'})`);
            });
        } else {
            console.log('❌ 無法獲取Storage信息');
        }
    } catch (e) {
        console.log('❌ Storage系統錯誤');
    }
}

// 運行函數
getDetailedDatabaseInfo().then(() => {
    console.log('\n🎉 資料庫檢查完成！');
}).catch(error => {
    console.error('❌ 執行失敗:', error);
}); 