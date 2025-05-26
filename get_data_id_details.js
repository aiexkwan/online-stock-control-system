const { createClient } = require('@supabase/supabase-js');

async function getDataIdDetails() {
    const supabaseUrl = 'https://bbmkuiplnzvpudszrend.supabase.co';
    const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWt1aXBsbnp2cHVkc3pyZW5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTcxNTYwNCwiZXhwIjoyMDYxMjkxNjA0fQ.B0pQF2V0kWdrU2_2VEYXR6qxZzt2oMDvwxD7qiR3huM';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🔍 獲取 data_id 表格的詳細信息...\n');
    
    try {
        // 獲取所有數據
        const { data: allData, error: dataError } = await supabase
            .from('data_id')
            .select('*')
            .order('id');
        
        if (dataError) {
            console.error('❌ 獲取數據失敗:', dataError);
            return;
        }
        
        console.log(`📊 data_id 表格總記錄數: ${allData.length}`);
        console.log('='.repeat(80));
        
        if (allData.length > 0) {
            // 分析表格結構
            const firstRecord = allData[0];
            const columns = Object.keys(firstRecord);
            
            console.log('\n📋 表格結構:');
            console.log('-'.repeat(40));
            columns.forEach((column, index) => {
                const sampleValue = firstRecord[column];
                const type = sampleValue === null ? 'null' : typeof sampleValue;
                console.log(`${index + 1}. ${column}: ${type}`);
            });
            
            // 顯示所有數據
            console.log('\n📄 所有記錄:');
            console.log('-'.repeat(80));
            
            allData.forEach((record, index) => {
                console.log(`\n記錄 ${index + 1}:`);
                Object.entries(record).forEach(([key, value]) => {
                    const displayValue = value === null ? 'NULL' : 
                                       typeof value === 'string' && value.length > 50 ? 
                                       `"${value.substring(0, 47)}..."` : 
                                       JSON.stringify(value);
                    console.log(`   ${key}: ${displayValue}`);
                });
            });
            
            // 統計分析
            console.log('\n📈 數據統計:');
            console.log('-'.repeat(40));
            
            // 分析每個欄位的數據類型和值分佈
            columns.forEach(column => {
                const values = allData.map(record => record[column]);
                const nonNullValues = values.filter(v => v !== null);
                const uniqueValues = [...new Set(nonNullValues)];
                
                console.log(`\n${column}:`);
                console.log(`   總數: ${values.length}`);
                console.log(`   非空值: ${nonNullValues.length}`);
                console.log(`   唯一值: ${uniqueValues.length}`);
                
                if (typeof nonNullValues[0] === 'string') {
                    const avgLength = nonNullValues.reduce((sum, val) => sum + val.length, 0) / nonNullValues.length;
                    console.log(`   平均長度: ${avgLength.toFixed(2)} 字符`);
                }
                
                if (uniqueValues.length <= 10) {
                    console.log(`   所有值: ${uniqueValues.map(v => JSON.stringify(v)).join(', ')}`);
                } else {
                    console.log(`   前10個值: ${uniqueValues.slice(0, 10).map(v => JSON.stringify(v)).join(', ')}...`);
                }
            });
        }
        
    } catch (error) {
        console.error('❌ 發生錯誤:', error);
    }
}

// 運行函數
getDataIdDetails().then(() => {
    console.log('\n🎉 data_id 表格分析完成！');
}).catch(error => {
    console.error('❌ 執行失敗:', error);
}); 