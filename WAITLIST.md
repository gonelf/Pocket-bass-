# 📧 Viral Waitlist System

Complete guide to the viral waitlist system with referral links and position tracking.

## Overview

The waitlist system allows users to:
- Join the waitlist with their email
- Get a unique referral link
- Share their link to skip the line
- Track their position in realtime
- Unlock rewards for referrals

## Features

### 🎯 Referral System
- **Unique Codes**: Each signup gets an 8-character alphanumeric code (e.g., `ABC12345`)
- **Position Boost**: Each referral moves you up 1 spot (max 10 spots)
- **Viral Loop**: Referred users also get their own referral links

### 📊 Position Tracking
- **Real-time Updates**: Position calculated based on signup date + referrals
- **Fair Algorithm**: Earlier signups get priority, referrals provide boost
- **Transparent**: Users see their natural position vs boosted position

### 🎁 Reward Tiers
- **3 Referrals**: Early access
- **5 Referrals**: 20% discount
- **10 Referrals**: Lifetime deal access

## Technical Implementation

### Database Structure

The waitlist is stored in Payload CMS with this schema:

```typescript
{
  email: string // Unique email address
  referralCode: string // Unique 8-char code
  referredBy?: string // Code of referrer
  referralCount: number // Total successful referrals
  status: 'pending' | 'approved' | 'rejected'
  notified: boolean // Has been sent approval email
  createdAt: Date
}
```

### API Endpoints

**POST /api/waitlist/join**
```json
{
  "email": "user@example.com",
  "referredBy": "ABC12345" // Optional
}

// Response
{
  "success": true,
  "referralCode": "XYZ78901",
  "message": "Successfully joined the waitlist!"
}
```

**GET /api/waitlist/stats**
```json
{
  "total": 1247
}
```

**GET /api/waitlist/position?code=XYZ78901**
```json
{
  "position": 42,
  "naturalPosition": 52,
  "referralCount": 10,
  "referralBonus": 10,
  "email": "user@example.com",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Position Calculation Algorithm

```typescript
// Natural position: Based purely on signup time
let naturalPosition = 0
for (const entry of allEntries) {
  if (entry.createdAt < user.createdAt) {
    naturalPosition++
  }
}

// Referral bonus: Up to 10 positions
const referralBonus = Math.min(user.referralCount, 10)

// Final position
const position = Math.max(1, naturalPosition - referralBonus)
```

## User Flow

### 1. Landing Page
- User enters email
- Optionally includes `?ref=CODE` in URL
- Submits to join waitlist

### 2. Success Page
- Shows position in line
- Displays unique referral link
- Provides share buttons (Twitter, copy link)
- Shows referral progress (3, 5, 10 milestones)

### 3. Sharing
Users can share via:
- **Copy Link**: Direct clipboard copy
- **Twitter**: Pre-filled tweet with link
- **Native Share**: Mobile share sheet

### 4. Referral Tracking
When someone joins via referral:
- New user's `referredBy` is set
- Referrer's `referralCount` increments
- Referrer's position updates automatically

## Design Features

### Modern, Edgy Aesthetic
- **Animated Gradient Background**: 5-color gradient with smooth animation
- **Glassmorphism**: Frosted glass effects with backdrop blur
- **Floating Elements**: Ambient blurred circles that float
- **Bold Typography**: Large, impactful headings
- **Micro-interactions**: Animations on buttons and cards

### Color Palette
```
Primary Gradient:
#667eea → #764ba2 → #f093fb → #4facfe → #00f2fe

Glass Effects:
rgba(255, 255, 255, 0.1) with 10px blur

Success Green:
#10b981

Error Red:
#ef4444
```

### Components
- **Hero Section**: Large heading, animated badge, waitlist form
- **Features Grid**: 6 feature cards with icons
- **Social Proof**: "Why developers love it" section
- **Success Page**: Position display, referral link, share buttons

## Setup Instructions

### Option A: Using Payload CMS (Default)

No additional setup needed! The waitlist collection is already configured.

1. **No database setup required** - Uses existing Payload database
2. **Access admin panel** at `/admin` to view waitlist
3. **Export data** via Payload CMS admin interface

### Option B: Using Supabase (Optional)

If you prefer Supabase for the waitlist:

1. **Create Supabase Project** at [supabase.com](https://supabase.com)

2. **Create Waitlist Table**:
```sql
create table waitlist (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null,
  referral_code text unique not null,
  referred_by text,
  referral_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create function to increment referral count
create or replace function increment_referral_count(code text)
returns void
language plpgsql
as $$
begin
  update waitlist
  set referral_count = referral_count + 1
  where referral_code = code;
end;
$$;

-- Create index for faster queries
create index waitlist_referral_code_idx on waitlist(referral_code);
create index waitlist_created_at_idx on waitlist(created_at);
create index waitlist_referred_by_idx on waitlist(referred_by);
```

3. **Get Credentials**:
   - Project URL: `https://your-project.supabase.co`
   - Anon Key: Found in Settings → API

4. **Add to Environment**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

5. **Update Code** to use Supabase utilities in `src/utils/supabase.ts`

## Testing Locally

1. **Start Development Server**:
```bash
npm run dev
```

2. **Visit Homepage**:
```
http://localhost:3000
```

3. **Join Waitlist**:
   - Enter email
   - Click "Join Waitlist"
   - Get redirected to success page

4. **Test Referrals**:
   - Copy your referral link
   - Open in incognito/private window
   - See referral detection message
   - Sign up with different email
   - Check position updated

5. **View Admin Panel**:
```
http://localhost:3000/admin
```

## Marketing Tips

### Maximize Viral Growth

**1. Incentivize Sharing**
- Clear rewards for 3, 5, 10 referrals
- Show progress visually
- Make rewards compelling (early access, discounts, lifetime deals)

**2. Reduce Friction**
- Pre-filled tweets
- One-click copy link
- Mobile-friendly share sheet

**3. Create Urgency**
- Show total waitlist count
- Display position prominently
- Emphasize "skip the line"

**4. Social Proof**
- "Join 1,247+ people"
- Feature count updates in real-time
- Show leaderboard (optional)

### Pre-Launch Campaign

**Week 1-2**: Soft launch
- Share on Twitter, ProductHunt "coming soon"
- Personal network invites
- Goal: 100-500 signups

**Week 3-4**: Momentum building
- Influencer outreach
- Community posts (Reddit, IndieHackers)
- Goal: 500-2,000 signups

**Week 5-6**: Final push
- Announce launch date
- Top referrers get extra perks
- Create FOMO with countdown

**Launch Day**:
- Invite top 100 referrers first
- Then tier 2 (3+ referrals)
- Then tier 3 (1-2 referrals)
- Finally general waitlist

## Analytics

Track these metrics:

- **Total Signups**: Growth over time
- **Referral Rate**: % of signups with referral code
- **Viral Coefficient**: Average referrals per user
- **Top Referrers**: Leaderboard of most referrals
- **Conversion Rate**: Waitlist → paid user

### Supabase Analytics

```sql
-- Total signups
select count(*) from waitlist;

-- Signups by day
select date_trunc('day', created_at) as day, count(*)
from waitlist
group by day
order by day desc;

-- Referral stats
select
  count(*) as total_users,
  sum(case when referred_by is not null then 1 else 0 end) as referred_users,
  round(avg(referral_count), 2) as avg_referrals_per_user,
  max(referral_count) as max_referrals
from waitlist;

-- Top referrers
select email, referral_count, referral_code
from waitlist
where referral_count > 0
order by referral_count desc
limit 10;
```

## Exporting Data

### From Payload CMS

1. Go to `/admin/collections/waitlist`
2. Select all entries
3. Export as CSV/JSON

### From Supabase

```sql
-- Export to CSV
copy (
  select email, referral_code, referral_count, created_at
  from waitlist
  order by created_at
) to '/tmp/waitlist.csv' with csv header;
```

### Via API

```bash
# Get all waitlist entries (super admin only)
curl https://your-domain.com/api/waitlist \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Customization

### Change Referral Rewards

Edit `src/app/(frontend)/waitlist/success/page.tsx`:

```typescript
{[
  { count: 3, reward: 'Early Access' },
  { count: 5, reward: '20% Off' },
  { count: 10, reward: 'Lifetime Deal' },
].map((milestone, i) => (
  // Milestone display
))}
```

### Adjust Position Boost

Edit `src/app/(payload)/api/waitlist/position/route.ts`:

```typescript
// Each referral gives you a 1-position boost (up to 10)
const referralBonus = Math.min(user.referralCount || 0, 10)

// Change to 2 positions per referral, max 20:
const referralBonus = Math.min(user.referralCount * 2 || 0, 20)
```

### Customize Design

Colors in `src/app/(frontend)/page.tsx`:

```css
background: linear-gradient(135deg,
  #667eea 0%,
  #764ba2 25%,
  #f093fb 50%,
  #4facfe 75%,
  #00f2fe 100%
);
```

## Troubleshooting

### Referral Not Tracking

1. Check referral code is valid
2. Verify database connection
3. Check browser console for errors
4. Ensure `referred_by` field is set

### Position Not Updating

1. Clear browser cache
2. Check API response
3. Verify position calculation logic
4. Ensure database has correct indexes

### Share Button Not Working

1. Test clipboard API availability
2. Check Twitter URL encoding
3. Verify `window.location.origin` is correct
4. Test on mobile (native share)

## Production Checklist

- [ ] Test referral flow end-to-end
- [ ] Verify position calculations
- [ ] Test share buttons (Twitter, copy, native)
- [ ] Check mobile responsiveness
- [ ] Set up email notifications for new signups
- [ ] Configure analytics tracking
- [ ] Add rate limiting to join endpoint
- [ ] Set up backup/export system
- [ ] Create admin dashboard for stats
- [ ] Plan launch communication strategy

---

**Need help?** Check the [main README](./README.md) or open an issue on GitHub.
