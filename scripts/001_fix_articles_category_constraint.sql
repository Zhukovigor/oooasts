-- Fix articles table category constraint
-- This script removes the old constraint and adds a new one with proper categories

-- Drop the existing check constraint
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_category_check;

-- Add new check constraint with allowed categories
ALTER TABLE articles ADD CONSTRAINT articles_category_check 
CHECK (category IN (
  'Спецтехника',
  'Новости', 
  'Обзоры',
  'Советы',
  'Лизинг',
  'Техническое обслуживание',
  'Автобетононасосы',
  'Экскаваторы'
));

-- Also fix status constraint if it exists
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_status_check;

-- Add status constraint
ALTER TABLE articles ADD CONSTRAINT articles_status_check 
CHECK (status IN ('published', 'draft', 'archived'));
