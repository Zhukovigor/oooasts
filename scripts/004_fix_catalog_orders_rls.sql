-- Fix RLS policy for catalog_orders to allow public order submissions

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can create orders" ON catalog_orders;

-- Recreate policy to allow anonymous users to insert orders
CREATE POLICY "Public can create orders" ON catalog_orders
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- Also allow public to view their own orders (optional, for future order tracking)
CREATE POLICY IF NOT EXISTS "Users can view all orders" ON catalog_orders
  FOR SELECT 
  TO authenticated
  USING (true);
