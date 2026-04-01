-- Add WebP columns to hero_slides table
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS image_webp_url TEXT;
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS image_conversion_status TEXT DEFAULT 'pending';
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS image_original_size INTEGER;
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS image_webp_size INTEGER;
