import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

/**
 * Waitlist Join API
 *
 * Allows users to join the waitlist with optional referral code
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()

    const { email, referredBy } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existing = await payload.find({
      collection: 'waitlist',
      where: {
        email: {
          equals: email,
        },
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      return NextResponse.json(
        { error: 'Email already on waitlist', referralCode: existing.docs[0].referralCode },
        { status: 409 }
      )
    }

    // Validate referral code if provided
    if (referredBy) {
      const referrer = await payload.find({
        collection: 'waitlist',
        where: {
          referralCode: {
            equals: referredBy,
          },
        },
        limit: 1,
      })

      if (referrer.docs.length === 0) {
        return NextResponse.json(
          { error: 'Invalid referral code' },
          { status: 400 }
        )
      }
    }

    // Create waitlist entry
    const entry = await payload.create({
      collection: 'waitlist',
      data: {
        email,
        referredBy: referredBy || undefined,
      },
    })

    console.log(`[Waitlist] New signup: ${email}${referredBy ? ` (referred by ${referredBy})` : ''}`)

    return NextResponse.json({
      success: true,
      referralCode: entry.referralCode,
      message: 'Successfully joined the waitlist!',
    })
  } catch (error: any) {
    console.error('[Waitlist] Error joining waitlist:', error)
    return NextResponse.json(
      {
        error: 'Failed to join waitlist',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
