const { createClient } = require('@supabase/supabase-js');

async function checkActualTables() {
    const supabaseUrl = 'https://bbmkuiplnzvpudszrend.supabase.co';
    const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWt1aXBsbnp2cHVkc3pyZW5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTcxNTYwNCwiZXhwIjoyMDYxMjkxNjA0fQ.B0pQF2V0kWdrU2_2VEYXR6qxZzt2oMDvwxD7qiR3huM';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🔍 檢查從Supabase控制台看到的實際表格...\n');
    
    // 基於Supabase控制台截圖的實際表格列表
    const actualTables = [
        'data_code',         // 8,411 筆記錄
        'data_id',           // 22 筆記錄
        'data_slateinfo',    // 14 筆記錄
        'data_supplier',     // 64 筆記錄
        'debug_log',         // 0 筆記錄
        'record_aco',        // 1 筆記錄
        'record_grn',        // 0 筆記錄
        'record_history',    // 11 筆記錄
        'record_inventory',  // 11 筆記錄
        'record_palletinfo', // 11 筆記錄
        'record_slate',      // 0 筆記錄
        'record_transfer',   // 0 筆記錄
        'report_log',        // 0 筆記錄
        'report_void'        // 0 筆記錄
    ];
    
    const existingTables = [];
    const tableDetails = {};
    
    console.log('📊 檢查實際表格:');
    console.log('='.repeat(80));
    
    for (const tableName of actualTables) {
        try {
            // 嘗試查詢表格以檢查是否存在
            const { data, error, count } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });
            
            if (!error) {
                existingTables.push(tableName);
                tableDetails[tableName] = { count: count || 0, hasData: false };
                
                console.log(`✅ ${tableName} (記錄數: ${count || 0})`);
                
                // 如果有數據，獲取樣本來了解結構
                if (count > 0) {
                    const { data: sample, error: sampleError } = await supabase
                        .from(tableName)
                        .select('*')
                        .limit(1);
                    
                    if (!sampleError && sample && sample.length > 0) {
                        tableDetails[tableName].hasData = true;
                        tableDetails[tableName].columns = Object.keys(sample[0]);
                        tableDetails[tableName].sampleData = sample[0];
                        
                        console.log('   欄位結構:');
                        Object.entries(sample[0]).forEach(([column, value]) => {
                            const type = value === null ? 'null' : typeof value;
                            const displayValue = value === null ? 'NULL' : 
                                               type === 'string' && value.length > 30 ? 
                                               `"${value.substring(0, 27)}..."` : 
                                               JSON.stringify(value);
                            console.log(`     • ${column}: ${type} (範例: ${displayValue})`);
                        });
                    }
                } else {
                    // 即使沒有數據，也嘗試獲取表格結構
                    const { data: structure, error: structError } = await supabase
                        .from(tableName)
                        .select('*')
                        .limit(0);
                    
                    if (!structError) {
                        console.log('   ⚠️  表格為空，但結構存在');
                    }
                }
                console.log('');
            } else {
                console.log(`❌ ${tableName} - ${error.message}`);
            }
        } catch (e) {
            console.log(`❌ ${tableName} - ${e.message}`);
        }
    }
    
    // 總結報告
    console.log(`\n📈 總結報告:`);
    console.log('='.repeat(80));
    console.log(`✅ 存在的表格: ${existingTables.length} 個`);
    console.log(`❌ 不存在的表格: ${actualTables.length - existingTables.length} 個`);
    
    if (existingTables.length > 0) {
        console.log('\n📋 存在的表格列表:');
        existingTables.forEach(table => {
            const details = tableDetails[table];
            const status = details.hasData ? '有數據' : '空表格';
            console.log(`   • ${table} (${details.count} 筆記錄, ${status})`);
        });
        
        // 顯示有數據的表格的詳細信息
        const tablesWithData = existingTables.filter(table => tableDetails[table].hasData);
        if (tablesWithData.length > 0) {
            console.log('\n📊 有數據的表格詳細信息:');
            console.log('-'.repeat(80));
            
            tablesWithData.forEach(table => {
                const details = tableDetails[table];
                console.log(`\n🗂️  ${table}:`);
                console.log(`   記錄數: ${details.count}`);
                console.log(`   欄位數: ${details.columns.length}`);
                console.log(`   欄位列表: ${details.columns.join(', ')}`);
            });
        }
    }
    
    // 檢查不存在的表格
    const missingTables = actualTables.filter(table => !existingTables.includes(table));
    if (missingTables.length > 0) {
        console.log('\n❌ 不存在的表格:');
        missingTables.forEach(table => console.log(`   • ${table}`));
    }
    
    // 計算總記錄數
    const tablesWithData = existingTables.filter(table => tableDetails[table].hasData);
    const totalRecords = existingTables.reduce((sum, table) => sum + tableDetails[table].count, 0);
    console.log(`\n📊 資料庫統計:`);
    console.log(`   總表格數: ${existingTables.length}`);
    console.log(`   總記錄數: ${totalRecords.toLocaleString()}`);
    console.log(`   有數據的表格: ${tablesWithData.length}`);
    console.log(`   空表格: ${existingTables.length - tablesWithData.length}`);
}

// 運行函數
checkActualTables().then(() => {
    console.log('\n🎉 實際表格檢查完成！');
}).catch(error => {
    console.error('❌ 執行失敗:', error);
}); 