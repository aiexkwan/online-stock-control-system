const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listTables() {
  try {
    console.log('查詢 Supabase 所有表名稱...\n');

    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (error) {
      // 如果上面的方法失敗，試用 RPC
      console.log('使用 RPC 方法查詢...');
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_all_tables');

      if (rpcError) {
        console.error('RPC 錯誤:', rpcError);
        // 最後嘗試直接查詢已知的表
        console.log('\n列出已知的表：');
        const knownTables = [
          'users',
          'products',
          'suppliers',
          'purchase_order',
          'purchase_order_items',
          'grn_label',
          'stock',
          'stock_in',
          'auth_codes',
          'acos',
          'slate_records',
          'slate_images',
          'stock_take',
          'stock_take_items',
          'employee_weekly_hours',
          'clock_records',
          'order_templates',
          'user_sessions',
          'activity_logs',
          'stock_updates',
          'pallet_numbers',
          'grn_label_reprint_log',
          'shipping_records',
          'transfer_requests',
          'orders',
          'order_items',
          'production_records',
          'quality_checks',
          'product_categories',
        ];

        knownTables.sort().forEach(table => {
          console.log(`- ${table}`);
        });
        return;
      }

      console.log('Supabase 表名稱：');
      rpcData.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
      return;
    }

    console.log('Supabase 表名稱：');
    data.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
  } catch (err) {
    console.error('錯誤:', err);
  }
}

listTables();
