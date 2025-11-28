import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl.clone()
  
  console.log(`[Middleware] Host: ${hostname}, Path: ${url.pathname}`)

  // Handle admin path on main domain - redirect to admin subdomain
  if ((hostname === 'transconnect.app' || hostname === 'www.transconnect.app' || hostname === 'localhost:3000') && url.pathname.startsWith('/admin')) {
    const redirectUrl = new URL(request.url)
    redirectUrl.hostname = 'admin.transconnect.app'
    redirectUrl.pathname = url.pathname.replace('/admin', '') || '/'
    console.log(`[Middleware] Redirecting admin to: ${redirectUrl.toString()}`)
    return NextResponse.redirect(redirectUrl, 301)
  }

  // Handle operators subdomain - redirect to admin system
  if (hostname === 'operators.transconnect.app') {
    const redirectUrl = new URL(request.url)
    redirectUrl.hostname = 'admin.transconnect.app'
    redirectUrl.pathname = '/operators' + (url.pathname === '/' ? '' : url.pathname)
    console.log(`[Middleware] Redirecting operators to admin: ${redirectUrl.toString()}`)
    return NextResponse.redirect(redirectUrl, 301)
  }

  // Default behavior - let DNS CNAME handle www redirect
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