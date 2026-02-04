'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function WaitlistSuccessContent() {
  const [copied, setCopied] = useState(false)
  const [position, setPosition] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const referralCode = searchParams?.get('code')

  const referralLink = `${window.location.origin}?ref=${referralCode}`

  useEffect(() => {
    if (referralCode) {
      fetch(`/api/waitlist/position?code=${referralCode}`)
        .then(res => res.json())
        .then(data => {
          setPosition(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [referralCode])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareOnTwitter = () => {
    const text = `I just joined the waitlist for Pocket Bass - a modern Backend-as-a-Service! 🎸\n\nJoin me and skip the line:`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`, '_blank')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradient 15s ease infinite',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

      <div style={{
        maxWidth: '600px',
        width: '100%',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '24px',
        padding: '3rem',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        textAlign: 'center',
      }}>
        {/* Success Icon */}
        <div style={{
          fontSize: '4rem',
          marginBottom: '1rem',
          animation: 'bounce 2s ease-in-out infinite',
        }}>
          🎉
        </div>

        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '900',
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          You&apos;re on the list!
        </h1>

        {/* Position Info */}
        {!loading && position && (
          <div style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}>
            <div style={{ fontSize: '1rem', marginBottom: '0.5rem', opacity: 0.9 }}>
              Your position
            </div>
            <div style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '0.5rem' }}>
              #{position.position}
            </div>
            {position.referralCount > 0 && (
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                🚀 Boosted {position.referralBonus} spots from {position.referralCount} referral{position.referralCount === 1 ? '' : 's'}!
              </div>
            )}
          </div>
        )}

        <p style={{
          fontSize: '1.1rem',
          color: '#666',
          marginBottom: '2rem',
          lineHeight: '1.6',
        }}>
          Want to skip the line? Share your unique referral link and move up for each friend who joins!
        </p>

        {/* Referral Link Box */}
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          borderRadius: '12px',
          background: '#f5f5f5',
          border: '2px solid #e5e5e5',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <input
            type="text"
            value={referralLink}
            readOnly
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              fontSize: '0.9rem',
              color: '#666',
              outline: 'none',
            }}
          />
          <button
            onClick={copyToClipboard}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: copied ? '#10b981' : '#667eea',
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s',
              whiteSpace: 'nowrap',
            }}
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>

        {/* Share Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginBottom: '2rem',
        }}>
          <button
            onClick={shareOnTwitter}
            style={{
              padding: '1rem',
              borderRadius: '12px',
              border: 'none',
              background: '#1DA1F2',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <span>🐦</span> Twitter
          </button>
          <button
            onClick={() => {
              const text = `Join Pocket Bass waitlist and skip the line with my referral link!`
              if (navigator.share) {
                navigator.share({ title: 'Pocket Bass', text, url: referralLink })
              } else {
                copyToClipboard()
              }
            }}
            style={{
              padding: '1rem',
              borderRadius: '12px',
              border: '2px solid #667eea',
              background: 'white',
              color: '#667eea',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
          >
            Share
          </button>
        </div>

        {/* Referral Incentive */}
        <div style={{
          padding: '1.5rem',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          marginBottom: '2rem',
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            💎
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            Referral Rewards
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.95 }}>
            Each friend who joins moves you up 1 spot + unlocks exclusive early bird pricing!
          </div>
        </div>

        {/* Progress Indicators */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '2rem',
        }}>
          {[
            { count: 3, reward: 'Early Access' },
            { count: 5, reward: '20% Off' },
            { count: 10, reward: 'Lifetime Deal' },
          ].map((milestone, i) => (
            <div
              key={i}
              style={{
                padding: '1rem',
                borderRadius: '12px',
                background: '#f5f5f5',
                border: position?.referralCount >= milestone.count ? '2px solid #10b981' : '2px solid #e5e5e5',
              }}
            >
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '900',
                color: position?.referralCount >= milestone.count ? '#10b981' : '#666',
                marginBottom: '0.25rem',
              }}>
                {milestone.count}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#666',
                fontWeight: '600',
              }}>
                {milestone.reward}
              </div>
            </div>
          ))}
        </div>

        {/* Back to Home */}
        <Link
          href="/"
          style={{
            display: 'inline-block',
            color: '#667eea',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: '600',
          }}
        >
          ← Back to home
        </Link>
      </div>
    </div>
  )
}

export default function WaitlistSuccess() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WaitlistSuccessContent />
    </Suspense>
  )
}
