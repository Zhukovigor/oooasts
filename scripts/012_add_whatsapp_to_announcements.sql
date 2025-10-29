-- Add WhatsApp field to announcements table
ALTER TABLE public.announcements
ADD COLUMN IF NOT EXISTS contact_whatsapp VARCHAR(50);

-- Update sample data with WhatsApp numbers
UPDATE public.announcements
SET contact_whatsapp = '79991234567'
WHERE contact_name = 'Иван Петров';

UPDATE public.announcements
SET contact_whatsapp = '79992345678'
WHERE contact_name = 'Сергей Иванов';
