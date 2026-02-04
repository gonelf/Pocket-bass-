import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

/**
 * Health Check Endpoint
 * Returns system status and basic statistics
 */
export async function GET() {
  try {
    const payload = await getPayload({ config })

    // Check database connection
    const tenants = await payload.find({
      collection: 'tenants',
      limit: 1,
    })

    // Get basic stats
    const stats = {
      totalTenants: tenants.totalDocs,
      activeTenants: 0,
      suspendedTenants: 0,
    }

    // Count active/suspended tenants
    const activeTenants = await payload.find({
      collection: 'tenants',
      where: { status: { equals: 'active' } },
      limit: 0,
    })
    stats.activeTenants = activeTenants.totalDocs

    const suspendedTenants = await payload.find({
      collection: 'tenants',
      where: { status: { equals: 'suspended' } },
      limit: 0,
    })
    stats.suspendedTenants = suspendedTenants.totalDocs

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      multiTenant: true,
      database: 'connected',
      stats,
    })
  } catch (error: any) {
    console.error('[Health Check] Error:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 503 }
    )
  }
}
