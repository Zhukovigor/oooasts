-- Добавляем поддержку тем (threads) в Telegram группах
ALTER TABLE telegram_posting_settings 
ADD COLUMN IF NOT EXISTS thread_id INTEGER,
ADD COLUMN IF NOT EXISTS is_thread BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS group_url TEXT;

-- Создаём таблицу для связи контента с темами
CREATE TABLE IF NOT EXISTS content_thread_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('catalog', 'article', 'advertisement')),
  channel_id UUID NOT NULL REFERENCES telegram_posting_settings(id) ON DELETE CASCADE,
  auto_post BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(content_type, channel_id)
);

-- Обновляем таблицу posted_content_channels для поддержки тем
ALTER TABLE posted_content_channels 
ADD COLUMN IF NOT EXISTS thread_id INTEGER,
ADD COLUMN IF NOT EXISTS is_thread_post BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_telegram_threads ON telegram_posting_settings(thread_id) WHERE is_thread = true;

-- RLS политики - удаляем существующие и создаём новые без IF NOT EXISTS
DROP POLICY IF EXISTS "Allow all on content_thread_mapping" ON content_thread_mapping;
CREATE POLICY "Allow all on content_thread_mapping" ON content_thread_mapping FOR ALL USING (true);

-- Включаем RLS на таблице если нужно
ALTER TABLE content_thread_mapping ENABLE ROW LEVEL SECURITY;
