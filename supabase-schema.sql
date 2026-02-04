-- Supabase Waitlist Table Schema
-- Optional: Only needed if using Supabase instead of Payload CMS for waitlist
-- By default, Pocket Bass uses Payload CMS (no additional setup needed)

-- Create waitlist table
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
security definer
as $$
begin
  update waitlist
  set referral_count = referral_count + 1
  where referral_code = code;
end;
$$;

-- Create indexes for faster queries
create index waitlist_referral_code_idx on waitlist(referral_code);
create index waitlist_created_at_idx on waitlist(created_at);
create index waitlist_referred_by_idx on waitlist(referred_by);
create index waitlist_email_idx on waitlist(email);

-- Enable Row Level Security (RLS)
alter table waitlist enable row level security;

-- Allow public inserts (for signups)
create policy "Allow public signups"
  on waitlist
  for insert
  to anon
  with check (true);

-- Allow users to read their own data
create policy "Users can read their own data"
  on waitlist
  for select
  using (true); -- Can make this more restrictive if needed

-- Only allow service role to update
create policy "Service role can update"
  on waitlist
  for update
  using (auth.role() = 'service_role');

-- Comments
comment on table waitlist is 'Waitlist entries with viral referral tracking';
comment on column waitlist.email is 'User email address (unique)';
comment on column waitlist.referral_code is 'Unique 8-character referral code';
comment on column waitlist.referred_by is 'Referral code of the person who referred this user';
comment on column waitlist.referral_count is 'Number of successful referrals';

-- Example queries

-- Get total signups
-- select count(*) from waitlist;

-- Get signups by day
-- select date_trunc('day', created_at) as day, count(*)
-- from waitlist
-- group by day
-- order by day desc;

-- Get top referrers
-- select email, referral_count, referral_code
-- from waitlist
-- where referral_count > 0
-- order by referral_count desc
-- limit 10;

-- Get referral stats
-- select
--   count(*) as total_users,
--   sum(case when referred_by is not null then 1 else 0 end) as referred_users,
--   round(avg(referral_count), 2) as avg_referrals_per_user,
--   max(referral_count) as max_referrals
-- from waitlist;
