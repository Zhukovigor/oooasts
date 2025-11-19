-- Create commercial offers table
CREATE TABLE IF NOT EXISTS commercial_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  equipment_id UUID REFERENCES catalog_models(id) ON DELETE CASCADE,
  price DECIMAL(15, 2) NOT NULL,
  price_with_vat DECIMAL(15, 2),
  currency VARCHAR(3) DEFAULT 'RUB',
  availability VARCHAR(50), -- "В наличии", "На заказ"
  payment_type VARCHAR(50), -- "Наличные", "Безналичные", "Лизинг"
  vat_included BOOLEAN DEFAULT true,
  diagnostics_passed BOOLEAN DEFAULT false,
  image_url VARCHAR(500),
  specifications JSONB,
  terms TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID
);

-- Create offer templates for quick generation
CREATE TABLE IF NOT EXISTS offer_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  company_name VARCHAR(255),
  company_details JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE commercial_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Allow all on commercial_offers" ON commercial_offers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on offer_templates" ON offer_templates FOR ALL USING (true) WITH CHECK (true);
