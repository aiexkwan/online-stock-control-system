import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware is fully disabled - no code executed, directly return NextResponse.next()
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('x-content-type-options', 'nosniff');
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 