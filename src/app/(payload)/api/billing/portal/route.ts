import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { createBillingPortalSession, stripe } from '@/utils/stripe'

/**
 * Create Stripe Billing Portal Session
 *
 * Creates a session for customers to manage their subscription
 */
export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      )
    }

    const payload = await getPayload({ config })
    const body = await request.json()

    const { tenantId } = body

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing required field: tenantId' },
        { status: 400 }
      )
    }

    // Get tenant
    const tenant = await payload.findByID({
      collection: 'tenants',
      id: tenantId,
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Check if tenant has Stripe customer ID
    if (!tenant.billing?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No billing account found. Please subscribe first.' },
        { status: 400 }
      )
    }

    // Check if tenant has lifetime access (no need for portal)
    if (tenant.billing?.lifetimeAccess) {
      return NextResponse.json(
        { error: 'Lifetime accounts do not need the billing portal' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
    const returnUrl = `${baseUrl}/billing`

    // Create billing portal session
    const session = await createBillingPortalSession(
      tenant.billing.stripeCustomerId,
      returnUrl
    )

    console.log(`[Billing] Portal accessed for tenant ${tenant.name}`)

    return NextResponse.json({
      url: session.url,
    })
  } catch (error: any) {
    console.error('[Billing] Error creating portal session:', error)
    return NextResponse.json(
      {
        error: 'Failed to create portal session',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
