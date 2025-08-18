import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const secret = process.env.NEXTAUTH_SECRET;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Security headers for all routes
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');

  // Rate limiting headers (basic)
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown';
  response.headers.set('X-RateLimit-IP', ip);

  // Protected routes
  const protectedPaths = ['/room'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  if (isProtectedPath) {
    const token = await getToken({ req: request, secret });
    
    // For now, allow all access to rooms but could add auth later
    if (!token && false) { // Disabled for now
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // API routes protection
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    const token = await getToken({ req: request, secret });
    
    // Add user context to API routes
    if (token) {
      response.headers.set('x-user-id', token.sub || '');
      response.headers.set('x-user-email', token.email || '');
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};