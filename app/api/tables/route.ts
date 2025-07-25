import { createClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// 數據碼表結構類型定義
interface DataCodeRecord {
  code: string;
  description: string;
  colour: string;
  standard_qty: number;
  type: string;
  remark: string | null;
}

export async function GET() {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase.from('data_code').select('*').limit(1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Type-safe handling with proper fallback
    const firstRecord = data?.[0] as DataCodeRecord | undefined;
    const emptyRecord: Partial<DataCodeRecord> = {};

    return NextResponse.json({
      tableName: 'products',
      columns: Object.keys(firstRecord || emptyRecord),
      sampleData: firstRecord || null,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch table structure' }, { status: 500 });
  }
}
