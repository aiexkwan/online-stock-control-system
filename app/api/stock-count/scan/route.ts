import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { createInventoryService } from '@/lib/inventory/services';
import { detectSearchType } from '@/app/utils/palletSearchUtils';

export async function POST(request: NextRequest) {
  try {
    const { qrCode } = await request.json();
    
    if (!qrCode) {
      return NextResponse.json(
        { success: false, error: 'QR Code is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const inventoryService = createInventoryService(supabase);

    // 從輸入中提取 PALLET NUMBER 或 SERIES
    const input = qrCode.trim();

    // 使用統一的搜尋類型檢測
    const searchType = detectSearchType(input);
    let palletData = null;

    if (searchType === 'pallet_num' || searchType === 'series') {
      // 使用統一的搜尋服務
      const searchResult = await inventoryService.searchPallet(searchType, input);
      
      if (searchResult.pallet) {
        palletData = {
          plt_num: searchResult.pallet.plt_num,
          product_code: searchResult.pallet.product_code,
          product_qty: searchResult.pallet.product_qty,
          series: searchResult.pallet.series
        };
      }
    } else {
      // 如果格式不符，返回錯誤
      console.error('Invalid format:', input);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid format. Expected pallet number (DDMMYY/X, DDMMYY/XX or DDMMYY/XXX) or series (contains "-")' 
        },
        { status: 400 }
      );
    }

    if (palletData) {
      return NextResponse.json({
        success: true,
        data: {
          plt_num: palletData.plt_num,
          product_code: palletData.product_code,
          product_qty: palletData.product_qty,
          series: palletData.series
        }
      });
    }

    // 如果搵唔到
    const searchTypeDisplay = searchType === 'pallet_num' ? 'pallet number' : 'series';
    console.error(`Pallet not found for ${searchTypeDisplay}:`, input);
    return NextResponse.json(
      { success: false, error: `Pallet not found for ${searchTypeDisplay}: ${input}` },
      { status: 404 }
    );

  } catch (error) {
    console.error('Stock count scan error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 