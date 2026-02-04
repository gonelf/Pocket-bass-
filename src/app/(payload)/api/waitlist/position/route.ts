import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

/**
 * Waitlist Position API
 *
 * Returns user's position in the waitlist
 */
export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      )
    }

    // Get the user's entry
    const userResult = await payload.find({
      collection: 'waitlist',
      where: {
        referralCode: {
          equals: code,
        },
      },
      limit: 1,
    })

    if (userResult.docs.length === 0) {
      return NextResponse.json(
        { error: 'Waitlist entry not found' },
        { status: 404 }
      )
    }

    const user = userResult.docs[0]

    // Calculate position based on:
    // 1. Earlier signup date (more important)
    // 2. More referrals = higher priority (bonus)

    // Get all entries that should be ahead of this user
    const allEntries = await payload.find({
      collection: 'waitlist',
      limit: 10000, // Increase if you expect more
      sort: 'createdAt',
    })

    // Calculate position with referral bonus
    // Each referral gives you a 1-position boost (up to 10)
    const referralBonus = Math.min(user.referralCount || 0, 10)

    // Find natural position by creation time
    let naturalPosition = 0
    for (const entry of allEntries.docs) {
      if (entry.createdAt < user.createdAt) {
        naturalPosition++
      }
    }

    // Apply referral bonus
    const position = Math.max(1, naturalPosition - referralBonus)

    return NextResponse.json({
      position,
      naturalPosition: naturalPosition + 1,
      referralCount: user.referralCount || 0,
      referralBonus,
      email: user.email,
      createdAt: user.createdAt,
    })
  } catch (error: any) {
    console.error('[Waitlist] Error getting position:', error)
    return NextResponse.json(
      {
        error: 'Failed to get waitlist position',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
