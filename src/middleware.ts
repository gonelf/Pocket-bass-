import { NextRequest, NextResponse } from 'next/server'
import { getTenantFromRequest, checkRateLimit, createRateLimitResponse, createTenantSuspendedResponse } from './middleware/tenantContext'

export async function middleware(request: NextRequest) {
  // Only apply middleware to API routes (not admin panel)
  if (request.nextUrl.pathname.startsWith('/api') && !request.nextUrl.pathname.startsWith('/api/admin')) {
    try {
      // Get tenant from request
      const tenant = await getTenantFromRequest(request)

      if (tenant) {
        // Check if tenant is suspended
        if (tenant.status === 'suspended') {
          return createTenantSuspendedResponse()
        }

        // Check rate limit
        const { allowed, remaining } = await checkRateLimit(tenant)

        if (!allowed) {
          return createRateLimitResponse(remaining)
        }

        // Add tenant info to headers for Payload to use
        const requestHeaders = new Headers(request.headers)
        requestHeaders.set('x-tenant-id', tenant.id)
        requestHeaders.set('x-tenant-subdomain', tenant.subdomain)
        requestHeaders.set('x-ratelimit-remaining', remaining.toString())

        // Continue with tenant context
        const response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        })

        // Add rate limit headers to response
        response.headers.set('X-RateLimit-Limit', (tenant.limits?.maxApiRequestsPerHour || 1000).toString())
        response.headers.set('X-RateLimit-Remaining', remaining.toString())

        return response
      }

      // For routes that don't require tenant (like health checks)
      if (
        request.nextUrl.pathname === '/api/health' ||
        request.nextUrl.pathname === '/api/graphql' ||
        request.nextUrl.pathname.startsWith('/api/users/login') ||
        request.nextUrl.pathname.startsWith('/api/users/forgot-password')
      ) {
        return NextResponse.next()
      }

      // No tenant found - log warning but allow (super admin access)
      console.warn('[Middleware] No tenant context for:', request.nextUrl.pathname)
      return NextResponse.next()
    } catch (error) {
      console.error('[Middleware] Error in tenant middleware:', error)
      // Allow request to continue on error (fail open for resilience)
      return NextResponse.next()
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
