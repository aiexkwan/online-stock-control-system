import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { createInventoryService } from '@/lib/inventory/services';
import { detectSearchType } from '@/app/utils/palletSearchUtils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrCode, plt_num, product_code, counted_qty } = body;

    const supabase = await createClient();
    const inventoryService = createInventoryService(supabase);

    // 獲取當前用戶信息
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

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
      .eq('email', user.email || '')
      .single();

    if (userError || !userData) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // 情況1：QR 掃描 - 查找棧板並檢查是否需要輸入
    if (qrCode) {
      const input = qrCode.trim();
      const searchType = detectSearchType(input);
      let palletData = null;

      if (searchType === 'pallet_num' || searchType === 'series') {
        const searchResult = await inventoryService.searchPallet(searchType, input);

        if (searchResult.pallet) {
          palletData = {
            plt_num: searchResult.pallet.plt_num,
            product_code: searchResult.pallet.product_code,
            product_qty: searchResult.pallet.product_qty,
            series: searchResult.pallet.series,
          };
        }
      } else {
        return NextResponse.json(
          {
            success: false,
            error:
              'Invalid format. Expected pallet number (DDMMYY/X, DDMMYY/XX or DDMMYY/XXX) or series (contains "-")',
          },
          { status: 400 }
        );
      }

      if (!palletData) {
        const searchTypeDisplay = searchType === 'pallet_num' ? 'pallet number' : 'series';
        return NextResponse.json(
          { success: false, error: `Pallet not found for ${searchTypeDisplay}: ${input}` },
          { status: 404 }
        );
      }

      // 獲取產品描述
      const { data: productData, error: productError } = await supabase
        .from('data_code')
        .select('description')
        .eq('code', palletData.product_code)
        .single();

      if (productError || !productData) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
      }

      // 檢查當天是否已有該 product_code 的記錄
      const today = new Date().toISOString().split('T')[0];
      const { data: existingRecords, error: recordError } = await supabase
        .from('record_stocktake')
        .select('*')
        .eq('product_code', palletData.product_code)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`)
        .order('created_at', { ascending: false });

      if (recordError) {
        return NextResponse.json(
          { success: false, error: 'Failed to check existing records' },
          { status: 500 }
        );
      }

      // 檢查是否已經盤點過該 plt_num
      const alreadyCountedPallet = existingRecords?.find(record => record.plt_num === palletData.plt_num);
      if (alreadyCountedPallet) {
        return NextResponse.json({
          success: false,
          error: 'This pallet has already been counted today',
        });
      }

      let currentRemainQty = 0;
      let is_first_count = false;

      if (!existingRecords || existingRecords.length === 0) {
        // 首次盤點該產品 - 查詢 stock_level
        const { data: stockData, error: stockError } = await supabase
          .from('stock_level')
          .select('stock_level')
          .eq('stock', palletData.product_code)
          .order('update_time', { ascending: false })
          .limit(1);

        if (stockError || !stockData || stockData.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: `No stock level found for product code: ${palletData.product_code}`,
            },
            { status: 404 }
          );
        }

        currentRemainQty = typeof stockData[0].stock_level === 'number' ? stockData[0].stock_level : 0;
        is_first_count = true;

        // 創建初始記錄
        const { error: insertError } = await supabase.from('record_stocktake').insert({
          product_code: palletData.product_code,
          plt_num: null,
          product_desc: productData.description,
          remain_qty: currentRemainQty,
          counted_qty: 0,
          counted_id: userData.id,
          counted_name: userData.name,
        });

        if (insertError) {
          return NextResponse.json(
            { success: false, error: 'Failed to create initial record' },
            { status: 500 }
          );
        }
      } else {
        // 獲取最新的 remain_qty
        currentRemainQty = typeof existingRecords[0].remain_qty === 'number' ? existingRecords[0].remain_qty : 0;
      }

      return NextResponse.json({
        success: true,
        data: {
          plt_num: palletData.plt_num,
          product_code: palletData.product_code,
          product_desc: productData.description,
          current_remain_qty: currentRemainQty,
          is_first_count,
          need_input: true, // 始終需要用戶輸入數量
        },
      });
    }

    // 情況2：提交數量 - 處理盤點記錄
    if (plt_num && product_code && counted_qty !== undefined) {
      // 基本驗證
      if (counted_qty < 0) {
        return NextResponse.json({ success: false, error: 'Quantity cannot be negative' }, { status: 400 });
      }

      // 獲取產品描述
      const { data: productData, error: productError } = await supabase
        .from('data_code')
        .select('description')
        .eq('code', product_code)
        .single();

      if (productError || !productData) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
      }

      // 檢查當天記錄
      const today = new Date().toISOString().split('T')[0];
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

      // 檢查是否已經盤點過該 plt_num
      const alreadyCountedPallet = existingRecords?.find(record => record.plt_num === plt_num);
      if (alreadyCountedPallet) {
        return NextResponse.json({
          success: false,
          error: 'This pallet has already been counted today',
        });
      }

      let currentRemainQty = 0;

      if (!existingRecords || existingRecords.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No initial record found. Please scan the pallet first.' },
          { status: 400 }
        );
      } else {
        currentRemainQty = typeof existingRecords[0].remain_qty === 'number' ? existingRecords[0].remain_qty : 0;
      }

      const newRemainQty = currentRemainQty - counted_qty;

      // 創建新的盤點記錄
      const { error: insertError } = await supabase.from('record_stocktake').insert({
        product_code,
        plt_num,
        product_desc: productData.description,
        remain_qty: newRemainQty,
        counted_qty,
        counted_id: userData.id,
        counted_name: userData.name,
      });

      if (insertError) {
        return NextResponse.json(
          { success: false, error: 'Failed to create count record' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          plt_num,
          product_code,
          product_desc: productData.description,
          remain_qty: newRemainQty,
          counted_qty,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request. Either qrCode or (plt_num, product_code, counted_qty) is required.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Stock count API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}