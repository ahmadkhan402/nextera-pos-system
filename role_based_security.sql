-- ================================================================
-- NEXTERA POS SYSTEM - ROLE-BASED SECURITY SETUP
-- Run this script AFTER the main initialization and user setup
-- ================================================================

-- IMPORTANT: Only run this after:
-- 1. Main database setup is complete
-- 2. Admin users have been created in the users table
-- 3. Initial data population is done

-- This script implements proper role-based access control without recursion issues

-- ================================================================
-- STEP 1: Drop existing simple policies
-- ================================================================

-- App Settings - Replace with role-based
DROP POLICY IF EXISTS "App settings are editable by authenticated users" ON app_settings;

-- Categories - Replace with role-based  
DROP POLICY IF EXISTS "Categories are editable by authenticated users" ON categories;

-- Suppliers - Replace with role-based
DROP POLICY IF EXISTS "Suppliers are editable by authenticated users" ON suppliers;

-- Products - Replace with role-based
DROP POLICY IF EXISTS "Products are editable by authenticated users" ON products;

-- Product Batches - Replace with role-based
DROP POLICY IF EXISTS "Product batches are editable by authenticated users" ON product_batches;

-- Discounts - Replace with role-based
DROP POLICY IF EXISTS "Discounts are editable by authenticated users" ON discounts;

-- ================================================================
-- STEP 2: Create role-based policies using a safe approach
-- ================================================================

-- Create a stored function to check user roles safely
CREATE OR REPLACE FUNCTION auth.check_user_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    user_active BOOLEAN;
BEGIN
    -- Get user role and active status
    SELECT role, active INTO user_role, user_active
    FROM public.users 
    WHERE id = auth.uid()
    LIMIT 1;
    
    -- Return false if user not found or inactive
    IF user_role IS NULL OR user_active IS FALSE THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user role is in required roles
    RETURN user_role = ANY(required_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- STEP 3: Apply role-based policies
-- ================================================================

-- App Settings - Admin/Manager only
CREATE POLICY "App settings are editable by admins and managers" ON app_settings
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        auth.check_user_role(ARRAY['admin', 'manager'])
    );

-- Categories - Admin/Manager only
CREATE POLICY "Categories are editable by admins and managers" ON categories
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        auth.check_user_role(ARRAY['admin', 'manager'])
    );

-- Suppliers - Admin/Manager only
CREATE POLICY "Suppliers are editable by admins and managers" ON suppliers
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        auth.check_user_role(ARRAY['admin', 'manager'])
    );

-- Products - Admin/Manager only
CREATE POLICY "Products are editable by admins and managers" ON products
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        auth.check_user_role(ARRAY['admin', 'manager'])
    );

-- Product Batches - Admin/Manager only
CREATE POLICY "Product batches are editable by admins and managers" ON product_batches
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        auth.check_user_role(ARRAY['admin', 'manager'])
    );

-- Discounts - Admin/Manager only
CREATE POLICY "Discounts are editable by admins and managers" ON discounts
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        auth.check_user_role(ARRAY['admin', 'manager'])
    );

-- Users table - Add admin-only policies for user management
CREATE POLICY "Admins can insert new users" ON users
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        auth.check_user_role(ARRAY['admin'])
    );

CREATE POLICY "Admins can delete users" ON users
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        auth.check_user_role(ARRAY['admin'])
    );

-- ================================================================
-- STEP 4: Verification
-- ================================================================

-- Verify the function works
SELECT 'Role check function test' as test_name,
       auth.check_user_role(ARRAY['admin', 'manager']) as result,
       'Should return true for admin/manager users' as expected;

-- List all policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=== ROLE-BASED SECURITY SETUP COMPLETE ===';
    RAISE NOTICE 'Role-based access control has been implemented';
    RAISE NOTICE 'Admin users can now manage all resources';
    RAISE NOTICE 'Manager users can manage products, inventory, and settings';
    RAISE NOTICE 'Cashier users can perform sales operations only';
    RAISE NOTICE 'All users can view data and manage their own profiles';
END $$;
