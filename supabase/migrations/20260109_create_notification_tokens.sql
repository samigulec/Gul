-- Create notification_tokens table for Farcaster MiniApp notifications
CREATE TABLE IF NOT EXISTS notification_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    fid BIGINT,
    notification_url TEXT NOT NULL,
    notification_token TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for active tokens
CREATE INDEX IF NOT EXISTS idx_notification_tokens_active ON notification_tokens(is_active) WHERE is_active = true;

-- Create index for user_id
CREATE INDEX IF NOT EXISTS idx_notification_tokens_user_id ON notification_tokens(user_id);

-- Enable RLS
ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;

-- Allow insert/update for anyone (tokens are not sensitive)
CREATE POLICY "Allow insert notification tokens" ON notification_tokens
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update notification tokens" ON notification_tokens
    FOR UPDATE USING (true);

-- Allow read for authenticated users (for admin/batch sending)
CREATE POLICY "Allow read notification tokens" ON notification_tokens
    FOR SELECT USING (true);

-- Create notification_history table to track sent notifications
CREATE TABLE IF NOT EXISTS notification_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    total_sent INTEGER DEFAULT 0,
    total_failed INTEGER DEFAULT 0,
    message TEXT,
    results JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for history
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- Allow insert for service role
CREATE POLICY "Allow insert notification history" ON notification_history
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read notification history" ON notification_history
    FOR SELECT USING (true);

