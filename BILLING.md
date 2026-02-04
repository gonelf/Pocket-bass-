# 💳 Billing & Subscriptions

Complete guide to Stripe integration, pricing tiers, and subscription management in Pocket Bass.

## Pricing Tiers

| Tier | Price | Instances | Storage | API Requests/Hour | Features |
|------|-------|-----------|---------|-------------------|----------|
| **Free / Hobby** | $0/mo | 2 | 1GB | 1,000 | Subdomain only, community support |
| **Starter / Indie** | $7/mo or $69/yr | 10 | 15GB | 5,000 | Custom domains, email setup, priority support |
| **Pro / Unlimited** | $24/mo or $249/yr | Unlimited* | 100GB+ | 50,000 | Higher traffic, advanced features, faster support |
| **Lifetime** | $190+ one-time | Unlimited* | 100GB+ | 50,000 | Pro features forever, limited slots |

*Fair use policy applies

## Lifetime Tier Progressive Pricing

The Lifetime tier uses **progressive pricing** that increases as more licenses are sold:

- **First 20 buyers**: $190 each
- **Next 20 buyers (21-40)**: $240 each
- **Next 20 buyers (41-60)**: $290 each
- **And so on...** (+$50 per tier of 20)

### Progress Tracking

The pricing page displays:
- Current price
- Number sold
- Remaining slots at current price
- Progress bar showing tier completion
- Next tier price

## Setup Guide

### 1. Create Stripe Account

1. Sign up at [stripe.com](https://stripe.com)
2. Complete account verification
3. Navigate to Dashboard

### 2. Create Products & Prices

**Starter Plan:**
```bash
# Monthly
stripe prices create \
  --currency usd \
  --unit-amount 700 \
  --recurring[interval]=month \
  --product-data[name]="Pocket Bass Starter"

# Yearly (17% discount)
stripe prices create \
  --currency usd \
  --unit-amount 6900 \
  --recurring[interval]=year \
  --product-data[name]="Pocket Bass Starter (Yearly)"
```

**Pro Plan:**
```bash
# Monthly
stripe prices create \
  --currency usd \
  --unit-amount 2400 \
  --recurring[interval]=month \
  --product-data[name]="Pocket Bass Pro"

# Yearly
stripe prices create \
  --currency usd \
  --unit-amount 24900 \
  --recurring[interval]=year \
  --product-data[name]="Pocket Bass Pro (Yearly)"
```

### 3. Configure Environment Variables

Add to `.env` or Vercel:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_live_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key

# Price IDs (from step 2)
STRIPE_PRICE_STARTER_MONTHLY=price_xxx
STRIPE_PRICE_STARTER_YEARLY=price_xxx
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_PRO_YEARLY=price_xxx

# Lifetime tracking
LIFETIME_SOLD=0
```

### 4. Set Up Webhooks

1. **Create webhook endpoint** in Stripe Dashboard:
   - URL: `https://yourdomain.com/api/billing/webhook`
   - Events to send:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `checkout.session.completed`
     - `invoice.payment_failed`

2. **Copy webhook signing secret**:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```

3. **Test webhook locally** (development):
   ```bash
   stripe listen --forward-to localhost:3000/api/billing/webhook
   ```

### 5. Configure Billing Portal

1. Go to [Stripe Customer Portal](https://dashboard.stripe.com/settings/billing/portal)
2. Enable customer portal
3. Configure settings:
   - ✅ Allow customers to cancel subscriptions
   - ✅ Allow customers to update payment methods
   - ✅ Allow customers to view invoices
   - ⬜ (Optional) Allow plan switching

## API Endpoints

### Create Checkout Session

```typescript
POST /api/billing/checkout

{
  "tenantId": "tenant-id",
  "plan": "starter" | "pro" | "lifetime",
  "billingCycle": "monthly" | "yearly" // not required for lifetime
}

// Response
{
  "sessionId": "cs_xxx",
  "url": "https://checkout.stripe.com/..."
}
```

### Get Lifetime Pricing

```typescript
GET /api/billing/lifetime-pricing

// Response
{
  "currentPrice": 190,
  "nextPrice": 240,
  "sold": 15,
  "remainingInTier": 5,
  "progress": 75,
  "message": "5 slots remaining at $190"
}
```

### Create Billing Portal Session

```typescript
POST /api/billing/portal

{
  "tenantId": "tenant-id"
}

// Response
{
  "url": "https://billing.stripe.com/..."
}
```

## Implementation Examples

### Frontend: Subscribe Button

```typescript
async function handleSubscribe(plan: string, billingCycle: string) {
  const response = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenantId: 'your-tenant-id',
      plan,
      billingCycle,
    }),
  })

  const { url } = await response.json()
  window.location.href = url // Redirect to Stripe Checkout
}
```

### Frontend: Manage Billing

```typescript
async function openBillingPortal() {
  const response = await fetch('/api/billing/portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenantId: 'your-tenant-id',
    }),
  })

  const { url } = await response.json()
  window.location.href = url // Redirect to Stripe Portal
}
```

### Display Lifetime Progress

```typescript
function LifetimeProgress() {
  const [pricing, setPricing] = useState(null)

  useEffect(() => {
    fetch('/api/billing/lifetime-pricing')
      .then(res => res.json())
      .then(setPricing)
  }, [])

  return (
    <div>
      <h2>${pricing.currentPrice} (Limited Time)</h2>
      <div className="progress-bar">
        <div style={{ width: `${pricing.progress}%` }} />
      </div>
      <p>{pricing.message}</p>
      <p>Next price: ${pricing.nextPrice}</p>
    </div>
  )
}
```

## Webhook Events

### Subscription Created/Updated

When a subscription is created or updated:

1. Tenant plan is updated
2. Tenant status set to `active`
3. Plan limits applied
4. Billing info stored

```typescript
// Tenant update
{
  plan: 'starter',
  billingCycle: 'monthly',
  status: 'active',
  limits: { ... },
  billing: {
    stripeCustomerId: 'cus_xxx',
    stripeSubscriptionId: 'sub_xxx',
    subscriptionStatus: 'active',
    currentPeriodEnd: '2024-02-01',
  }
}
```

### Subscription Canceled

When a subscription is canceled:

1. Tenant downgraded to free plan
2. Status remains `active` until period end
3. `cancelAtPeriodEnd` set to `true`

### Payment Failed

When a payment fails:

1. Tenant status set to `suspended`
2. Subscription status set to `past_due`
3. Email sent to tenant (if configured)

### Lifetime Purchase

When lifetime access is purchased:

1. Tenant plan set to `lifetime`
2. `lifetimeAccess` set to `true`
3. Purchase date and price recorded
4. `LIFETIME_SOLD` counter incremented

## Testing

### Test Mode

Use Stripe test mode for development:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

### Test Webhooks Locally

```bash
# Terminal 1: Start app
npm run dev

# Terminal 2: Forward webhooks
stripe listen --forward-to localhost:3000/api/billing/webhook
```

### Test Subscription Flow

1. Create checkout session
2. Use test card to complete purchase
3. Verify webhook received
4. Check tenant updated in database
5. Access billing portal

## Monitoring

### Stripe Dashboard

Monitor:
- Revenue trends
- Active subscriptions
- Failed payments
- Churn rate
- Customer lifetime value

### Database Queries

```typescript
// Get revenue by plan
const revenue = await payload.find({
  collection: 'tenants',
  where: {
    'billing.subscriptionStatus': { equals: 'active' }
  }
})

// Count by plan
const byPlan = {
  starter: tenants.filter(t => t.plan === 'starter').length,
  pro: tenants.filter(t => t.plan === 'pro').length,
  lifetime: tenants.filter(t => t.billing?.lifetimeAccess).length,
}
```

### Lifetime Sales Tracking

Create a global settings collection:

```typescript
// collections/Settings.ts
export const Settings: CollectionConfig = {
  slug: 'settings',
  access: {
    read: () => true,
    update: ({ req: { user } }) => user?.role === 'super-admin',
  },
  fields: [
    {
      name: 'lifetimeSold',
      type: 'number',
      defaultValue: 0,
    },
  ],
}

// Update in webhook
await payload.update({
  collection: 'settings',
  id: 'global',
  data: {
    lifetimeSold: (settings.lifetimeSold || 0) + 1,
  },
})
```

## Security Considerations

### Webhook Verification

Always verify webhook signatures:

```typescript
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
)
```

### API Authentication

Require authentication for billing endpoints:

```typescript
// Verify user owns the tenant
if (user.tenant !== tenantId && user.role !== 'super-admin') {
  return { error: 'Unauthorized' }
}
```

### Environment Variables

- Never commit Stripe keys to git
- Use separate keys for test/production
- Rotate keys periodically
- Use Vercel environment variables

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL is correct
2. Verify SSL certificate valid
3. Check Stripe Dashboard > Webhooks > Event logs
4. Test with Stripe CLI: `stripe trigger payment_intent.succeeded`

### Checkout Session Expires

Checkout sessions expire after 24 hours. Create new session if needed.

### Payment Fails

1. Check card details valid
2. Verify billing address
3. Check for 3D Secure requirements
4. View failure reason in Stripe Dashboard

### Subscription Not Updating

1. Check webhook received
2. Verify webhook handler succeeded
3. Check tenant ID in metadata
4. Review application logs

## Production Checklist

- [ ] Switch to live Stripe keys
- [ ] Create all products and prices in live mode
- [ ] Set up live webhook endpoint
- [ ] Test subscription flow end-to-end
- [ ] Test cancellation flow
- [ ] Test payment failure handling
- [ ] Test lifetime purchase flow
- [ ] Configure customer portal settings
- [ ] Set up Stripe billing emails
- [ ] Enable tax collection (if applicable)
- [ ] Set up fraud prevention rules
- [ ] Configure 3D Secure
- [ ] Add terms of service link
- [ ] Add refund policy

## FAQ

**Q: Can customers upgrade/downgrade plans?**
A: Yes, via the Stripe billing portal. Proration is handled automatically.

**Q: What happens if payment fails?**
A: Tenant status changes to `suspended`. Stripe retries payment automatically.

**Q: Can lifetime customers get refunds?**
A: Refund policy is up to you. Stripe supports refunds via dashboard.

**Q: How do I offer discounts?**
A: Use Stripe promotion codes or coupons. Enable in checkout session.

**Q: Can I change pricing?**
A: Yes, but existing subscribers stay on old price unless they upgrade.

**Q: How do trials work?**
A: Configure trial period in Stripe product settings (e.g., 14 days).

---

**Need help?** Check the [main README](./README.md) or open an issue on GitHub.
