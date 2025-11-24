ALTER TABLE commercial_offers ADD COLUMN IF NOT EXISTS footer_text TEXT DEFAULT '';
ALTER TABLE commercial_offers ADD COLUMN IF NOT EXISTS footer_font_size INTEGER DEFAULT 12;
ALTER TABLE commercial_offers ADD COLUMN IF NOT EXISTS footer_alignment TEXT DEFAULT 'center';
ALTER TABLE commercial_offers ADD COLUMN IF NOT EXISTS footer_padding INTEGER DEFAULT 15;
