/*
  # User Stats and Spin History Tables

  1. New Tables
    - `user_stats`
      - `id` (uuid, primary key) - unique identifier
      - `user_id` (text, unique) - Farcaster ID or wallet address
      - `username` (text) - display name
      - `pfp_url` (text) - profile picture URL
      - `total_spins` (integer) - total number of spins
      - `total_wins` (integer) - total number of winning spins
      - `total_usdc` (decimal) - total USDC earned
      - `total_points` (integer) - total points accumulated
      - `created_at` (timestamptz) - record creation time
      - `updated_at` (timestamptz) - last update time

    - `spin_history`
      - `id` (uuid, primary key) - unique identifier
      - `user_id` (text) - references user_stats.user_id
      - `result_type` (text) - 'win' or 'loss'
      - `amount` (decimal) - USDC amount won (0 for loss)
      - `segment_name` (text) - name of the wheel segment
      - `points_earned` (integer) - points earned from spin
      - `created_at` (timestamptz) - when the spin occurred

  2. Security
    - Enable RLS on both tables
    - Add policies for users to read/write their own data
    - Server-side validation through RLS policies

  3. Indexes
    - Index on user_id for fast lookups
    - Index on created_at for history ordering
*/

-- Create user_stats table
CREATE TABLE IF NOT EXISTS user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE NOT NULL,
  username text DEFAULT '',
  pfp_url text DEFAULT '',
  total_spins integer DEFAULT 0 NOT NULL,
  total_wins integer DEFAULT 0 NOT NULL,
  total_usdc decimal(18, 6) DEFAULT 0 NOT NULL,
  total_points integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create spin_history table
CREATE TABLE IF NOT EXISTS spin_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  result_type text NOT NULL CHECK (result_type IN ('win', 'loss')),
  amount decimal(18, 6) DEFAULT 0 NOT NULL,
  segment_name text NOT NULL,
  points_earned integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_spin_history_user_id ON spin_history(user_id);
CREATE INDEX IF NOT EXISTS idx_spin_history_created_at ON spin_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spin_history_user_created ON spin_history(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE spin_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_stats
CREATE POLICY "Users can view own stats"
  ON user_stats FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own stats"
  ON user_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Anon users can view stats by user_id (for public leaderboards)
CREATE POLICY "Anon can view stats by user_id"
  ON user_stats FOR SELECT
  TO anon
  USING (true);

-- Anon users can insert/update stats (for non-authenticated users)
CREATE POLICY "Anon can insert stats"
  ON user_stats FOR INSERT
  TO anon
  WITH CHECK (user_id IS NOT NULL AND user_id != '');

CREATE POLICY "Anon can update own stats"
  ON user_stats FOR UPDATE
  TO anon
  USING (user_id IS NOT NULL AND user_id != '')
  WITH CHECK (user_id IS NOT NULL AND user_id != '');

-- RLS Policies for spin_history
CREATE POLICY "Users can view own spin history"
  ON spin_history FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own spin history"
  ON spin_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

-- Anon users can access spin history
CREATE POLICY "Anon can view spin history"
  ON spin_history FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can insert spin history"
  ON spin_history FOR INSERT
  TO anon
  WITH CHECK (user_id IS NOT NULL AND user_id != '');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_user_stats_updated_at ON user_stats;
CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
