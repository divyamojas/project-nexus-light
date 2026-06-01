import { NextResponse } from 'next/server'

export function middleware(request) {
  const token = request.cookies.get('leaflet_token')?.value
  const { pathname } = request.nextUrl

  const PUBLIC = ['/', '/auth', '/landing', '/legal', '/_next', '/icons', '/favicon', '/manifest', '/api']
  const isPublic = PUBLIC.some(p => pathname === p || pathname.startsWith(p + '/'))

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/landing', request.url))
  }

  if (token && pathname === '/') {
    return NextResponse.redirect(new URL('/app', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon|icons|manifest).*)'],
}
