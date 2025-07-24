// middleware.ts (in your root directory)
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here if needed
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user has a valid token
        if (token) return true
        
        // Allow access to auth pages
        const { pathname } = req.nextUrl
        if (pathname.startsWith('/login') || 
            pathname.startsWith('/register') || 
            pathname.startsWith('/api/auth') ||
            pathname === '/') {
          return true
        }
        
        return false
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}