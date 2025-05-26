const { createClient } = require('@supabase/supabase-js');

async function getRealDatabaseInfo() {
    const supabaseUrl = 'https://bbmkuiplnzvpudszrend.supabase.co';
    const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWt1aXBsbnp2cHVkc3pyZW5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTcxNTYwNCwiZXhwIjoyMDYxMjkxNjA0fQ.B0pQF2V0kWdrU2_2VEYXR6qxZzt2oMDvwxD7qiR3huM';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🔍 使用SQL查詢獲取實際的資料庫結構...\n');
    
    try {
        // 查詢所有實際存在的表格
        const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
            sql: `
                SELECT 
                    schemaname,
                    tablename,
                    tableowner,
                    hasindexes,
                    hasrules,
                    hastriggers
                FROM pg_tables 
                WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
                ORDER BY schemaname, tablename;
            `
        });
        
        if (tablesError) {
            console.log('❌ 無法使用RPC執行SQL，嘗試替代方法...');
            
            // 嘗試使用PostgREST的直接查詢
            const { data: pgTables, error: pgError } = await supabase
                .from('pg_tables')
                .select('schemaname, tablename, tableowner')
                .not('schemaname', 'in', '(information_schema,pg_catalog,pg_toast)')
                .order('schemaname')
                .order('tablename');
            
            if (pgError) {
                console.log('❌ 無法直接查詢pg_tables，使用手動檢查方法...');
                await manualTableCheck(supabase);
                return;
            } else {
                console.log('✅ 使用pg_tables查詢成功');
                await displayTables(pgTables, supabase);
                return;
            }
        }
        
        console.log('✅ 使用RPC查詢成功');
        await displayTables(tables, supabase);
        
    } catch (error) {
        console.error('❌ 查詢失敗，使用手動檢查:', error.message);
        await manualTableCheck(supabase);
    }
}

async function displayTables(tables, supabase) {
    console.log(`📊 找到 ${tables.length} 個實際表格:`);
    console.log('='.repeat(80));
    
    let currentSchema = null;
    for (const table of tables) {
        if (table.schemaname !== currentSchema) {
            currentSchema = table.schemaname;
            console.log(`\n🗂️  Schema: ${currentSchema}`);
            console.log('-'.repeat(40));
        }
        
        console.log(`   📋 ${table.tablename} (擁有者: ${table.tableowner})`);
        
        // 獲取表格的欄位信息
        try {
            const { data: columns, error: colError } = await supabase.rpc('exec_sql', {
                sql: `
                    SELECT 
                        column_name,
                        data_type,
                        is_nullable,
                        column_default,
                        character_maximum_length,
                        numeric_precision,
                        numeric_scale
                    FROM information_schema.columns 
                    WHERE table_schema = '${table.schemaname}' 
                    AND table_name = '${table.tablename}'
                    ORDER BY ordinal_position;
                `
            });
            
            if (!colError && columns && columns.length > 0) {
                console.log('      欄位:');
                columns.forEach(col => {
                    const nullable = col.is_nullable === 'YES' ? '可空' : '不可空';
                    const defaultVal = col.column_default ? ` (預設: ${col.column_default})` : '';
                    let typeInfo = col.data_type;
                    
                    if (col.character_maximum_length) {
                        typeInfo += `(${col.character_maximum_length})`;
                    } else if (col.numeric_precision) {
                        typeInfo += `(${col.numeric_precision}${col.numeric_scale ? ',' + col.numeric_scale : ''})`;
                    }
                    
                    console.log(`        • ${col.column_name}: ${typeInfo} - ${nullable}${defaultVal}`);
                });
            }
        } catch (e) {
            console.log('      ❌ 無法獲取欄位信息');
        }
        
        // 獲取記錄數
        try {
            const { count } = await supabase
                .from(table.tablename)
                .select('*', { count: 'exact', head: true });
            console.log(`      📊 記錄數: ${count || 0}`);
        } catch (e) {
            console.log('      📊 記錄數: 無法獲取');
        }
        
        console.log('');
    }
}

async function manualTableCheck(supabase) {
    console.log('🔍 手動檢查常見的表格名稱...\n');
    
    // 更實際的表格名稱列表
    const commonTables = [
        // 基本業務表格
        'users', 'user_profiles', 'profiles',
        'products', 'items', 'inventory', 'stock',
        'orders', 'order_items', 'transactions',
        'customers', 'suppliers', 'vendors',
        'categories', 'brands', 'manufacturers',
        
        // 庫存管理
        'warehouses', 'locations', 'bins',
        'stock_movements', 'inventory_transactions',
        'purchase_orders', 'sales_orders',
        'receipts', 'shipments', 'deliveries',
        
        // 財務
        'invoices', 'payments', 'billing',
        'accounts', 'ledger', 'journal_entries',
        
        // 系統表格
        'audit_logs', 'activity_logs', 'system_logs',
        'settings', 'configurations', 'parameters',
        'permissions', 'roles', 'user_roles',
        'sessions', 'tokens', 'api_keys',
        
        // 報告和分析
        'reports', 'analytics', 'metrics',
        'dashboards', 'charts', 'kpis',
        
        // 通知和消息
        'notifications', 'messages', 'alerts',
        'emails', 'sms', 'push_notifications'
    ];
    
    const realTables = [];
    
    for (const tableName of commonTables) {
        try {
            // 嘗試獲取表格結構
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(0);
            
            if (!error) {
                realTables.push(tableName);
                console.log(`✅ ${tableName}`);
                
                // 獲取記錄數
                const { count } = await supabase
                    .from(tableName)
                    .select('*', { count: 'exact', head: true });
                
                console.log(`   📊 記錄數: ${count || 0}`);
                
                // 獲取樣本數據來了解結構
                const { data: sample } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);
                
                if (sample && sample.length > 0) {
                    console.log('   欄位:');
                    Object.keys(sample[0]).forEach(column => {
                        console.log(`     • ${column}`);
                    });
                }
                console.log('');
            }
        } catch (e) {
            // 靜默忽略
        }
    }
    
    console.log(`\n📈 總結: 找到 ${realTables.length} 個實際可訪問的表格`);
    if (realTables.length > 0) {
        console.log('✅ 實際存在的表格:');
        realTables.forEach(table => console.log(`   • ${table}`));
    }
}

// 運行函數
getRealDatabaseInfo().then(() => {
    console.log('\n🎉 資料庫結構檢查完成！');
}).catch(error => {
    console.error('❌ 執行失敗:', error);
}); 