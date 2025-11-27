-- Conversation Threading Migration (UUID-compatible)
-- Adds threads table and links chat messages to threads

-- Create threads table
CREATE TABLE IF NOT EXISTS threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ,
    message_count INTEGER DEFAULT 0
);

-- Create indexes for threads
CREATE INDEX IF NOT EXISTS idx_threads_user ON threads(user_id);
CREATE INDEX IF NOT EXISTS idx_threads_persona ON threads(persona_id);
CREATE INDEX IF NOT EXISTS idx_threads_updated ON threads(updated_at DESC);

-- Add thread_id to chat_messages if not exists
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES threads(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_messages_thread ON chat_messages(thread_id);

-- Create default "General" thread for existing users
INSERT INTO threads (user_id, persona_id, title, description)
SELECT DISTINCT u.id, p.id, 'General', 'Default conversation thread'
FROM users u
LEFT JOIN personas p ON p.user_id = u.id AND p.is_active = true
WHERE NOT EXISTS (SELECT 1 FROM threads WHERE user_id = u.id)
ON CONFLICT DO NOTHING;

-- Assign existing messages to default thread
UPDATE chat_messages cm
SET thread_id = (
    SELECT t.id 
    FROM threads t 
    WHERE t.user_id = cm.user_id 
    AND t.title = 'General'
    LIMIT 1
)
WHERE thread_id IS NULL;

-- Update thread statistics
UPDATE threads t
SET message_count = (
    SELECT COUNT(*) 
    FROM chat_messages cm 
    WHERE cm.thread_id = t.id
),
last_message_at = (
    SELECT MAX(created_at) 
    FROM chat_messages cm 
    WHERE cm.thread_id = t.id
);

-- Add comments
COMMENT ON TABLE threads IS 'Conversation threads for organizing chat messages';
COMMENT ON COLUMN threads.last_message_at IS 'Timestamp of the last message in this thread';
COMMENT ON COLUMN threads.message_count IS 'Total number of messages in this thread';
