-- Create table to track what content has been posted
CREATE TABLE IF NOT EXISTS posted_content_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL, -- 'catalog', 'articles', 'advertisements'
  content_id uuid NOT NULL,
  posted_at timestamp without time zone DEFAULT now(),
  telegram_message_id text,
  status text DEFAULT 'posted', -- 'posted', 'failed', 'pending'
  error_message text,
  created_at timestamp without time zone DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_posted_content_tracking_type_id 
  ON posted_content_tracking(content_type, content_id);
