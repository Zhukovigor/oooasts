-- Create tables for A/B testing campaigns and results

CREATE TABLE IF NOT EXISTS ab_test_campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  test_type VARCHAR(50) NOT NULL, -- form, button, cta, email
  element_name VARCHAR(255) NOT NULL, -- ApplicationForm, OrderModal, CTAButton, etc
  status VARCHAR(50) DEFAULT 'active', -- active, paused, completed
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ab_test_variants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES ab_test_campaigns(id) ON DELETE CASCADE,
  variant_name VARCHAR(255) NOT NULL, -- 'Control', 'Variant A', 'Variant B', etc
  variant_key VARCHAR(100) NOT NULL, -- URL parameter key
  description TEXT,
  configuration JSONB, -- Stores CSS, text, button color, form fields, etc
  traffic_weight INT DEFAULT 50, -- Percentage of traffic to show this variant
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, variant_key)
);

CREATE TABLE IF NOT EXISTS ab_test_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES ab_test_campaigns(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES ab_test_variants(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  views INT DEFAULT 0,
  interactions INT DEFAULT 0,
  conversions INT DEFAULT 0,
  converted_at TIMESTAMP WITH TIME ZONE,
  conversion_value NUMERIC,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices for efficient querying
CREATE INDEX idx_ab_test_campaigns_status ON ab_test_campaigns(status);
CREATE INDEX idx_ab_test_variants_campaign ON ab_test_variants(campaign_id);
CREATE INDEX idx_ab_test_results_campaign ON ab_test_results(campaign_id);
CREATE INDEX idx_ab_test_results_variant ON ab_test_results(variant_id);

-- RLS Policies
ALTER TABLE ab_test_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on ab_test_campaigns" 
ON ab_test_campaigns FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on ab_test_variants" 
ON ab_test_variants FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on ab_test_results" 
ON ab_test_results FOR ALL USING (true) WITH CHECK (true);
