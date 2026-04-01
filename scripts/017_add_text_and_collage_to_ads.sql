-- Adding columns for text overlay and collage support
ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS text_overlay JSONB DEFAULT NULL;
ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS collage_config JSONB DEFAULT NULL;
ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS collage_mode BOOLEAN DEFAULT false;

-- text_overlay structure:
-- {
--   "enabled": true,
--   "text": "Your text",
--   "x": 50,
--   "y": 50,
--   "fontSize": 32,
--   "fontFamily": "Arial",
--   "fontWeight": "bold",
--   "fontStyle": "normal",
--   "textAlign": "center",
--   "color": "#000000",
--   "opacity": 1,
--   "backgroundColor": "rgba(255,255,255,0.5)"
-- }

-- collage_config structure:
-- {
--   "mode": "2x1", // "1x1", "2x1", "3x1"
--   "skewAngle": 0, // -45 to 45
--   "images": ["url1", "url2", "url3"]
-- }

COMMENT ON COLUMN public.advertisements.text_overlay IS 'JSON configuration for text overlay on advertisement image';
COMMENT ON COLUMN public.advertisements.collage_config IS 'JSON configuration for collage mode with multiple images';
