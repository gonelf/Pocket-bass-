import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { createCheckoutSession, stripe } from '@/utils/stripe'

/**
 * Create Stripe Checkout Session
 *
 * Creates a checkout session for a tenant to subscribe to a paid plan
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

    const {
      tenantId,
      plan,
      billingCycle = 'monthly',
    } = body

    // Validate required fields
    if (!tenantId || !plan) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, plan' },
        { status: 400 }
      )
    }

    // Validate plan
    if (!['starter', 'pro', 'lifetime'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be starter, pro, or lifetime' },
        { status: 400 }
      )
    }

    // Validate billing cycle for subscription plans
    if (plan !== 'lifetime' && !['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle. Must be monthly or yearly' },
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

    // Check if tenant already has active subscription
    if (tenant.billing?.subscriptionStatus === 'active' && plan !== 'lifetime') {
      return NextResponse.json(
        { error: 'Tenant already has an active subscription. Use the billing portal to manage it.' },
        { status: 400 }
      )
    }

    // Check if tenant already has lifetime access
    if (tenant.billing?.lifetimeAccess) {
      return NextResponse.json(
        { error: 'Tenant already has lifetime access' },
        { status: 400 }
      )
    }

    // Construct URLs
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
    const successUrl = `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/billing?canceled=true`

    // Create checkout session
    const session = await createCheckoutSession({
      plan,
      billingCycle: billingCycle as 'monthly' | 'yearly',
      tenantId,
      email: tenant.billingEmail || tenant.ownerEmail,
      successUrl,
      cancelUrl,
    })

    if (!session) {
      throw new Error('Failed to create checkout session')
    }

    // Log checkout initiation
    console.log(`[Billing] Checkout initiated for tenant ${tenant.name} (${plan})`)

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error: any) {
    console.error('[Billing] Error creating checkout session:', error)
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
