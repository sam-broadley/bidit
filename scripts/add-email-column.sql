-- Add email column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email text UNIQUE;

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Update existing users table structure to match the schema
-- This ensures the table has all necessary columns for the login system 