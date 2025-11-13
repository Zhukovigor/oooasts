-- Create Telegram posting configuration and queue tables
CREATE TABLE IF NOT EXISTS telegram_posting_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_token TEXT NOT NULL,
  channel_id BIGINT NOT NULL,
  channel_username TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posting_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('catalog', 'article', 'advertisement')),
  content_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  post_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  telegram_message_id INTEGER,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE telegram_posting_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE posting_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on telegram_posting_settings" ON telegram_posting_settings FOR ALL USING (true);
CREATE POLICY "Allow all on posting_queue" ON posting_queue FOR ALL USING (true);

CREATE INDEX idx_posting_queue_status ON posting_queue(status);
CREATE INDEX idx_posting_queue_content_type ON posting_queue(content_type);
CREATE INDEX idx_posting_queue_created_at ON posting_queue(created_at DESC);
