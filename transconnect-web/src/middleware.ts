import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl.clone()
  
  console.log(`[Middleware] Host: ${hostname}, Path: ${url.pathname}`)

  // Handle www redirect - FIRST to prevent loops
  if (hostname === 'www.transconnect.app') {
    const redirectUrl = new URL(request.url)
    redirectUrl.hostname = 'transconnect.app'
    console.log(`[Middleware] Redirecting www to: ${redirectUrl.toString()}`)
    return NextResponse.redirect(redirectUrl, 301)
  }

  // Handle admin path on main domain - redirect to admin subdomain
  if ((hostname === 'transconnect.app' || hostname === 'localhost:3000') && url.pathname.startsWith('/admin')) {
    const redirectUrl = new URL(request.url)
    redirectUrl.hostname = 'admin.transconnect.app'
    redirectUrl.pathname = url.pathname.replace('/admin', '') || '/'
    console.log(`[Middleware] Redirecting admin to: ${redirectUrl.toString()}`)
    return NextResponse.redirect(redirectUrl, 301)
  }

  // Handle operators subdomain routing
  if (hostname === 'operators.transconnect.app') {
    // Rewrite to operators pages
    if (url.pathname === '/') {
      url.pathname = '/operators'
      console.log(`[Middleware] Rewriting operators root to: ${url.pathname}`)
      return NextResponse.rewrite(url)
    }
    if (!url.pathname.startsWith('/operators')) {
      url.pathname = `/operators${url.pathname}`
      console.log(`[Middleware] Rewriting operators path to: ${url.pathname}`)
      return NextResponse.rewrite(url)
    }
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