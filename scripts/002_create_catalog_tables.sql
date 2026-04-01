-- Create equipment categories table for catalog
CREATE TABLE IF NOT EXISTS catalog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  icon_name VARCHAR(100),
  specs_summary TEXT, -- e.g., "Мощность 112~176 кВт | 11.6~18.5 тонн"
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create equipment models table
CREATE TABLE IF NOT EXISTS catalog_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES catalog_categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  model_code VARCHAR(100), -- e.g., "SE150", "SANY 33"
  description TEXT,
  main_image TEXT,
  images TEXT[], -- Array of image URLs
  
  -- Basic specs
  working_weight INTEGER, -- kg
  bucket_volume NUMERIC(10, 2), -- m³
  max_digging_depth INTEGER, -- mm
  max_reach INTEGER, -- mm
  engine_manufacturer VARCHAR(100),
  engine_power INTEGER, -- kW
  engine_model VARCHAR(100),
  
  -- Additional specs stored as JSONB for flexibility
  specifications JSONB,
  
  -- Pricing
  price_on_request BOOLEAN DEFAULT true,
  price NUMERIC(12, 2),
  currency VARCHAR(10) DEFAULT 'RUB',
  
  -- Meta
  views_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table for catalog orders
CREATE TABLE IF NOT EXISTS catalog_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES catalog_models(id) ON DELETE SET NULL,
  model_name VARCHAR(255),
  
  -- Customer info
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_email VARCHAR(255),
  customer_comment TEXT,
  
  -- Order meta
  status VARCHAR(50) DEFAULT 'new', -- new, contacted, completed, cancelled
  source VARCHAR(50) DEFAULT 'website',
  ip_address INET,
  user_agent TEXT,
  
  -- Telegram notification
  telegram_sent BOOLEAN DEFAULT false,
  telegram_message_id TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_catalog_categories_slug ON catalog_categories(slug);
CREATE INDEX IF NOT EXISTS idx_catalog_categories_active ON catalog_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_catalog_models_category ON catalog_models(category_id);
CREATE INDEX IF NOT EXISTS idx_catalog_models_slug ON catalog_models(slug);
CREATE INDEX IF NOT EXISTS idx_catalog_models_active ON catalog_models(is_active);
CREATE INDEX IF NOT EXISTS idx_catalog_orders_model ON catalog_orders(model_id);
CREATE INDEX IF NOT EXISTS idx_catalog_orders_status ON catalog_orders(status);
CREATE INDEX IF NOT EXISTS idx_catalog_orders_created ON catalog_orders(created_at DESC);

-- Add RLS policies
ALTER TABLE catalog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_orders ENABLE ROW LEVEL SECURITY;

-- Public read access for categories and models
CREATE POLICY "Public can view active categories" ON catalog_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active models" ON catalog_models
  FOR SELECT USING (is_active = true);

-- Public can insert orders
CREATE POLICY "Public can create orders" ON catalog_orders
  FOR INSERT WITH CHECK (true);

-- Add updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_catalog_categories_updated_at
  BEFORE UPDATE ON catalog_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_catalog_models_updated_at
  BEFORE UPDATE ON catalog_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_catalog_orders_updated_at
  BEFORE UPDATE ON catalog_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
