import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { buildTransactionReport } from '@/lib/exportReport';
import { format } from 'date-fns';
import type { TransactionReportData } from '@/app/actions/reportActions';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();

    // 獲取請求參數（如果有）
    const body = await request.json().catch(() => ({}));
    const { startDate, endDate } = body;

    // 查詢交易記錄，連同棧板資料
    let query = supabase
      .from('record_transfer')
      .select(
        `
        *,
        record_palletinfo!plt_num (
          product_code,
          product_qty,
          series,
          plt_remark
        ),
        data_id!operator_id (
          name,
          department,
          position
        )
      `
      )
      .order('tran_date', { ascending: false })
      .limit(1000); // 限制筆數避免過大

    // 如果有日期範圍，添加過濾
    if (startDate) {
      query = query.gte('tran_date', startDate);
    }
    if (endDate) {
      query = query.lte('tran_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('No transaction data found');
    }

    // 轉換數據格式以符合 buildTransactionReport 的要求
    const transfers = data.map((transaction: Record<string, unknown>) => {
      const palletInfo = transaction.record_palletinfo as Record<string, unknown> | null;
      const userData = transaction.data_id as Record<string, unknown> | null;

      return {
        from_location: String(transaction.f_loc || ''),
        to_location: String(transaction.t_loc || ''),
        product_code: String(palletInfo?.product_code || ''),
        quantity: Number(palletInfo?.product_qty || 0),
        operator_id: Number(transaction.operator_id || 0),
        operator_name: String(userData?.name || `ID: ${transaction.operator_id}`),
        transfer_date: transaction.tran_date
          ? format(new Date(String(transaction.tran_date)), 'yyyy-MM-dd')
          : '',
        pallet_number: String(transaction.plt_num || ''),
      };
    });

    // 計算日期範圍 (Strategy 2: DTO + type narrowing)
    const dates = data
      .map((t: Record<string, unknown>) => new Date(t.tran_date as string))
      .filter((d: Date) => !isNaN(d.getTime()));
    const minDate =
      dates.length > 0
        ? format(Math.min(...dates.map((d: Date) => d.getTime())), 'yyyy-MM-dd')
        : '';
    const maxDate =
      dates.length > 0
        ? format(Math.max(...dates.map((d: Date) => d.getTime())), 'yyyy-MM-dd')
        : '';

    const reportData: TransactionReportData = {
      date_range: {
        start_date: startDate || minDate,
        end_date: endDate || maxDate,
      },
      transfers,
      summary: {}, // Add empty summary for now
      total_transfers: transfers.length,
      total_pallets: transfers.length,
    };

    // 使用標準的 buildTransactionReport 函數生成報表
    const buffer = await buildTransactionReport(reportData);

    // 返回文件
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="product-movement-sheet-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error generating transaction report:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate report',
        details: error instanceof Error ? (error as { message: string }).message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
