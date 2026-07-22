-- ===============================================================
-- CHRAD.MA — AUTOMATED ESCROW RELEASE CRON JOB
-- Automatically confirms delivered tasks older than 24 hours
-- and releases escrow funds to the runner's wallet balance.
-- ===============================================================

-- 1. Ensure delivered_at column exists
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- 2. Create auto-release function
CREATE OR REPLACE FUNCTION auto_confirm_delivered_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
  runner_share NUMERIC;
  commission_fee NUMERIC;
BEGIN
  -- Loop through tasks delivered over 24 hours ago that have not been confirmed or disputed
  FOR r IN 
    SELECT t.id, t.accepted_runner_id, t.offered_price, t.delivered_at
    FROM tasks t
    LEFT JOIN disputes d ON d.task_id = t.id AND d.status = 'open'
    WHERE t.status = 'delivered'
      AND d.id IS NULL -- No active dispute
      AND (t.delivered_at IS NULL OR t.delivered_at <= NOW() - INTERVAL '24 hours')
  LOOP
    -- Calculate 90% runner payout / 10% platform fee
    runner_share := r.offered_price * 0.90;
    commission_fee := r.offered_price * 0.10;

    -- Update task status to confirmed
    UPDATE tasks 
    SET status = 'confirmed',
        runner_paid = true,
        runner_payout_at = NOW()
    WHERE id = r.id;

    -- Credit runner wallet balance and total earnings
    UPDATE profiles
    SET wallet_balance = wallet_balance + runner_share,
        earnings = earnings + runner_share
    WHERE id = r.accepted_runner_id;

    -- Record completed transaction in wallet_transactions
    INSERT INTO wallet_transactions (user_id, type, amount, description, status, created_at)
    VALUES (
      r.accepted_runner_id,
      'payout',
      runner_share,
      CONCAT('Auto-Released Escrow Payout for Task #', SUBSTRING(r.id FROM 1 FOR 8)),
      'completed',
      NOW()
    );

    -- Log system audit action
    INSERT INTO admin_audit_log (action, target_type, target_id, details, created_at)
    VALUES (
      'AUTO_RELEASE_ESCROW',
      'task',
      r.id,
      json_build_object('runner_id', r.accepted_runner_id, 'payout_amount', runner_share, 'commission', commission_fee),
      NOW()
    );

    RAISE NOTICE 'Auto-confirmed task % and credited % to runner %', r.id, runner_share, r.accepted_runner_id;
  END LOOP;
END;
$$;

-- 2. Schedule cron job using pg_cron (runs every hour at minute 0)
-- Note: Enable pg_cron in Supabase Database Extensions first.
SELECT cron.schedule(
  'auto-release-escrow-hourly',
  '0 * * * *',
  'SELECT auto_confirm_delivered_tasks();'
);
