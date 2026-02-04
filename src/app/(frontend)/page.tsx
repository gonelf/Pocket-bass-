'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function Home() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [totalSignups, setTotalSignups] = useState(1247) // Start with a number
  const searchParams = useSearchParams()
  const referralCode = searchParams?.get('ref')

  useEffect(() => {
    // Fetch total signups
    fetch('/api/waitlist/stats')
      .then(res => res.json())
      .then(data => {
        if (data.total) setTotalSignups(data.total)
      })
      .catch(() => { })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/waitlist/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          referredBy: referralCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist')
      }

      // Redirect to success page with referral code
      window.location.href = `/waitlist/success?code=${data.referralCode}`
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradient 15s ease infinite',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .glass {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .glow {
          box-shadow: 0 0 40px rgba(255, 255, 255, 0.5);
        }
      `}</style>

      {/* Floating elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        filter: 'blur(60px)',
        animation: 'float 6s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        filter: 'blur(80px)',
        animation: 'float 8s ease-in-out infinite',
      }} />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Header */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 0',
          marginBottom: '3rem',
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '900',
            color: 'white',
            textShadow: '0 2px 10px rgba(0,0,0,0.2)',
          }}>
            🎸 POCKET BASS
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/pricing" style={{
              color: 'white',
              textDecoration: 'none',
              padding: '0.5rem 1.5rem',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              fontWeight: '600',
              transition: 'all 0.3s',
            }}>
              Pricing
            </Link>
            <Link href="/admin" style={{
              color: 'white',
              textDecoration: 'none',
              padding: '0.5rem 1.5rem',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              fontWeight: '600',
              transition: 'all 0.3s',
            }}>
              Login
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <main style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          paddingTop: '4rem',
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-block',
            padding: '0.5rem 1.5rem',
            borderRadius: '30px',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            fontSize: '0.9rem',
            fontWeight: '600',
            marginBottom: '2rem',
            animation: 'pulse 2s ease-in-out infinite',
          }}>
            ✨ Join {totalSignups.toLocaleString()}+ people on the waitlist
          </div>

          {/* Main Heading */}
          <h1 style={{
            fontSize: 'clamp(3rem, 10vw, 6rem)',
            fontWeight: '900',
            color: 'white',
            marginBottom: '1.5rem',
            lineHeight: '1.1',
            textShadow: '0 4px 20px rgba(0,0,0,0.3)',
            letterSpacing: '-0.02em',
          }}>
            Backend-as-a-Service
            <br />
            <span style={{
              background: 'linear-gradient(90deg, #fff, #f0f0f0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              That Just Works™
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
            color: 'rgba(255, 255, 255, 0.9)',
            maxWidth: '700px',
            marginBottom: '3rem',
            lineHeight: '1.6',
            textShadow: '0 2px 10px rgba(0,0,0,0.2)',
          }}>
            Multi-tenant. Serverless. TypeScript-native. Deploy your PocketBase-like backend on Vercel in minutes. Zero config required.
          </p>

          {/* Waitlist Form */}
          <div className="glass" style={{
            maxWidth: '600px',
            width: '100%',
            padding: '2rem',
            borderRadius: '24px',
            marginBottom: '2rem',
          }}>
            {referralCode && (
              <div style={{
                padding: '1rem',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: 'white',
                marginBottom: '1.5rem',
                fontSize: '0.9rem',
              }}>
                🎉 You were referred! You&apos;ll skip ahead in line.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                marginBottom: '1rem',
              }}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    flex: 1,
                    padding: '1rem 1.5rem',
                    borderRadius: '12px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.3s',
                  }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '1rem 2rem',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: '700',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {loading ? 'Joining...' : 'Join Waitlist'}
                </button>
              </div>

              {error && (
                <div style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'white',
                  fontSize: '0.9rem',
                }}>
                  {error}
                </div>
              )}

              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.85rem',
                marginTop: '1rem',
              }}>
                Get early access + exclusive lifetime deal
              </p>
            </form>
          </div>

          {/* Features Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginTop: '4rem',
            width: '100%',
          }}>
            {[
              { icon: '🏢', title: 'Multi-Tenant', desc: 'Isolated tenants with subdomain routing' },
              { icon: '💳', title: 'Stripe Billing', desc: '4 pricing tiers + lifetime deals' },
              { icon: '⚡', title: 'Auto APIs', desc: 'REST & GraphQL out of the box' },
              { icon: '🔐', title: 'Auth Built-in', desc: 'JWT, email verification, 2FA ready' },
              { icon: '📦', title: 'R2 Storage', desc: 'Cloudflare R2 for files & media' },
              { icon: '🚀', title: 'Vercel Deploy', desc: 'One-click serverless deployment' },
            ].map((feature, i) => (
              <div
                key={i}
                className="glass"
                style={{
                  padding: '1.5rem',
                  borderRadius: '16px',
                  textAlign: 'center',
                  transition: 'all 0.3s',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  color: 'white',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.9rem',
                  lineHeight: '1.4',
                }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Social Proof */}
          <div style={{
            marginTop: '4rem',
            padding: '2rem',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            maxWidth: '800px',
          }}>
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '1rem',
            }}>
              Why developers love it:
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              textAlign: 'left',
            }}>
              {[
                '✓ Deploy in 2 minutes',
                '✓ TypeScript-native',
                '✓ Zero config required',
                '✓ Auto-scaling',
                '✓ EU region optimized',
                '✓ Open source',
              ].map((item, i) => (
                <div key={i} style={{
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer style={{
          marginTop: '6rem',
          paddingTop: '2rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '0.9rem',
        }}>
          <p>Built with Payload CMS • Hosted on Vercel • Powered by Cloudflare R2</p>
        </footer>
      </div>
    </div>
  )
}
