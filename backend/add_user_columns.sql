-- Migration to add new columns to existing users table
-- Run this in Supabase SQL Editor
-- WARNING: This will modify the users table structure. Backup your data first!

-- STEP 1: Add new columns to users table (all nullable for existing data)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS username text,
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS supabase_user_id uuid,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS job_title text,
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS total_points integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS tokens integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS preferences jsonb NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_login timestamp with time zone,
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- STEP 2: Create indexes BEFORE adding constraints (partial indexes for better performance)
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_supabase_user_id ON public.users(supabase_user_id) WHERE supabase_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON public.users(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- STEP 3: Add unique constraints (only for non-null values to avoid conflicts)
DO $$
BEGIN
    -- Add unique constraint on username if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_username_unique'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_username_unique UNIQUE (username);
    END IF;

    -- Add unique constraint on supabase_user_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_supabase_user_id_unique'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_supabase_user_id_unique UNIQUE (supabase_user_id);
    END IF;
END $$;

-- STEP 4: Sync name to full_name for existing users
UPDATE public.users SET full_name = name WHERE full_name IS NULL;

-- STEP 5: Update role constraint to include new roles
-- This preserves existing 'employee' and 'admin' while adding 'user' and 'manager'
-- Drop all possible constraint names (database may use different naming)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS check_constraint_role;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users
ADD CONSTRAINT users_role_check CHECK (role = ANY (ARRAY['employee'::text, 'admin'::text, 'user'::text, 'manager'::text]));

-- STEP 6: Update default role value for new users
-- Keep existing users unchanged, but new users will default to 'user'
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'user';

-- STEP 7: Optionally migrate existing 'employee' to 'user'
-- IMPORTANT: Uncomment the line below ONLY if you want to change all existing 'employee' roles to 'user'
-- This is a breaking change if you have code that checks for 'employee' role
-- UPDATE public.users SET role = 'user' WHERE role = 'employee';

-- STEP 8: Create trigger for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- STEP 9: Fix foreign key type mismatches in other tables (if they exist)
-- This ensures user_id columns in related tables match the bigint type in users table
DO $$
BEGIN
    -- Only run if managedroom table exists and has integer user_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'managedroom'
        AND column_name = 'user_id'
        AND data_type = 'integer'
    ) THEN
        RAISE NOTICE 'Fixing managedroom.user_id type from integer to bigint';
        ALTER TABLE public.managedroom ALTER COLUMN user_id TYPE bigint;
    END IF;

    -- Only run if managedrooms table exists and has integer user_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'managedrooms'
        AND column_name = 'user_id'
        AND data_type = 'integer'
    ) THEN
        RAISE NOTICE 'Fixing managedrooms.user_id type from integer to bigint';
        ALTER TABLE public.managedrooms ALTER COLUMN user_id TYPE bigint;
    END IF;
END $$;

-- STEP 10: Verification queries (optional - comment out if not needed)
-- Uncomment these to verify the migration was successful

-- Check that all new columns exist
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'users' AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- Verify indexes were created
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'users' AND schemaname = 'public';

-- Check role constraint
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conname = 'users_role_check';

-- Verify trigger exists
-- SELECT trigger_name, event_manipulation, action_statement
-- FROM information_schema.triggers
-- WHERE event_object_table = 'users' AND trigger_schema = 'public';

-- Migration complete!
-- You can now start using the new authentication system.
