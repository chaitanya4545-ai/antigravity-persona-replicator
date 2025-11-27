-- Multi-Persona Support Migration (UUID-compatible)
-- Adds columns to personas table for multi-persona functionality

-- Add new columns to personas table
ALTER TABLE personas ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE personas ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#4f46e5';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_personas_active ON personas(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_personas_user ON personas(user_id);

-- Set first persona as active for each user (if none are active)
UPDATE personas p1
SET is_active = true
WHERE id IN (
    SELECT MIN(id)
    FROM personas
    GROUP BY user_id
)
AND NOT EXISTS (
    SELECT 1 FROM personas p2
    WHERE p2.user_id = p1.user_id AND p2.is_active = true
);

-- Add comments
COMMENT ON COLUMN personas.is_active IS 'Indicates if this persona is currently active for the user';
COMMENT ON COLUMN personas.description IS 'User-provided description of the persona';
COMMENT ON COLUMN personas.color IS 'Hex color code for UI display';
