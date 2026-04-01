-- Create SMTP accounts table for managing multiple email sending accounts
CREATE TABLE IF NOT EXISTS smtp_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  smtp_host VARCHAR(255) NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_user VARCHAR(255) NOT NULL,
  smtp_password VARCHAR(255) NOT NULL,
  use_tls BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  daily_limit INTEGER DEFAULT 500,
  sent_today INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE smtp_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Allow all operations on smtp accounts" ON smtp_accounts FOR ALL USING (true);

-- Create trigger
CREATE TRIGGER update_smtp_accounts_updated_at BEFORE UPDATE ON smtp_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default SMTP accounts for mail.ru and yandex.ru
INSERT INTO smtp_accounts (name, email, smtp_host, smtp_port, smtp_user, smtp_password, use_tls) VALUES
  ('Mail.ru Account', 'your-email@mail.ru', 'smtp.mail.ru', 465, 'your-email@mail.ru', 'your-password', true),
  ('Yandex Account', 'your-email@yandex.ru', 'smtp.yandex.ru', 465, 'your-email@yandex.ru', 'your-password', true)
ON CONFLICT (email) DO NOTHING;
