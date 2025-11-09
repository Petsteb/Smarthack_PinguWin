-- Migration script to update users table to match new schema
-- Run this in your Supabase SQL editor

-- First, backup the existing table
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;

-- Drop the existing users table
DROP TABLE IF EXISTS users CASCADE;

-- Create the new users table with updated schema
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    full_name VARCHAR(255),
    hashed_password TEXT NOT NULL,
    supabase_user_id UUID UNIQUE,
    avatar_url VARCHAR(500),
    bio TEXT,
    phone VARCHAR(20),
    department VARCHAR(100),
    job_title VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    total_points INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    tokens INTEGER NOT NULL DEFAULT 0,
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_supabase_user_id ON users(supabase_user_id);
CREATE INDEX idx_users_role ON users(role);

-- If you want to migrate old data (optional):
-- INSERT INTO users (email, full_name, hashed_password, role, created_at)
-- SELECT email, name, hashed_password,
--        CASE WHEN role = 'admin' THEN 'admin' ELSE 'user' END,
--        CURRENT_TIMESTAMP
-- FROM users_backup;

-- After migration, you can drop the backup table:
-- DROP TABLE users_backup;
