-- ========================================
-- UPDATED RLS POLICIES - READ-ONLY FOR TRANSACTIONS AND ERRORS
-- Execute this SQL in Supabase SQL Editor
-- ========================================

-- ========================================
-- RLS POLICIES FOR TRANSACTIONS TABLE (READ-ONLY)
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

-- Create READ-ONLY RLS policy for transactions (SELECT only)
CREATE POLICY "Allow read access to transactions" ON transactions
    FOR SELECT
    USING (true);

-- ========================================
-- RLS POLICIES FOR ERRORS TABLE (READ-ONLY)
-- ========================================

-- Enable RLS on error_logs table
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to error_logs" ON error_logs;
DROP POLICY IF EXISTS "Allow insert for all users" ON error_logs;
DROP POLICY IF EXISTS "Allow update for all users" ON error_logs;
DROP POLICY IF EXISTS "Allow delete for all users" ON error_logs;
DROP POLICY IF EXISTS "Allow all operations" ON error_logs;
DROP POLICY IF EXISTS "errors_select_policy" ON error_logs;
DROP POLICY IF EXISTS "errors_insert_policy" ON error_logs;
DROP POLICY IF EXISTS "errors_update_policy" ON error_logs;
DROP POLICY IF EXISTS "errors_delete_policy" ON error_logs;

-- Create READ-ONLY RLS policy for error_logs (SELECT only)
CREATE POLICY "Allow read access to error_logs" ON error_logs
    FOR SELECT
    USING (true);

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Verify transactions table has only SELECT policy
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    cmd as operation,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'transactions'
ORDER BY policyname;

-- Verify error_logs table has only SELECT policy
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    cmd as operation,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'error_logs'
ORDER BY policyname;

-- Show RLS status for these tables
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('transactions', 'error_logs')
ORDER BY tablename;
