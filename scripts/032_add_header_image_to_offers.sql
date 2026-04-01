-- Add header_image_url column to commercial_offers table
ALTER TABLE commercial_offers ADD COLUMN IF NOT EXISTS header_image_url VARCHAR(500);

-- Add header info to offer_templates
ALTER TABLE offer_templates ADD COLUMN IF NOT EXISTS header_image_url VARCHAR(500);
ALTER TABLE offer_templates ADD COLUMN IF NOT EXISTS header_text JSONB;
