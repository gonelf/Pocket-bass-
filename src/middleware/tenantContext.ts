import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

// Cache for tenant lookups (10 minute TTL)
const tenantCache = new Map<string, { tenant: any; timestamp: number }>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

// Rate limiting store (in-memory, consider Redis for production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export async function getTenantFromRequest(req: NextRequest) {
  const payload = await getPayload({ config })

  // 1. Try to get tenant from API key header
  const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '')

  if (apiKey && apiKey.startsWith('pb_')) {
    const cached = tenantCache.get(`key:${apiKey}`)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.tenant
    }

    try {
      const result = await payload.find({
        collection: 'tenants',
        where: {
          apiKey: {
            equals: apiKey,
          },
          status: {
            equals: 'active',
          },
        },
        limit: 1,
      })

      if (result.docs.length > 0) {
        const tenant = result.docs[0]
        tenantCache.set(`key:${apiKey}`, { tenant, timestamp: Date.now() })
        return tenant
      }
    } catch (error) {
      console.error('[Tenant Context] Error fetching tenant by API key:', error)
    }
  }

  // 2. Try to get tenant from subdomain
  const host = req.headers.get('host') || ''
  const subdomain = extractSubdomain(host)

  if (subdomain) {
    const cached = tenantCache.get(`subdomain:${subdomain}`)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.tenant
    }

    try {
      const result = await payload.find({
        collection: 'tenants',
        where: {
          or: [
            {
              subdomain: {
                equals: subdomain,
              },
            },
            {
              customDomain: {
                equals: host,
              },
            },
          ],
          status: {
            equals: 'active',
          },
        },
        limit: 1,
      })

      if (result.docs.length > 0) {
        const tenant = result.docs[0]
        tenantCache.set(`subdomain:${subdomain}`, { tenant, timestamp: Date.now() })
        return tenant
      }
    } catch (error) {
      console.error('[Tenant Context] Error fetching tenant by subdomain:', error)
    }
  }

  // 3. Try to get tenant from custom header (for testing)
  const tenantId = req.headers.get('x-tenant-id')
  if (tenantId) {
    try {
      const tenant = await payload.findByID({
        collection: 'tenants',
        id: tenantId,
      })

      if (tenant.status === 'active') {
        return tenant
      }
    } catch (error) {
      console.error('[Tenant Context] Error fetching tenant by ID:', error)
    }
  }

  return null
}

export function extractSubdomain(host: string): string | null {
  // Remove port if present
  const hostname = host.split(':')[0]

  // Skip localhost and IP addresses
  if (
    hostname === 'localhost' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('127.') ||
    /^\d+\.\d+\.\d+\.\d+$/.test(hostname)
  ) {
    return null
  }

  const parts = hostname.split('.')

  // If we have subdomain.domain.tld, extract subdomain
  if (parts.length >= 3) {
    return parts[0]
  }

  return null
}

export async function checkRateLimit(tenant: any): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now()
  const key = `tenant:${tenant.id}`
  const limit = tenant.limits?.maxApiRequestsPerHour || 1000
  const windowMs = 60 * 60 * 1000 // 1 hour

  let record = rateLimitStore.get(key)

  // Reset if window expired
  if (!record || now > record.resetAt) {
    record = {
      count: 0,
      resetAt: now + windowMs,
    }
  }

  record.count++
  rateLimitStore.set(key, record)

  const remaining = Math.max(0, limit - record.count)
  const allowed = record.count <= limit

  // Update tenant usage stats (async, don't block)
  if (allowed) {
    updateTenantUsage(tenant.id, record.count, now).catch((error) => {
      console.error('[Rate Limit] Error updating tenant usage:', error)
    })
  }

  return { allowed, remaining }
}

async function updateTenantUsage(tenantId: string, count: number, timestamp: number) {
  try {
    const payload = await getPayload({ config })
    await payload.update({
      collection: 'tenants',
      id: tenantId,
      data: {
        usage: {
          apiRequestsThisHour: count,
          lastApiRequestAt: new Date(timestamp).toISOString(),
        },
      },
    })
  } catch (error) {
    console.error('[Tenant Usage] Error updating usage:', error)
  }
}

export function createRateLimitResponse(remaining: number): NextResponse {
  return NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': '1000',
        'X-RateLimit-Remaining': remaining.toString(),
        'Retry-After': '3600', // 1 hour
      },
    }
  )
}

export function createTenantNotFoundResponse(): NextResponse {
  return NextResponse.json(
    {
      error: 'Tenant not found',
      message: 'Invalid API key, subdomain, or tenant ID',
      code: 'TENANT_NOT_FOUND',
    },
    {
      status: 404,
    }
  )
}

export function createTenantSuspendedResponse(): NextResponse {
  return NextResponse.json(
    {
      error: 'Tenant suspended',
      message: 'This tenant account has been suspended',
      code: 'TENANT_SUSPENDED',
    },
    {
      status: 403,
    }
  )
}
