-- Create announcements table for text ads
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('demand', 'supply')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    price NUMERIC(12, 2),
    currency VARCHAR(10) DEFAULT 'RUB',
    
    -- Contact information
    contact_name VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    contact_email VARCHAR(100) NOT NULL,
    contact_telegram VARCHAR(100),
    
    -- Location and metadata
    location VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    is_moderated BOOLEAN DEFAULT false,
    moderated_at TIMESTAMP WITH TIME ZONE,
    moderated_by VARCHAR(100),
    rejection_reason TEXT,
    
    -- Analytics
    views_count INTEGER DEFAULT 0,
    contact_clicks INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_announcements_type ON public.announcements(type);
CREATE INDEX IF NOT EXISTS idx_announcements_category ON public.announcements(category);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON public.announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_is_moderated ON public.announcements(is_moderated);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_expires_at ON public.announcements(expires_at);

-- Enable Row Level Security
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active and moderated announcements
CREATE POLICY "Anyone can view active announcements"
    ON public.announcements
    FOR SELECT
    USING (is_active = true AND is_moderated = true AND expires_at > NOW());

-- Policy: Anyone can insert announcements (will need moderation)
CREATE POLICY "Anyone can create announcements"
    ON public.announcements
    FOR INSERT
    WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_announcements_timestamp
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_announcements_updated_at();

-- Insert some sample data
INSERT INTO public.announcements (type, title, description, category, price, currency, contact_name, contact_phone, contact_email, contact_telegram, location, is_moderated)
VALUES
    ('demand', 'Куплю экскаватор Komatsu PC200', 'Ищу экскаватор Komatsu PC200 в хорошем состоянии, желательно с наработкой до 5000 моточасов. Рассмотрю варианты по всей России.', 'Экскаваторы', 5000000, 'RUB', 'Иван Петров', '+7 (999) 123-45-67', 'ivan@example.com', '@ivan_petrov', 'Москва', true),
    ('supply', 'Продам бульдозер Shantui SD16', 'Продается бульдозер Shantui SD16, 2020 года выпуска, наработка 2500 моточасов. Отличное состояние, все документы в порядке.', 'Бульдозеры', 3500000, 'RUB', 'Сергей Иванов', '+7 (999) 234-56-78', 'sergey@example.com', '@sergey_ivanov', 'Санкт-Петербург', true),
    ('demand', 'Требуется автокран 25 тонн', 'Нужен автокран грузоподъемностью 25 тонн для работы на объекте. Аренда на 3 месяца или покупка.', 'Автокраны', NULL, 'RUB', 'Алексей Смирнов', '+7 (999) 345-67-89', 'alexey@example.com', NULL, 'Екатеринбург', true);
