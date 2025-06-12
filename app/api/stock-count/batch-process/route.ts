import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, scans } = body;

    if (!session_id || !scans || !Array.isArray(scans)) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // 獲取當前用戶信息
    const cookieStore = cookies();
    const userEmail = cookieStore.get('user_email')?.value;
    
    if (!userEmail) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }

    // 獲取用戶ID和名稱
    const { data: userData, error: userError } = await supabase
      .from('data_id')
      .select('id, name')
      .eq('email', userEmail)
      .single();

    if (userError || !userData) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    let successCount = 0;
    let errorCount = 0;
    const results = [];

    // 處理每個掃描項目
    for (const scan of scans) {
      try {
        // 檢查是否已經盤點過
        const today = new Date().toISOString().split('T')[0];
        const { data: existingCount } = await supabase
          .from('record_stocktake')
          .select('plt_num')
          .eq('plt_num', scan.plt_num)
          .gte('created_at', `${today} 00:00:00`)
          .lte('created_at', `${today} 23:59:59`)
          .single();

        if (existingCount) {
          errorCount++;
          results.push({
            plt_num: scan.plt_num,
            status: 'error',
            error: 'Already counted today'
          });
          continue;
        }

        // 獲取產品描述
        const { data: productData } = await supabase
          .from('data_code')
          .select('description')
          .eq('code', scan.product_code)
          .single();

        // 獲取當前剩餘數量
        const { data: lastRecords } = await supabase
          .from('record_stocktake')
          .select('remain_qty')
          .eq('product_code', scan.product_code)
          .gte('created_at', `${today} 00:00:00`)
          .lte('created_at', `${today} 23:59:59`)
          .order('created_at', { ascending: false });

        let currentRemainQty = 0;
        
        if (!lastRecords || lastRecords.length === 0) {
          // 今日第一次盤點，從 stock_level 獲取
          const { data: stockData } = await supabase
            .from('stock_level')
            .select('stock_level')
            .eq('stock', scan.product_code)
            .order('update_time', { ascending: false })
            .limit(1)
            .single();
            
          if (stockData) {
            currentRemainQty = stockData.stock_level;
            
            // 創建初始記錄
            const { error: initError } = await supabase
              .from('record_stocktake')
              .insert({
                product_code: scan.product_code,
                plt_num: null, // 使用 NULL 而唔係空字串
                product_desc: productData?.description || scan.product_desc,
                remain_qty: currentRemainQty,
                counted_qty: 0,
                counted_id: userData.id,
                counted_name: userData.name
              });
              
            if (initError) {
              console.error('Failed to create initial record for batch:', initError);
              errorCount++;
              results.push({
                plt_num: scan.plt_num,
                status: 'error',
                error: 'Failed to create initial record'
              });
              continue;
            }
          } else {
            errorCount++;
            results.push({
              plt_num: scan.plt_num,
              status: 'error',
              error: 'No stock level found'
            });
            continue;
          }
        } else {
          currentRemainQty = lastRecords[0].remain_qty;
        }
        
        const newRemainQty = currentRemainQty - scan.counted_qty;

        // 插入新記錄
        const { error: insertError } = await supabase
          .from('record_stocktake')
          .insert({
            product_code: scan.product_code,
            plt_num: scan.plt_num,
            product_desc: productData?.description || scan.product_desc,
            remain_qty: newRemainQty,
            counted_qty: scan.counted_qty,
            counted_id: userData.id,
            counted_name: userData.name
          });

        if (insertError) {
          throw insertError;
        }

        successCount++;
        results.push({
          plt_num: scan.plt_num,
          status: 'success'
        });

      } catch (error) {
        console.error('Error processing scan:', error);
        errorCount++;
        results.push({
          plt_num: scan.plt_num,
          status: 'error',
          error: 'Processing failed'
        });
      }
    }

    // 記錄批量處理會話（如果有新表的話）
    // 這裡可以插入到 stocktake_session 表

    return NextResponse.json({
      success: true,
      data: {
        session_id,
        total_processed: scans.length,
        success_count: successCount,
        error_count: errorCount,
        results
      }
    });

  } catch (error) {
    console.error('Batch process error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}