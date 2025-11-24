-- Adding missing fields to commercial_offers table for styling
ALTER TABLE public.commercial_offers
ADD COLUMN IF NOT EXISTS header_image_url TEXT,
ADD COLUMN IF NOT EXISTS title_font_size INTEGER DEFAULT 28,
ADD COLUMN IF NOT EXISTS equipment_font_size INTEGER DEFAULT 16,
ADD COLUMN IF NOT EXISTS price_block_offset INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS photo_scale NUMERIC DEFAULT 1,
ADD COLUMN IF NOT EXISTS offer_title TEXT DEFAULT 'КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ';
