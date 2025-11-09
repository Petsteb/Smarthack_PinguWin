-- Fix the role constraint to allow 'user' and 'manager' roles
-- Run this in Supabase SQL Editor NOW

-- Drop the existing constraint (actual name from database)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS check_constraint_role;

-- Also try dropping the other possible names
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint with all allowed roles
ALTER TABLE public.users
ADD CONSTRAINT users_role_check CHECK (role = ANY (ARRAY['employee'::text, 'admin'::text, 'user'::text, 'manager'::text]));

-- Verify the constraint was created
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
AND conname = 'users_role_check';
