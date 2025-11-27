import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl.clone()

  // Handle admin subdomain
  if (hostname === 'admin.transconnect.app') {
    // Rewrite to admin pages
    if (url.pathname === '/') {
      url.pathname = '/admin'
      return NextResponse.rewrite(url)
    }
    if (!url.pathname.startsWith('/admin')) {
      url.pathname = `/admin${url.pathname}`
      return NextResponse.rewrite(url)
    }
  }

  // Handle operators subdomain
  if (hostname === 'operators.transconnect.app') {
    // Rewrite to operators pages
    if (url.pathname === '/') {
      url.pathname = '/operators'
      return NextResponse.rewrite(url)
    }
    if (!url.pathname.startsWith('/operators')) {
      url.pathname = `/operators${url.pathname}`
      return NextResponse.rewrite(url)
    }
  }

  // Handle www redirect
  if (hostname === 'www.transconnect.app') {
    url.host = 'transconnect.app'
    return NextResponse.redirect(url, 301)
  }

  // Default behavior for main domain
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}