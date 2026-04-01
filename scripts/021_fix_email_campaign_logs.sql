-- Update email_campaign_logs to use contact_list_contacts instead of newsletter_subscribers
-- Drop old foreign key constraint if exists
ALTER TABLE email_campaign_logs 
DROP CONSTRAINT IF EXISTS email_campaign_logs_subscriber_id_fkey;

-- Rename subscriber_id to contact_id if column still exists
DO $$ 
BEGIN 
  IF EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='email_campaign_logs' AND column_name='subscriber_id'
  ) THEN
    ALTER TABLE email_campaign_logs RENAME COLUMN subscriber_id TO contact_id;
  END IF;
END $$;

-- Add contact_id column if it doesn't exist
ALTER TABLE email_campaign_logs 
ADD COLUMN IF NOT EXISTS contact_id UUID;

-- Add foreign key for contact_list_contacts if not exists
ALTER TABLE email_campaign_logs
ADD CONSTRAINT email_campaign_logs_contact_id_fkey 
FOREIGN KEY (contact_id) REFERENCES contact_list_contacts(id) ON DELETE CASCADE;

-- Add missing columns to email_campaigns table
ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Update indexes
DROP INDEX IF EXISTS idx_email_campaign_logs_subscriber_id;
CREATE INDEX IF NOT EXISTS idx_email_campaign_logs_contact_id ON email_campaign_logs(contact_id);
