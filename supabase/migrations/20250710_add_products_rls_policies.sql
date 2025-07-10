-- Enable RLS on products table if not already enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (optional, to avoid conflicts)
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON products;
DROP POLICY IF EXISTS "Allow read access to products" ON products;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON products;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON products;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON products;

-- Create comprehensive RLS policies that allow all operations
-- Policy for SELECT operations (read access)
CREATE POLICY "Allow read access to products" ON products
    FOR SELECT
    USING (true);

-- Policy for INSERT operations (create new products)
CREATE POLICY "Allow insert for authenticated users" ON products
    FOR INSERT
    WITH CHECK (true);

-- Policy for UPDATE operations (modify existing products)
CREATE POLICY "Allow update for authenticated users" ON products
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Policy for DELETE operations (remove products)
CREATE POLICY "Allow delete for authenticated users" ON products
    FOR DELETE
    USING (true);

-- Alternative: Single policy for all operations (simpler approach)
-- CREATE POLICY "Allow all operations for authenticated users" ON products
--     FOR ALL
--     USING (true)
--     WITH CHECK (true);

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'products';

-- Show current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'products';
