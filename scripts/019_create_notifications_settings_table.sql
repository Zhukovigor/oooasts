-- Таблица для хранения настроек уведомлений (Telegram и Email)
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Telegram settings
  telegram_enabled BOOLEAN DEFAULT true,
  telegram_bot_token TEXT NOT NULL,
  telegram_chat_id TEXT NOT NULL,
  
  -- Email settings
  email_enabled BOOLEAN DEFAULT false,
  email_provider TEXT DEFAULT 'smtp', -- smtp, sendgrid, aws_ses
  email_from_address TEXT,
  email_from_name TEXT DEFAULT 'ООО АСТС',
  
  -- SMTP settings (encrypted)
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_username TEXT,
  smtp_password TEXT, -- encrypted
  
  -- Notification types
  send_to_email_on_equipment_request BOOLEAN DEFAULT true,
  send_to_email_on_leasing_request BOOLEAN DEFAULT true,
  send_to_email_on_catalog_order BOOLEAN DEFAULT true,
  send_to_email_on_job_application BOOLEAN DEFAULT true,
  
  -- Admin email for notifications
  admin_email TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_settings_active ON public.notification_settings(telegram_enabled, email_enabled);

-- Insert default settings (single row)
INSERT INTO public.notification_settings (
  telegram_bot_token,
  telegram_chat_id,
  email_enabled,
  email_provider,
  telegram_enabled
) VALUES (
  '6465481792:AAFvJieglOSfVL3YUSJh92_k5USt4RvzrDc',
  '120705872',
  false,
  'smtp',
  true
) ON CONFLICT DO NOTHING;
