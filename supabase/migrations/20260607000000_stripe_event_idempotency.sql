-- Stripe webhook idempotency log.
--
-- Stripe retries failed webhook deliveries automatically (up to 3 days),
-- and the Dashboard's "Replay" button can resend any past event. Without
-- de-duplication, replaying a checkout.session.completed would re-run
-- the plan flip (no harm, idempotent state) but replaying an
-- invoice.payment_succeeded would extend plan_expires_at by another
-- 30 days each time — silently overpaying users.
--
-- The fix: log every processed event.id BEFORE doing any DB work. If
-- the row already exists, ACK 200 immediately without re-processing.
-- Stripe accepts that as "successfully handled" and stops retrying.

CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
  event_id    TEXT PRIMARY KEY,
  event_type  TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.processed_stripe_events IS
  'One row per Stripe webhook event we have successfully handled. The webhook function checks event_id here before doing any DB work to make retries / replays idempotent.';

-- Optional housekeeping: keep only 90 days of history. Webhooks older
-- than that can never be replayed by Stripe anyway. Run from a cron
-- if/when the table starts growing.
CREATE INDEX IF NOT EXISTS processed_stripe_events_processed_at_idx
  ON public.processed_stripe_events (processed_at);
