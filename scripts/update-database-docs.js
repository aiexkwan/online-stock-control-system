#!/usr/bin/env node

/**
 * 自動更新資料庫結構文檔腳本
 * 
 * 此腳本會：
 * 1. 掃描Supabase資料庫結構
 * 2. 生成最新的表格信息
 * 3. 更新 docs/databaseStructure.md 文檔
 * 
 * 使用方法: node scripts/update-database-docs.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function updateDatabaseDocs() {
    console.log('🔄 開始更新資料庫結構文檔...\n');
    
    const supabaseUrl = 'https://bbmkuiplnzvpudszrend.supabase.co';
    const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWt1aXBsbnp2cHVkc3pyZW5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTcxNTYwNCwiZXhwIjoyMDYxMjkxNjA0fQ.B0pQF2V0kWdrU2_2VEYXR6qxZzt2oMDvwxD7qiR3huM';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 實際表格列表
    const actualTables = [
        'data_code', 'data_id', 'data_slateinfo', 'data_supplier',
        'debug_log', 'record_aco', 'record_grn', 'record_history',
        'record_inventory', 'record_palletinfo', 'record_slate',
        'record_transfer', 'report_log', 'report_void'
    ];
    
    const tableDetails = {};
    let totalRecords = 0;
    
    console.log('📊 掃描資料庫表格...');
    
    for (const tableName of actualTables) {
        try {
            const { data, error, count } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });
            
            if (!error) {
                tableDetails[tableName] = {
                    count: count || 0,
                    hasData: count > 0,
                    columns: []
                };
                
                totalRecords += count || 0;
                
                // 獲取欄位結構
                if (count > 0) {
                    const { data: sample } = await supabase
                        .from(tableName)
                        .select('*')
                        .limit(1);
                    
                    if (sample && sample.length > 0) {
                        tableDetails[tableName].columns = Object.keys(sample[0]);
                        tableDetails[tableName].sampleData = sample[0];
                    }
                }
                
                console.log(`✅ ${tableName} (${count || 0} 筆記錄)`);
            } else {
                console.log(`❌ ${tableName} - ${error.message}`);
            }
        } catch (e) {
            console.log(`❌ ${tableName} - ${e.message}`);
        }
    }
    
    // 生成文檔內容
    const currentDate = new Date().toLocaleDateString('zh-TW');
    const tablesWithData = Object.keys(tableDetails).filter(table => tableDetails[table].hasData);
    const emptyTables = Object.keys(tableDetails).filter(table => !tableDetails[table].hasData);
    
    let docContent = `# 資料庫結構文檔

> **最後更新**: ${currentDate}  
> **MCP工具連接狀態**: ✅ 成功連接  
> **Supabase項目**: bbmkuiplnzvpudszrend  

## 📊 資料庫概覽

- **總表格數**: ${Object.keys(tableDetails).length}個
- **總記錄數**: ${totalRecords.toLocaleString()}筆
- **有數據的表格**: ${tablesWithData.length}個
- **空表格**: ${emptyTables.length}個

## 📋 表格詳細信息

`;

    // 生成有數據的表格詳細信息
    tablesWithData.forEach((tableName, index) => {
        const table = tableDetails[tableName];
        docContent += `### ${index + 1}. \`${tableName}\`
**記錄數**: ${table.count.toLocaleString()}筆  

`;
        
        if (table.columns.length > 0) {
            docContent += `| 欄位名稱 | 資料類型 | 範例值 |
|---------|---------|--------|
`;
            
            table.columns.forEach(column => {
                const sampleValue = table.sampleData[column];
                const type = sampleValue === null ? 'null' : typeof sampleValue;
                const displayValue = sampleValue === null ? 'NULL' : 
                                   typeof sampleValue === 'string' && sampleValue.length > 30 ? 
                                   `"${sampleValue.substring(0, 27)}..."` : 
                                   JSON.stringify(sampleValue);
                
                docContent += `| \`${column}\` | ${type} | ${displayValue} |
`;
            });
        }
        
        docContent += '\n';
    });
    
    // 生成空表格信息
    if (emptyTables.length > 0) {
        docContent += `## 📋 空表格

以下表格已創建但目前無數據：

`;
        emptyTables.forEach(tableName => {
            docContent += `- \`${tableName}\`
`;
        });
        
        docContent += '\n';
    }
    
    // 添加統計信息
    docContent += `## 📊 統計摘要

| 表格名稱 | 記錄數 | 狀態 |
|---------|--------|------|
`;
    
    Object.keys(tableDetails).forEach(tableName => {
        const table = tableDetails[tableName];
        const status = table.hasData ? '✅ 有數據' : '⚪ 空表格';
        docContent += `| \`${tableName}\` | ${table.count.toLocaleString()} | ${status} |
`;
    });
    
    docContent += `
## 📝 更新記錄

| 日期 | 更新內容 | 更新者 |
|------|---------|--------|
| ${currentDate} | 自動更新資料庫結構信息 | 自動化腳本 |

---

> **注意**: 此文檔由自動化腳本生成。如需更新，請運行 \`node scripts/update-database-docs.js\`
`;
    
    // 寫入文檔
    const docsPath = path.join(__dirname, '..', 'docs', 'databaseStructure.md');
    fs.writeFileSync(docsPath, docContent, 'utf8');
    
    console.log(`\n✅ 文檔更新完成！`);
    console.log(`📄 文檔位置: ${docsPath}`);
    console.log(`📊 總表格數: ${Object.keys(tableDetails).length}`);
    console.log(`📈 總記錄數: ${totalRecords.toLocaleString()}`);
}

// 運行更新
updateDatabaseDocs().catch(console.error); 