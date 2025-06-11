import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { plt_num, product_code, counted_qty } = await request.json();
    
    if (!plt_num || !product_code) {
      return NextResponse.json(
        { success: false, error: 'Pallet number and product code are required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 獲取當前用戶信息
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 獲取用戶 ID 和姓名
    const { data: userData, error: userError } = await supabase
      .from('data_id')
      .select('id, name')
      .eq('email', user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 獲取產品描述
    const { data: productData, error: productError } = await supabase
      .from('data_code')
      .select('description')
      .eq('code', product_code)
      .single();

    if (productError || !productData) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // 檢查當天是否已有該 product_code 的記錄
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 格式
    
    const { data: existingRecords, error: recordError } = await supabase
      .from('record_stocktake')
      .select('*')
      .eq('product_code', product_code)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`)
      .order('created_at', { ascending: false });

    if (recordError) {
      return NextResponse.json(
        { success: false, error: 'Failed to check existing records' },
        { status: 500 }
      );
    }

    let remain_qty = 0;
    let is_first_count = false;

    if (!existingRecords || existingRecords.length === 0) {
      // 首次盤點該產品 - 查詢 stock_level
      const { data: stockData, error: stockError } = await supabase
        .from('stock_level')
        .select('stock_level')
        .eq('product_code', product_code)
        .gte('update_time', `${today}T00:00:00.000Z`)
        .order('update_time', { ascending: false })
        .limit(1);

      // 如果當天沒有記錄，查詢最近的記錄
      let finalStockLevel = 0;
      if (stockError || !stockData || stockData.length === 0) {
        const { data: latestStock, error: latestError } = await supabase
          .from('stock_level')
          .select('stock_level')
          .eq('product_code', product_code)
          .order('update_time', { ascending: false })
          .limit(1);

        if (latestError || !latestStock || latestStock.length === 0) {
          return NextResponse.json(
            { success: false, error: 'No stock level found for this product' },
            { status: 404 }
          );
        }
        finalStockLevel = latestStock[0].stock_level;
      } else {
        finalStockLevel = stockData[0].stock_level;
      }

      remain_qty = finalStockLevel;
      is_first_count = true;

      // 創建初始記錄
      const { error: insertError } = await supabase
        .from('record_stocktake')
        .insert({
          product_code,
          plt_num: '', // 留空
          product_desc: productData.description,
          remain_qty,
          counted_qty: 0,
          counted_id: userData.id,
          counted_name: userData.name
        });

      if (insertError) {
        return NextResponse.json(
          { success: false, error: 'Failed to create initial record' },
          { status: 500 }
        );
      }

    } else {
      // 檢查是否已經盤點過該 plt_num
      const alreadyCountedPallet = existingRecords.find(record => record.plt_num === plt_num);
      
      if (alreadyCountedPallet) {
        return NextResponse.json({
          success: false,
          error: 'This pallet already be counted today',
          data: { already_counted: true }
        });
      }

      // 如果沒有提供數量，表示需要用戶輸入
      if (counted_qty === undefined || counted_qty === null) {
        return NextResponse.json({
          success: true,
          data: {
            need_input: true,
            current_remain_qty: existingRecords[0].remain_qty,
            product_desc: productData.description
          }
        });
      }

      // 獲取最新的 remain_qty
      const latestRecord = existingRecords[0];
      remain_qty = latestRecord.remain_qty - counted_qty;

      // 創建新的盤點記錄
      const { error: insertError } = await supabase
        .from('record_stocktake')
        .insert({
          product_code,
          plt_num,
          product_desc: productData.description,
          remain_qty,
          counted_qty,
          counted_id: userData.id,
          counted_name: userData.name
        });

      if (insertError) {
        return NextResponse.json(
          { success: false, error: 'Failed to create count record' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        remain_qty,
        is_first_count,
        already_counted: false,
        need_input: false,
        product_desc: productData.description
      }
    });

  } catch (error) {
    console.error('Stock count process error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 