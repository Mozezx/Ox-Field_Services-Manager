-- Ensure share_token exists (idempotent; safe if V10 already applied)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'service_orders' AND column_name = 'share_token'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN share_token UUID UNIQUE;
  END IF;
END $$;
