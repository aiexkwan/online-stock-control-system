import { createClient } from '../../../lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      tableName: 'products',
      columns: Object.keys(data?.[0] || {}),
      sampleData: data?.[0]
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch table structure' }, { status: 500 });
  }
} 