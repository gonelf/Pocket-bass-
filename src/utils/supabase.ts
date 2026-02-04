import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing configuration. Waitlist features disabled.')
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Waitlist utilities
export async function createWaitlistEntry(email: string, referredBy?: string) {
  if (!supabase) throw new Error('Supabase not configured')

  // Generate unique referral code
  const referralCode = generateReferralCode()

  // Create waitlist entry
  const { data, error } = await supabase
    .from('waitlist')
    .insert([
      {
        email,
        referral_code: referralCode,
        referred_by: referredBy || null,
        referral_count: 0,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) throw error

  // If referred by someone, increment their referral count
  if (referredBy) {
    await supabase.rpc('increment_referral_count', { code: referredBy })
  }

  return data
}

export async function getWaitlistPosition(email: string) {
  if (!supabase) throw new Error('Supabase not configured')

  // Get the user's entry
  const { data: user, error: userError } = await supabase
    .from('waitlist')
    .select('*')
    .eq('email', email)
    .single()

  if (userError) throw userError

  // Calculate position based on:
  // 1. Earlier signup date
  // 2. More referrals = higher priority
  const { count, error: countError } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true })
    .or(`created_at.lt.${user.created_at},and(created_at.eq.${user.created_at},referral_count.gt.${user.referral_count})`)

  if (countError) throw countError

  return {
    position: (count || 0) + 1,
    referralCount: user.referral_count || 0,
    referralCode: user.referral_code,
    createdAt: user.created_at,
  }
}

export async function getWaitlistStats() {
  if (!supabase) throw new Error('Supabase not configured')

  const { count, error } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true })

  if (error) throw error

  return {
    total: count || 0,
  }
}

export async function validateReferralCode(code: string) {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('waitlist')
    .select('referral_code')
    .eq('referral_code', code)
    .single()

  return !error && !!data
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
