-- Create hero_slides table for banner management
CREATE TABLE IF NOT EXISTS hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  image_alt TEXT,
  
  -- Button settings
  button_text TEXT DEFAULT 'Связаться с нами',
  button_link TEXT DEFAULT '#join',
  button_visible BOOLEAN DEFAULT true,
  button_color TEXT DEFAULT '#2563eb',
  button_text_color TEXT DEFAULT '#ffffff',
  
  -- Text styling
  title_font_size TEXT DEFAULT '5xl',
  title_font_weight TEXT DEFAULT 'black',
  title_color TEXT DEFAULT '#ffffff',
  title_alignment TEXT DEFAULT 'left',
  
  subtitle_font_size TEXT DEFAULT 'xl',
  subtitle_font_weight TEXT DEFAULT 'extrabold',
  subtitle_color TEXT DEFAULT '#e5e7eb',
  
  -- Content positioning
  content_position TEXT DEFAULT 'center',
  content_alignment TEXT DEFAULT 'left',
  
  -- Background overlay
  overlay_opacity NUMERIC DEFAULT 0.5,
  overlay_color TEXT DEFAULT '#000000',
  
  -- Slide settings
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  auto_rotate_seconds INTEGER DEFAULT 15,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for sorting
CREATE INDEX IF NOT EXISTS idx_hero_slides_sort_order ON hero_slides(sort_order);
CREATE INDEX IF NOT EXISTS idx_hero_slides_active ON hero_slides(is_active);

-- Enable RLS
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public to view active slides
CREATE POLICY "Allow public read access to active slides"
  ON hero_slides
  FOR SELECT
  USING (is_active = true);

-- Policy: Allow all operations (for admin)
CREATE POLICY "Allow all operations on hero_slides"
  ON hero_slides
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert default slides from current hero-section
INSERT INTO hero_slides (title, subtitle, image_url, image_alt, sort_order, is_active) VALUES
('КУПИТЬ АВТО БЕТОНОНАСОС', 'Автобетононасосы от 33 до 71 метра', '/images/design-mode/maps.jpg', 'Экскаватор Komatsu PC400', 1, true),
('ТЕХНИКА В ЛИЗИНГ', 'Надежная спецтехника в лизинг от 10%', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20250924-WA0013-KWy9wO28j8PP3TRK8Tsx5l9VTS6pcb.jpg', 'Экскаватор Komatsu PC300', 2, true),
('КУПИТЬ ЭКСКАВАТОР KOMATSU', 'Поставка новой и б/у спецтехники из Китая', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20250928-WA0007-SP2bEOhxUA4q43KyjUxSnmH5q42Ot6.jpg', 'Экскаватор Komatsu PC200', 3, true),
('ДОСТАВКА ТЕХНИКИ ИЗ КИТАЯ', 'Всё для успешного бизнеса с Китаем', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/maps.jpg.jpg', 'ДОСТАВКА ТЕХНИКИ ИЗ КИТАЯ', 4, true);
