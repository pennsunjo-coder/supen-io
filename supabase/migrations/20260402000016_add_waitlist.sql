-- Waitlist pre-launch table
-- Run this in the Supabase SQL Editor to create the waitlist system

CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT DEFAULT '',
  plan TEXT DEFAULT 'free',        -- 'free', 'plus', 'pro'
  paid BOOLEAN DEFAULT FALSE,
  payment_intent TEXT DEFAULT NULL,
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS waitlist_email_idx
  ON public.waitlist(email);
CREATE INDEX IF NOT EXISTS waitlist_notified_idx
  ON public.waitlist(notified);
CREATE INDEX IF NOT EXISTS waitlist_plan_idx
  ON public.waitlist(plan);

-- RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read waitlist count"
  ON public.waitlist FOR SELECT
  USING (true);
