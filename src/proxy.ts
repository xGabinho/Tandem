import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Proxy de Next.js 16 (reemplaza middleware.ts).
 * Protege rutas autenticadas redirigiendo a /auth/login si no hay sesión.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/auth/login', '/auth/register', '/auth']
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  )

  // Siempre permitir assets estáticos, imágenes, API y archivos internos de Next.js
  const isStaticAsset =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // archivos con extensión (favicon, imágenes, etc.)

  if (isPublicPath || isStaticAsset) {
    return NextResponse.next()
  }

  // Verificar si existe un token de sesión de Supabase
  const accessToken = request.cookies.get('sb-access-token')?.value

  if (!accessToken) {
    // No hay sesión: redirigir al login
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Sesión existe: permitir el acceso
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
