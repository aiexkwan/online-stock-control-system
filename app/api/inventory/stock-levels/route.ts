import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { safeGet, safeNumber, safeString } from '@/lib/types/supabase-helpers';

/**
 * REST API endpoint for stock levels
 * Supports the client-side strategy of DataAccessLayer
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const params = {
      warehouse: searchParams.get('warehouse') || undefined,
      productCode: searchParams.get('productCode') || undefined,
      minQty: searchParams.get('minQty') ? parseInt(searchParams.get('minQty')!) : undefined,
      maxQty: searchParams.get('maxQty') ? parseInt(searchParams.get('maxQty')!) : undefined,
      includeZeroStock: searchParams.get('includeZeroStock') === 'true',
      sortBy: searchParams.get('sortBy') as 'quantity' | 'value' | 'location' | undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const supabase = await createClient();

    // Build query
    let query = supabase.from('data_product').select('*', { count: 'exact' });

    // Apply filters
    if (params.warehouse) {
      query = query.like('current_plt_loc', `${params.warehouse}%`);
    }
    if (params.productCode) {
      query = query.eq('product_code', params.productCode);
    }
    if (params.minQty !== undefined) {
      query = query.gte('product_qty', params.minQty);
    }
    if (params.maxQty !== undefined) {
      query = query.lte('product_qty', params.maxQty);
    }
    if (!params.includeZeroStock) {
      query = query.gt('product_qty', 0);
    }

    // Apply sorting
    if (params.sortBy === 'quantity') {
      query = query.order('product_qty', { ascending: false });
    } else if (params.sortBy === 'location') {
      query = query.order('current_plt_loc', { ascending: true });
    } else {
      query = query.order('product_code', { ascending: true });
    }

    // Apply pagination
    query = query.range(params.offset, params.offset + params.limit - 1);

    const { data: products, error, count } = await query;

    if (error) {
      throw new Error(`Database query failed: ${(error as { message: string }).message}`);
    }

    // Transform data - 策略 4: 類型安全的庫存數據處理
    const items = (products || []).map((product: Record<string, unknown>) => {
      const location = safeString(safeGet(product, 'current_plt_loc', 'Unknown'));
      const qty = safeNumber(safeGet(product, 'product_qty', 0));
      const unitPrice = safeNumber(safeGet(product, 'unit_price', 0));
      
      return {
        productCode: safeString(safeGet(product, 'product_code', '')),
        productDesc: safeString(safeGet(product, 'product_desc', '')),
        warehouse: location.charAt(0) || 'Unknown',
        location: location,
        quantity: qty,
        value: qty * unitPrice,
        lastUpdated: safeString(safeGet(product, 'updated_at', '')) || safeString(safeGet(product, 'created_at', '')),
        palletCount: 1,
      };
    });

    // Calculate aggregates - 策略 4: 類型安全的聚合計算
    const uniqueProducts = new Set(items.map(i => i.productCode));
    const aggregates = {
      totalQuantity: items.reduce((sum, item) => sum + (item.quantity || 0), 0),
      totalValue: items.reduce((sum, item) => sum + (item.value || 0), 0),
      totalPallets: items.length,
      uniqueProducts: uniqueProducts.size,
    };

    // Return response with cache headers
    return NextResponse.json(
      {
        items,
        total: count || 0,
        aggregates,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('[API as string] Stock levels error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch stock levels',
        message: error instanceof Error ? (error as { message: string }).message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
