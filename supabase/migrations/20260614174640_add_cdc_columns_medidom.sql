-- Add CDC-required columns to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_pin VARCHAR(4),
  ADD COLUMN IF NOT EXISTS pickup_code VARCHAR(12),
  ADD COLUMN IF NOT EXISTS prescription_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'mobile_money',
  ADD COLUMN IF NOT EXISTS payment_operator TEXT,
  ADD COLUMN IF NOT EXISTS payment_phone TEXT,
  ADD COLUMN IF NOT EXISTS insurance_code TEXT,
  ADD COLUMN IF NOT EXISTS insurance_discount INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tip_amount INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_distance_km NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS delivery_fee INTEGER DEFAULT 500;

-- Add wallet/freeze columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS wallet_balance INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS insurance_provider TEXT,
  ADD COLUMN IF NOT EXISTS insurance_rate INTEGER DEFAULT 0;

-- Create disputes table
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  reporter_id UUID REFERENCES profiles(id),
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'open',
  resolution TEXT,
  resolved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_disputes" ON disputes FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "user_own_disputes" ON disputes FOR SELECT
  TO authenticated USING (reporter_id = auth.uid());

CREATE POLICY "user_insert_disputes" ON disputes FOR INSERT
  TO authenticated WITH CHECK (reporter_id = auth.uid());

-- Create wallet_transactions table for deliverer earnings / pharmacy payments
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'credit', 'debit', 'tip', 'bonus', 'withdrawal'
  status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  reference TEXT,
  order_id UUID REFERENCES orders(id),
  operator TEXT,
  phone TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_transactions" ON wallet_transactions FOR SELECT
  TO authenticated USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "insert_own_transactions" ON wallet_transactions FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_all_transactions" ON wallet_transactions FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
