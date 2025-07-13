import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 創建 Supabase 服務端客戶端的函數
function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'public' },
    global: {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { fileName, folder } = await request.json();

    if (!fileName || !folder) {
      return NextResponse.json(
        {
          error: 'Missing required fields: fileName or folder',
        },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Check File Exists] Checking file:', { fileName, folder });
    }

    const supabaseAdmin = createSupabaseAdmin();

    // 列出文件夾中的所有文件
    const { data: files, error: listError } = await supabaseAdmin.storage.from(folder).list('', {
      search: fileName,
    });

    if (listError) {
      console.error('[Check File Exists] Error listing files:', listError);
      return NextResponse.json(
        {
          error: 'Failed to check file existence',
          details: listError.message,
        },
        { status: 500 }
      );
    }

    // 檢查是否存在同名文件
    const fileExists = files && files.some(file => file.name === fileName);

    let publicUrl = null;
    if (fileExists) {
      // 獲取公開 URL
      const { data } = supabaseAdmin.storage.from(folder).getPublicUrl(fileName);

      publicUrl = data.publicUrl;
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Check File Exists] File exists, public URL:', publicUrl);
      }
    }

    return NextResponse.json({
      exists: fileExists,
      publicUrl: publicUrl,
      fileName: fileName,
      folder: folder,
    });
  } catch (error: any) {
    console.error('[Check File Exists] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
