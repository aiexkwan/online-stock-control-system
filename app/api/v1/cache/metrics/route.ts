import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        size: 0,
      },
    },
  });
}
