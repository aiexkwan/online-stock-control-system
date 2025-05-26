const { createClient } = require('@supabase/supabase-js');

async function getDatabaseInfo() {
    // 從環境變數或直接設定Supabase配置
    const supabaseUrl = 'https://bbmkuiplnzvpudszrend.supabase.co';
    const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWt1aXBsbnp2cHVkc3pyZW5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTcxNTYwNCwiZXhwIjoyMDYxMjkxNjA0fQ.B0pQF2V0kWdrU2_2VEYXR6qxZzt2oMDvwxD7qiR3huM';
    
    // 創建Supabase客戶端（使用service role key以獲得完整權限）
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('✅ Supabase客戶端已初始化');
    
    try {
        // 使用RPC調用來獲取所有表格信息
        const { data: tables, error: tablesError } = await supabase.rpc('get_all_tables_info');
        
        if (tablesError) {
            console.log('📝 RPC函數不存在，使用直接SQL查詢...');
            
            // 直接執行SQL查詢獲取表格列表
            const { data: tablesList, error: listError } = await supabase
                .from('information_schema.tables')
                .select('table_schema, table_name, table_type')
                .not('table_schema', 'in', '(information_schema,pg_catalog,pg_toast)')
                .order('table_schema')
                .order('table_name');
            
            if (listError) {
                console.log('❌ 無法直接查詢information_schema，嘗試使用現有表格...');
                
                // 嘗試列出一些已知的表格
                const knownTables = ['users', 'products', 'inventory', 'transactions', 'auth.users'];
                
                console.log('\n📊 嘗試檢查已知表格:');
                console.log('=' * 80);
                
                for (const tableName of knownTables) {
                    try {
                        const { data, error, count } = await supabase
                            .from(tableName)
                            .select('*', { count: 'exact', head: true });
                        
                        if (!error) {
                            console.log(`✅ 表格: ${tableName} (記錄數: ${count})`);
                            
                            // 獲取表格的第一行來了解結構
                            const { data: sample, error: sampleError } = await supabase
                                .from(tableName)
                                .select('*')
                                .limit(1);
                            
                            if (!sampleError && sample && sample.length > 0) {
                                console.log('   欄位:');
                                Object.keys(sample[0]).forEach(column => {
                                    console.log(`     • ${column}: ${typeof sample[0][column]}`);
                                });
                            }
                        } else {
                            console.log(`❌ 表格: ${tableName} - ${error.message}`);
                        }
                    } catch (e) {
                        console.log(`❌ 表格: ${tableName} - ${e.message}`);
                    }
                }
            } else {
                console.log('\n📊 找到的表格:');
                console.log('=' * 80);
                
                let currentSchema = null;
                for (const table of tablesList) {
                    if (table.table_schema !== currentSchema) {
                        currentSchema = table.table_schema;
                        console.log(`\n🗂️  Schema: ${currentSchema}`);
                        console.log('-' * 40);
                    }
                    console.log(`   📋 ${table.table_name} (${table.table_type})`);
                }
            }
        } else {
            console.log('✅ 成功獲取表格信息:', tables);
        }
        
        // 嘗試獲取一些基本的資料庫統計信息
        console.log('\n📈 嘗試獲取資料庫統計信息...');
        
        // 檢查auth schema
        try {
            const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
            if (!authError) {
                console.log(`✅ Auth用戶數量: ${authUsers.users.length}`);
            }
        } catch (e) {
            console.log('❌ 無法獲取auth用戶信息');
        }
        
    } catch (error) {
        console.error('❌ 發生錯誤:', error);
    }
}

// 運行函數
getDatabaseInfo().then(() => {
    console.log('\n✅ 完成');
}).catch(error => {
    console.error('❌ 執行失敗:', error);
}); 