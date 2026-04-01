-- Измена таблицы telegram_posting_settings для поддержки нескольких каналов
ALTER TABLE telegram_posting_settings ADD COLUMN IF NOT EXISTS channel_name TEXT;
ALTER TABLE telegram_posting_settings ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Создание таблицы для привязки контента к каналам
CREATE TABLE IF NOT EXISTS content_channel_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('catalog', 'article', 'advertisement')),
  channel_id UUID NOT NULL REFERENCES telegram_posting_settings(id) ON DELETE CASCADE,
  auto_post BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(content_type, channel_id)
);

-- Таблица для отслеживания какой контент опубликован в каком канале
CREATE TABLE IF NOT EXISTS posted_content_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  channel_id UUID NOT NULL REFERENCES telegram_posting_settings(id) ON DELETE CASCADE,
  telegram_message_id INTEGER,
  posted_at TIMESTAMP DEFAULT now(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  UNIQUE(content_type, content_id, channel_id)
);

ALTER TABLE content_channel_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE posted_content_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on content_channel_mapping" ON content_channel_mapping FOR ALL USING (true);
CREATE POLICY "Allow all on posted_content_channels" ON posted_content_channels FOR ALL USING (true);

CREATE INDEX idx_content_channel_mapping_content_type ON content_channel_mapping(content_type);
CREATE INDEX idx_posted_content_channels_content_id ON posted_content_channels(content_id);
CREATE INDEX idx_posted_content_channels_channel_id ON posted_content_channels(channel_id);
