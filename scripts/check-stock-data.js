const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStockData() {
  try {
    console.log('檢查 stock_level 表數據...\n');
    
    // Check stock_level table
    const { data: stockData, error: stockError } = await supabase
      .from('stock_level')
      .select('*')
      .limit(5);
    
    if (stockError) {
      console.error('Stock level error:', stockError);
    } else {
      console.log('Stock Level 樣本數據:');
      console.log(JSON.stringify(stockData, null, 2));
    }
    
    console.log('\n檢查 data_code 表數據...\n');
    
    // Check data_code table
    const { data: codeData, error: codeError } = await supabase
      .from('data_code')
      .select('*')
      .limit(5);
      
    if (codeError) {
      console.error('Data code error:', codeError);
    } else {
      console.log('Data Code 樣本數據:');
      console.log(JSON.stringify(codeData, null, 2));
    }
    
    // Check if stock values match code values
    console.log('\n檢查 stock 值是否匹配 code 值...\n');
    
    const { data: allStocks } = await supabase
      .from('stock_level')
      .select('stock')
      .limit(10);
      
    const { data: allCodes } = await supabase
      .from('data_code')
      .select('code, type')
      .neq('type', '-')
      .not('type', 'is', null)
      .limit(20);
      
    console.log('Stock values:', allStocks?.map(s => s.stock));
    console.log('\nCodes with non-empty types:');
    allCodes?.forEach(c => {
      console.log(`  ${c.code}: ${c.type}`);
    });
    
    // Check matching
    console.log('\n檢查是否有匹配的值...');
    
    // 檢查所有有類型的產品
    const { data: allTypedCodes } = await supabase
      .from('data_code')
      .select('code')
      .neq('type', '-')
      .not('type', 'is', null);
      
    const typedCodesList = allTypedCodes?.map(c => c.code) || [];
    
    const { data: matchingData } = await supabase
      .from('stock_level')
      .select('stock')
      .in('stock', typedCodesList);
      
    console.log(`Total codes with types: ${typedCodesList.length}`);
    console.log('Matching stocks found:', matchingData?.length || 0);
    
    // 檢查是否有任何 stock_level 的 stock 在 data_code 表中
    console.log('\n反向檢查 - stock_level 的值是否在 data_code 中...');
    
    const { data: stockCodes } = await supabase
      .from('stock_level')
      .select('stock')
      .limit(50);
      
    const stockList = stockCodes?.map(s => s.stock) || [];
    
    const { data: foundInDataCode } = await supabase
      .from('data_code')
      .select('code, type')
      .in('code', stockList);
      
    console.log(`檢查了 ${stockList.length} 個 stock 值`);
    console.log(`在 data_code 中找到: ${foundInDataCode?.length || 0} 個匹配`);
    
    if (foundInDataCode && foundInDataCode.length > 0) {
      console.log('\n找到的匹配:');
      foundInDataCode.forEach(f => {
        console.log(`  ${f.code}: ${f.type}`);
      });
    }
    
  } catch (err) {
    console.error('錯誤:', err);
  }
}

checkStockData();