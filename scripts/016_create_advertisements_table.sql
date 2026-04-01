CREATE TABLE IF NOT EXISTS public.advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title CHARACTER VARYING NOT NULL,
  description TEXT,
  image_url TEXT,
  button_text CHARACTER VARYING DEFAULT 'Подробнее',
  button_url TEXT,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  display_duration_seconds INTEGER DEFAULT 10,
  close_delay_seconds INTEGER DEFAULT 5,
  max_shows_per_day INTEGER DEFAULT 3,
  shows_today INTEGER DEFAULT 0,
  last_shown_at TIMESTAMP WITH TIME ZONE,
  position CHARACTER VARYING DEFAULT 'center',
  width CHARACTER VARYING DEFAULT '600px',
  background_color CHARACTER VARYING DEFAULT '#ffffff',
  text_color CHARACTER VARYING DEFAULT '#000000',
  button_color CHARACTER VARYING DEFAULT '#ff0000',
  total_views INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_advertisements_active ON public.advertisements(is_active);
CREATE INDEX IF NOT EXISTS idx_advertisements_dates ON public.advertisements(start_date, end_date);
