-- Добавляем недостающие поля в email_campaigns
ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS contact_list_id UUID REFERENCES contact_lists(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Переименовываем subscriber_id на contact_id и обновляем внешний ключ
ALTER TABLE email_campaign_logs
DROP CONSTRAINT IF EXISTS email_campaign_logs_subscriber_id_fkey;

ALTER TABLE email_campaign_logs
RENAME COLUMN subscriber_id TO contact_id;

ALTER TABLE email_campaign_logs
ADD CONSTRAINT email_campaign_logs_contact_id_fkey
FOREIGN KEY (contact_id) REFERENCES contact_list_contacts(id) ON DELETE CASCADE;

-- Обновляем индексы
DROP INDEX IF EXISTS idx_email_campaign_logs_subscriber_id;
CREATE INDEX IF NOT EXISTS idx_email_campaign_logs_contact_id ON email_campaign_logs(contact_id);

-- Создаем индекс на contact_list_id для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_email_campaigns_contact_list_id ON email_campaigns(contact_list_id);
