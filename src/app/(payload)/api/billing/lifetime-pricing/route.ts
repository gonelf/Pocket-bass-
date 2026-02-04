import { NextRequest, NextResponse } from 'next/server'
import { getLifetimePricing } from '@/utils/stripe'

/**
 * Get Lifetime Pricing Information
 *
 * Returns current lifetime pricing, sold count, and progress
 */
export async function GET(request: NextRequest) {
  try {
    const pricing = await getLifetimePricing()

    return NextResponse.json({
      currentPrice: pricing.currentPrice,
      nextPrice: pricing.nextPrice,
      sold: pricing.sold,
      remainingInTier: pricing.remainingInTier,
      nextTierAt: pricing.nextTierAt,
      tier: pricing.tier,
      progress: pricing.progress,
      message: pricing.remainingInTier === 1
        ? `Only 1 slot left at $${pricing.currentPrice}!`
        : `${pricing.remainingInTier} slots remaining at $${pricing.currentPrice}`,
    })
  } catch (error: any) {
    console.error('[Billing] Error getting lifetime pricing:', error)
    return NextResponse.json(
      {
        error: 'Failed to get lifetime pricing',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
