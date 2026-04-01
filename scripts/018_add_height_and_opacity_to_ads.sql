-- Add height and background_opacity fields to advertisements table
ALTER TABLE IF EXISTS public.advertisements
ADD COLUMN IF NOT EXISTS height CHARACTER VARYING DEFAULT '400px';

ALTER TABLE IF EXISTS public.advertisements
ADD COLUMN IF NOT EXISTS background_opacity NUMERIC DEFAULT 0.8;
