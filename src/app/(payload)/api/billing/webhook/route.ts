import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { stripe, getPlanLimits } from '@/utils/stripe'
import Stripe from 'stripe'

/**
 * Stripe Webhook Handler
 *
 * Handles Stripe webhook events for subscriptions and payments
 *
 * Security: Verifies webhook signature from Stripe
 */
export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 503 }
    )
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[Webhook] STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('[Webhook] Signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    )
  }

  console.log(`[Webhook] Received event: ${event.type}`)

  try {
    const payload = await getPayload({ config })

    switch (event.type) {
      // Subscription created
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const tenantId = subscription.metadata.tenantId

        if (!tenantId) {
          console.error('[Webhook] No tenantId in subscription metadata')
          break
        }

        const plan = subscription.metadata.plan || 'starter'
        const billingCycle = subscription.metadata.billingCycle || 'monthly'

        // Update tenant
        await payload.update({
          collection: 'tenants',
          id: tenantId,
          data: {
            plan,
            billingCycle,
            status: subscription.status === 'active' || subscription.status === 'trialing' ? 'active' : 'suspended',
            limits: getPlanLimits(plan, billingCycle),
            billing: {
              stripeCustomerId: subscription.customer as string,
              stripeSubscriptionId: subscription.id,
              stripePriceId: subscription.items.data[0].price.id,
              subscriptionStatus: subscription.status,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
          },
        })

        console.log(`[Webhook] Subscription ${subscription.status} for tenant ${tenantId}`)
        break
      }

      // Subscription deleted
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const tenantId = subscription.metadata.tenantId

        if (!tenantId) {
          console.error('[Webhook] No tenantId in subscription metadata')
          break
        }

        // Downgrade to free plan
        await payload.update({
          collection: 'tenants',
          id: tenantId,
          data: {
            plan: 'free',
            status: 'active',
            limits: getPlanLimits('free'),
            billing: {
              subscriptionStatus: 'canceled',
            },
          },
        })

        console.log(`[Webhook] Subscription canceled for tenant ${tenantId}`)
        break
      }

      // Payment succeeded (for one-time payments like lifetime)
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const tenantId = session.metadata?.tenantId

        if (!tenantId) {
          console.error('[Webhook] No tenantId in session metadata')
          break
        }

        // Check if this is a lifetime purchase
        if (session.metadata?.plan === 'lifetime' && session.mode === 'payment') {
          const tierPrice = parseInt(session.metadata.tierPrice || '190', 10)

          await payload.update({
            collection: 'tenants',
            id: tenantId,
            data: {
              plan: 'lifetime',
              status: 'active',
              limits: getPlanLimits('lifetime'),
              billing: {
                stripeCustomerId: session.customer as string,
                lifetimeAccess: true,
                lifetimePurchaseDate: new Date().toISOString(),
                lifetimePricePaid: tierPrice,
                subscriptionStatus: 'active',
              },
            },
          })

          // Increment lifetime sold count
          // Note: In production, this should be stored in a global settings collection
          // For now, we'll just log it
          console.log(`[Webhook] Lifetime purchase completed for tenant ${tenantId} at $${tierPrice}`)

          // TODO: Update LIFETIME_SOLD environment variable or settings collection
        }
        break
      }

      // Payment failed
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscription = invoice.subscription

        if (subscription && typeof subscription === 'string') {
          // Get subscription to find tenant
          const sub = await stripe.subscriptions.retrieve(subscription)
          const tenantId = sub.metadata.tenantId

          if (tenantId) {
            await payload.update({
              collection: 'tenants',
              id: tenantId,
              data: {
                status: 'suspended',
                billing: {
                  subscriptionStatus: 'past_due',
                },
              },
            })

            console.log(`[Webhook] Payment failed for tenant ${tenantId}`)
          }
        }
        break
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('[Webhook] Error processing event:', error)
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
