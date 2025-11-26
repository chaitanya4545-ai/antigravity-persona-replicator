-- Multi-Persona Support Migration
-- Add columns to support multiple personas per user

-- Add new columns to personas table
ALTER TABLE personas ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#4f46e5';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_personas_user_active ON personas(user_id, is_active);

-- Create unique index to ensure only one active persona per user
-- Note: This will be enforced in application logic instead due to PostgreSQL limitations
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_persona ON personas(user_id) WHERE is_active = true;

-- Update existing personas to be active (migration for existing users)
UPDATE personas SET is_active = true WHERE id IN (
    SELECT DISTINCT ON (user_id) id 
    FROM personas 
    ORDER BY user_id, created_at DESC
);

-- Add comment
COMMENT ON COLUMN personas.is_active IS 'Indicates if this is the currently active persona for the user';
COMMENT ON COLUMN personas.description IS 'User-provided description of the persona (e.g., "Professional writing style")';
COMMENT ON COLUMN personas.color IS 'Hex color code for UI display';
