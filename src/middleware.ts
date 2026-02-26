import { NextResponse, type NextRequest } from 'next/server'

// Demo mode: bypass all auth checks
export async function middleware(request: NextRequest) {
  // Redirect auth pages straight to dashboard
  if (request.nextUrl.pathname.startsWith('/auth/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
