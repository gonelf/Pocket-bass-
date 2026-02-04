import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('[Stripe] STRIPE_SECRET_KEY not set. Billing features disabled.')
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
  })
  : null

// Pricing configuration
export const PRICING = {
  free: {
    name: 'Free / Hobby',
    price: 0,
    maxInstances: 2,
    maxUsers: 10,
    maxStorageMB: 1024, // 1GB
    maxApiRequestsPerHour: 1000,
    features: [
      '2 instances',
      '1GB storage',
      'Subdomain only',
      'Community support',
      'Fair use limits',
    ],
  },
  starter: {
    name: 'Starter / Indie',
    monthly: {
      price: 7,
      priceId: process.env.STRIPE_PRICE_STARTER_MONTHLY || '',
    },
    yearly: {
      price: 69,
      priceId: process.env.STRIPE_PRICE_STARTER_YEARLY || '',
    },
    maxInstances: 10,
    maxUsers: 50,
    maxStorageMB: 15360, // 15GB
    maxApiRequestsPerHour: 5000,
    features: [
      '10 instances',
      '15GB storage total',
      'Custom domains',
      'Email setup',
      'Priority support',
      'Advanced features',
    ],
  },
  pro: {
    name: 'Pro / Unlimited',
    monthly: {
      price: 24,
      priceId: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
    },
    yearly: {
      price: 249,
      priceId: process.env.STRIPE_PRICE_PRO_YEARLY || '',
    },
    maxInstances: 999999, // Unlimited (fair use)
    maxUsers: 999999,
    maxStorageMB: 102400, // 100GB
    maxApiRequestsPerHour: 50000,
    features: [
      'Unlimited instances (fair use)',
      '100GB+ storage',
      'Higher traffic limits',
      'Advanced features',
      'Faster support',
      'Custom integrations',
    ],
  },
  lifetime: {
    name: 'Lifetime',
    basePrice: 190,
    incrementPerTier: 50,
    tierSize: 20,
    maxInstances: 999999, // Pro features
    maxUsers: 999999,
    maxStorageMB: 102400,
    maxApiRequestsPerHour: 50000,
    features: [
      'Pro features forever',
      'All future updates',
      'Priority support',
      'Limited slots',
      'Early bird pricing',
    ],
  },
}

export function getPlanLimits(plan: string, billingCycle?: string) {
  const limits = {
    free: {
      maxInstances: PRICING.free.maxInstances,
      maxUsers: PRICING.free.maxUsers,
      maxStorageMB: PRICING.free.maxStorageMB,
      maxApiRequestsPerHour: PRICING.free.maxApiRequestsPerHour,
    },
    starter: {
      maxInstances: PRICING.starter.maxInstances,
      maxUsers: PRICING.starter.maxUsers,
      maxStorageMB: PRICING.starter.maxStorageMB,
      maxApiRequestsPerHour: PRICING.starter.maxApiRequestsPerHour,
    },
    pro: {
      maxInstances: PRICING.pro.maxInstances,
      maxUsers: PRICING.pro.maxUsers,
      maxStorageMB: PRICING.pro.maxStorageMB,
      maxApiRequestsPerHour: PRICING.pro.maxApiRequestsPerHour,
    },
    lifetime: {
      maxInstances: PRICING.lifetime.maxInstances,
      maxUsers: PRICING.lifetime.maxUsers,
      maxStorageMB: PRICING.lifetime.maxStorageMB,
      maxApiRequestsPerHour: PRICING.lifetime.maxApiRequestsPerHour,
    },
  }

  return limits[plan as keyof typeof limits] || limits.free
}

export function getPriceId(plan: string, billingCycle: 'monthly' | 'yearly'): string | null {
  if (plan === 'starter') {
    return billingCycle === 'yearly'
      ? PRICING.starter.yearly.priceId
      : PRICING.starter.monthly.priceId
  }

  if (plan === 'pro') {
    return billingCycle === 'yearly'
      ? PRICING.pro.yearly.priceId
      : PRICING.pro.monthly.priceId
  }

  return null
}

export async function getLifetimePricing() {
  // Get count of lifetime purchases from a global settings collection or database
  // For now, we'll use environment variable or API call
  const lifetimeSold = parseInt(process.env.LIFETIME_SOLD || '0', 10)

  const currentTier = Math.floor(lifetimeSold / PRICING.lifetime.tierSize)
  const currentPrice = PRICING.lifetime.basePrice + (currentTier * PRICING.lifetime.incrementPerTier)
  const nextTierAt = (currentTier + 1) * PRICING.lifetime.tierSize
  const remainingInTier = nextTierAt - lifetimeSold
  const nextPrice = currentPrice + PRICING.lifetime.incrementPerTier

  return {
    currentPrice,
    nextPrice,
    sold: lifetimeSold,
    remainingInTier,
    nextTierAt,
    tier: currentTier + 1,
    progress: ((lifetimeSold % PRICING.lifetime.tierSize) / PRICING.lifetime.tierSize) * 100,
  }
}

export async function createCheckoutSession(params: {
  plan: string
  billingCycle: 'monthly' | 'yearly'
  tenantId: string
  email: string
  successUrl: string
  cancelUrl: string
}): Promise<Stripe.Checkout.Session | null> {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }

  const { plan, billingCycle, tenantId, email, successUrl, cancelUrl } = params

  // Handle lifetime plan separately
  if (plan === 'lifetime') {
    const lifetimePricing = await getLifetimePricing()

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Pocket Bass Lifetime Access',
              description: `Pro features forever • Early bird tier ${lifetimePricing.tier}`,
            },
            unit_amount: lifetimePricing.currentPrice * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        tenantId,
        plan: 'lifetime',
        tierPrice: lifetimePricing.currentPrice.toString(),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    return session
  }

  // Handle subscription plans
  const priceId = getPriceId(plan, billingCycle)
  if (!priceId) {
    throw new Error(`Invalid plan or billing cycle: ${plan} ${billingCycle}`)
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      tenantId,
      plan,
      billingCycle,
    },
    subscription_data: {
      metadata: {
        tenantId,
        plan,
        billingCycle,
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
  })

  return session
}

export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

export async function cancelSubscription(subscriptionId: string, immediate: boolean = false) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }

  if (immediate) {
    return await stripe.subscriptions.cancel(subscriptionId)
  } else {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })
  }
}

export async function updateSubscription(subscriptionId: string, newPriceId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: 'create_prorations',
  })
}
