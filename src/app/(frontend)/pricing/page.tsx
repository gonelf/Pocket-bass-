'use client'

import { useEffect, useState } from 'react'

interface LifetimePricing {
  currentPrice: number
  nextPrice: number
  sold: number
  remainingInTier: number
  progress: number
  message: string
}

export default function PricingPage() {
  const [lifetimePricing, setLifetimePricing] = useState<LifetimePricing | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  useEffect(() => {
    fetch('/api/billing/lifetime-pricing')
      .then(res => res.json())
      .then(data => setLifetimePricing(data))
      .catch(err => console.error('Failed to load lifetime pricing:', err))
  }, [])

  const plans = [
    {
      name: 'Free / Hobby',
      price: { monthly: 0, yearly: 0 },
      description: 'For prototypes and learning',
      features: [
        '2 instances',
        '1GB storage',
        'Subdomain only',
        'Community support',
        'Fair use limits',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Starter / Indie',
      price: { monthly: 7, yearly: 69 },
      description: 'For solo devs and small MVPs',
      features: [
        '10 instances',
        '15GB storage total',
        'Custom domains',
        'Email setup',
        'Priority support',
        'Advanced features',
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Pro / Unlimited',
      price: { monthly: 24, yearly: 249 },
      description: 'For growing apps and agencies',
      features: [
        'Unlimited instances (fair use)',
        '100GB+ storage',
        'Higher traffic limits',
        'Advanced features',
        'Faster support',
        'Custom integrations',
      ],
      cta: 'Start Free Trial',
      popular: false,
    },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      padding: '4rem 2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#fafafa',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem', fontWeight: '700' }}>
            Simple, transparent pricing
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#666', marginBottom: '2rem' }}>
            Choose the plan that fits your needs. All plans include 14-day free trial.
          </p>

          {/* Billing cycle toggle */}
          <div style={{
            display: 'inline-flex',
            gap: '0.5rem',
            padding: '0.5rem',
            backgroundColor: '#e5e5e5',
            borderRadius: '8px',
          }}>
            <button
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '0.5rem 1.5rem',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: billingCycle === 'monthly' ? 'white' : 'transparent',
                color: billingCycle === 'monthly' ? '#0070f3' : '#666',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              style={{
                padding: '0.5rem 1.5rem',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: billingCycle === 'yearly' ? 'white' : 'transparent',
                color: billingCycle === 'yearly' ? '#0070f3' : '#666',
                fontWeight: '600',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              Yearly
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: '#10b981',
                color: 'white',
                fontSize: '0.65rem',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: '700',
              }}>
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginBottom: '4rem',
        }}>
          {plans.map((plan, index) => (
            <div
              key={index}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '2rem',
                border: plan.popular ? '2px solid #0070f3' : '1px solid #e5e5e5',
                position: 'relative',
                boxShadow: plan.popular ? '0 10px 30px rgba(0, 0, 0, 0.1)' : 'none',
              }}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  fontSize: '0.75rem',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontWeight: '700',
                }}>
                  MOST POPULAR
                </div>
              )}

              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: '700' }}>
                {plan.name}
              </h3>
              <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {plan.description}
              </p>

              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '3rem', fontWeight: '700' }}>
                  ${billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly}
                </span>
                <span style={{ color: '#666', fontSize: '1rem' }}>
                  {plan.price.monthly === 0 ? '/forever' : billingCycle === 'yearly' ? '/year' : '/month'}
                </span>
              </div>

              <button style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: plan.popular ? '#0070f3' : '#f5f5f5',
                color: plan.popular ? 'white' : '#333',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '1.5rem',
              }}>
                {plan.cta}
              </button>

              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
              }}>
                {plan.features.map((feature, i) => (
                  <li key={i} style={{
                    padding: '0.75rem 0',
                    borderBottom: i < plan.features.length - 1 ? '1px solid #f5f5f5' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <span style={{ color: '#10b981', fontSize: '1.25rem' }}>✓</span>
                    <span style={{ fontSize: '0.9rem' }}>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Lifetime plan */}
        {lifetimePricing && (
          <div style={{
            backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '3rem',
            color: 'white',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)',
          }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: '700' }}>
              🎉 Lifetime Deal
            </h2>
            <p style={{ fontSize: '1.25rem', marginBottom: '2rem', opacity: 0.9 }}>
              Get Pro features forever. Limited slots available!
            </p>

            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '2rem',
              marginBottom: '2rem',
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{ fontSize: '4rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                ${lifetimePricing.currentPrice}
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '1rem' }}>
                one-time payment • Early bird tier {Math.floor(lifetimePricing.sold / 20) + 1}
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                {lifetimePricing.message}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                height: '12px',
                borderRadius: '6px',
                overflow: 'hidden',
                marginBottom: '0.5rem',
              }}>
                <div style={{
                  backgroundColor: '#10b981',
                  height: '100%',
                  width: `${lifetimePricing.progress}%`,
                  transition: 'width 0.3s ease',
                  borderRadius: '6px',
                }} />
              </div>
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                {lifetimePricing.sold} sold • {lifetimePricing.remainingInTier} remaining at this price
              </div>
              {lifetimePricing.remainingInTier > 0 && (
                <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.25rem' }}>
                  Next price: ${lifetimePricing.nextPrice} (in {lifetimePricing.remainingInTier} sales)
                </div>
              )}
            </div>

            <button style={{
              padding: '1rem 3rem',
              backgroundColor: 'white',
              color: '#667eea',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}>
              Claim Lifetime Access
            </button>

            {/* Features */}
            <div style={{
              marginTop: '2rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              textAlign: 'left',
            }}>
              {[
                'Pro features forever',
                'All future updates',
                'Priority support',
                'No recurring fees',
                'Unlimited instances',
                '100GB+ storage',
              ].map((feature, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>✓</span>
                  <span style={{ fontSize: '0.9rem' }}>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQ or additional info */}
        <div style={{ marginTop: '4rem', textAlign: 'center' }}>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            All plans include 14-day free trial • Cancel anytime • No credit card required for trial
          </p>
        </div>
      </div>
    </div>
  )
}
