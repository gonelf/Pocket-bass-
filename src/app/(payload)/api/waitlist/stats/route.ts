import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

/**
 * Waitlist Stats API
 *
 * Returns total number of waitlist signups
 */
export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'waitlist',
      limit: 0, // We only need the count
    })

    return NextResponse.json({
      total: result.totalDocs,
    })
  } catch (error: any) {
    console.error('[Waitlist] Error getting stats:', error)
    return NextResponse.json(
      {
        error: 'Failed to get waitlist stats',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
