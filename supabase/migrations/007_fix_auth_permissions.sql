-- Fix permission denied for auth.users
-- Grant read access to auth.users for authenticated users (needed for RLS policies)

-- This allows RLS policies to check user permissions
GRANT SELECT ON auth.users TO authenticated;

-- Also grant usage on public schema
GRANT USAGE ON SCHEMA public TO authenticated;