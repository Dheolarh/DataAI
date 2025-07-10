-- ========================================
-- RLS POLICIES FOR ALL TABLES (EXCEPT PRODUCTS)
-- Execute this SQL in Supabase SQL Editor
-- ========================================

-- ========================================
-- RLS POLICIES FOR ADMINS TABLE
-- ========================================

-- Enable RLS on admins table
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to admins" ON admins;
DROP POLICY IF EXISTS "Allow insert for all users" ON admins;
DROP POLICY IF EXISTS "Allow update for all users" ON admins;
DROP POLICY IF EXISTS "Allow delete for all users" ON admins;
DROP POLICY IF EXISTS "Allow all operations" ON admins;
DROP POLICY IF EXISTS "admins_select_policy" ON admins;
DROP POLICY IF EXISTS "admins_insert_policy" ON admins;
DROP POLICY IF EXISTS "admins_update_policy" ON admins;
DROP POLICY IF EXISTS "admins_delete_policy" ON admins;

-- Create comprehensive RLS policies for admins
CREATE POLICY "Allow read access to admins" ON admins
    FOR SELECT
    USING (true);

CREATE POLICY "Allow insert for all users" ON admins
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow update for all users" ON admins
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow delete for all users" ON admins
    FOR DELETE
    USING (true);

-- ========================================
-- RLS POLICIES FOR TRANSACTIONS TABLE
-- ========================================

-- Enable RLS on transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to transactions" ON transactions;
DROP POLICY IF EXISTS "Allow insert for all users" ON transactions;
DROP POLICY IF EXISTS "Allow update for all users" ON transactions;
DROP POLICY IF EXISTS "Allow delete for all users" ON transactions;
DROP POLICY IF EXISTS "Allow all operations" ON transactions;
DROP POLICY IF EXISTS "transactions_select_policy" ON transactions;
DROP POLICY IF EXISTS "transactions_insert_policy" ON transactions;
DROP POLICY IF EXISTS "transactions_update_policy" ON transactions;
DROP POLICY IF EXISTS "transactions_delete_policy" ON transactions;

-- Create comprehensive RLS policies for transactions
CREATE POLICY "Allow read access to transactions" ON transactions
    FOR SELECT
    USING (true);

CREATE POLICY "Allow insert for all users" ON transactions
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow update for all users" ON transactions
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow delete for all users" ON transactions
    FOR DELETE
    USING (true);

-- ========================================
-- RLS POLICIES FOR CATEGORIES TABLE
-- ========================================

-- Enable RLS on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to categories" ON categories;
DROP POLICY IF EXISTS "Allow insert for all users" ON categories;
DROP POLICY IF EXISTS "Allow update for all users" ON categories;
DROP POLICY IF EXISTS "Allow delete for all users" ON categories;
DROP POLICY IF EXISTS "Allow all operations" ON categories;
DROP POLICY IF EXISTS "categories_select_policy" ON categories;
DROP POLICY IF EXISTS "categories_insert_policy" ON categories;
DROP POLICY IF EXISTS "categories_update_policy" ON categories;
DROP POLICY IF EXISTS "categories_delete_policy" ON categories;

-- Create comprehensive RLS policies for categories
CREATE POLICY "Allow read access to categories" ON categories
    FOR SELECT
    USING (true);

CREATE POLICY "Allow insert for all users" ON categories
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow update for all users" ON categories
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow delete for all users" ON categories
    FOR DELETE
    USING (true);

-- ========================================
-- RLS POLICIES FOR COMPANIES TABLE
-- ========================================

-- Enable RLS on companies table
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to companies" ON companies;
DROP POLICY IF EXISTS "Allow insert for all users" ON companies;
DROP POLICY IF EXISTS "Allow update for all users" ON companies;
DROP POLICY IF EXISTS "Allow delete for all users" ON companies;
DROP POLICY IF EXISTS "Allow all operations" ON companies;
DROP POLICY IF EXISTS "companies_select_policy" ON companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON companies;
DROP POLICY IF EXISTS "companies_update_policy" ON companies;
DROP POLICY IF EXISTS "companies_delete_policy" ON companies;

-- Create comprehensive RLS policies for companies
CREATE POLICY "Allow read access to companies" ON companies
    FOR SELECT
    USING (true);

CREATE POLICY "Allow insert for all users" ON companies
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow update for all users" ON companies
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow delete for all users" ON companies
    FOR DELETE
    USING (true);

-- ========================================
-- RLS POLICIES FOR ERRORS TABLE
-- ========================================

-- Enable RLS on errors table
ALTER TABLE errors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to errors" ON errors;
DROP POLICY IF EXISTS "Allow insert for all users" ON errors;
DROP POLICY IF EXISTS "Allow update for all users" ON errors;
DROP POLICY IF EXISTS "Allow delete for all users" ON errors;
DROP POLICY IF EXISTS "Allow all operations" ON errors;
DROP POLICY IF EXISTS "errors_select_policy" ON errors;
DROP POLICY IF EXISTS "errors_insert_policy" ON errors;
DROP POLICY IF EXISTS "errors_update_policy" ON errors;
DROP POLICY IF EXISTS "errors_delete_policy" ON errors;

-- Create comprehensive RLS policies for errors
CREATE POLICY "Allow read access to errors" ON errors
    FOR SELECT
    USING (true);

CREATE POLICY "Allow insert for all users" ON errors
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow update for all users" ON errors
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow delete for all users" ON errors
    FOR DELETE
    USING (true);

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Verify all policies were created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    cmd as operation,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename IN ('admins', 'transactions', 'categories', 'companies', 'errors')
ORDER BY tablename, policyname;

-- Show RLS status for all tables
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('admins', 'transactions', 'categories', 'companies', 'errors', 'products')
ORDER BY tablename;

-- Check if there are any other tables that might need RLS policies
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename NOT IN ('admins', 'transactions', 'categories', 'companies', 'errors', 'products')
ORDER BY tablename;
