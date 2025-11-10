-- Create lead scoring table and add scoring fields to catalog_orders
CREATE TABLE IF NOT EXISTS lead_scoring (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES catalog_orders(id) ON DELETE CASCADE,
  score INT DEFAULT 0,
  source_score INT DEFAULT 0,
  contact_quality_score INT DEFAULT 0,
  message_quality_score INT DEFAULT 0,
  response_potential_score INT DEFAULT 0,
  scoring_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(order_id)
);

-- Add scoring fields to catalog_orders if not exist
ALTER TABLE catalog_orders 
ADD COLUMN IF NOT EXISTS lead_score INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS lead_temperature VARCHAR(20) DEFAULT 'cold', -- cold, warm, hot
ADD COLUMN IF NOT EXISTS auto_responder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_responder_sent_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_catalog_orders_lead_score ON catalog_orders(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_catalog_orders_lead_temperature ON catalog_orders(lead_temperature);

-- RLS Policy for lead_scoring
ALTER TABLE lead_scoring ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on lead_scoring" 
ON lead_scoring 
FOR ALL 
USING (true) 
WITH CHECK (true);
