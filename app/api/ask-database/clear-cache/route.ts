import { NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';

export async function POST() {
  try {
    // 檢查權限（只允許開發環境或管理員）
    if (process.env.NODE_ENV === 'production') {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || user.email !== 'akwan@pennineindustries.com') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // 清除 query_record 表的緩存記錄
    const supabase = await createClient();
    const { error } = await supabase
      .from('query_record')
      .delete()
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('[Clear Cache] Database error:', error);
      return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Clear Cache] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
