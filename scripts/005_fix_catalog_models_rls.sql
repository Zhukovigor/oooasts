-- Fix RLS policies for catalog_models to allow admin operations
-- This script adds policies to allow INSERT, UPDATE, and DELETE operations

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Public can view active models" ON catalog_models;

-- Recreate the read policy
CREATE POLICY "Public can view active models" ON catalog_models
  FOR SELECT
  USING (is_active = true);

-- Add policy to allow all inserts (for admin panel)
CREATE POLICY "Allow all inserts" ON catalog_models
  FOR INSERT
  WITH CHECK (true);

-- Add policy to allow all updates (for admin panel)
CREATE POLICY "Allow all updates" ON catalog_models
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Add policy to allow all deletes (for admin panel)
CREATE POLICY "Allow all deletes" ON catalog_models
  FOR DELETE
  USING (true);

-- Verify RLS is enabled
ALTER TABLE catalog_models ENABLE ROW LEVEL SECURITY;
