-- ============================================
-- COMPLETE MIGRATION SCRIPT
-- Run this entire file in your PostgreSQL database
-- ============================================

-- Create migrations tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MIGRATION 1: schema_v2.sql (Chat History)
-- ============================================

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    thread_id INTEGER,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'twin')),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);

-- Record migration
INSERT INTO schema_migrations (filename) VALUES ('schema_v2.sql')
ON CONFLICT (filename) DO NOTHING;

-- ============================================
-- MIGRATION 2: schema_v3_multi_persona.sql
-- ============================================

-- Add new columns to personas table
ALTER TABLE personas ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE personas ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#4f46e5';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_personas_active ON personas(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_personas_user ON personas(user_id);

-- Set first persona as active for each user
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

-- Record migration
INSERT INTO schema_migrations (filename) VALUES ('schema_v3_multi_persona.sql')
ON CONFLICT (filename) DO NOTHING;

-- ============================================
-- MIGRATION 3: schema_v4_threading.sql
-- ============================================

-- Create threads table
CREATE TABLE IF NOT EXISTS threads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    persona_id INTEGER REFERENCES personas(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP,
    message_count INTEGER DEFAULT 0
);

-- Create indexes for threads
CREATE INDEX IF NOT EXISTS idx_threads_user ON threads(user_id);
CREATE INDEX IF NOT EXISTS idx_threads_persona ON threads(persona_id);
CREATE INDEX IF NOT EXISTS idx_threads_updated ON threads(updated_at DESC);

-- Add thread_id to chat_messages if not exists
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS thread_id INTEGER REFERENCES threads(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_messages_thread ON chat_messages(thread_id);

-- Create default "General" thread for existing users
INSERT INTO threads (user_id, persona_id, title, description)
SELECT DISTINCT u.id, p.id, 'General', 'Default conversation thread'
FROM users u
LEFT JOIN personas p ON p.user_id = u.id AND p.is_active = true
WHERE NOT EXISTS (SELECT 1 FROM threads WHERE user_id = u.id);

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

-- Record migration
INSERT INTO schema_migrations (filename) VALUES ('schema_v4_threading.sql')
ON CONFLICT (filename) DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Show all migrations
SELECT filename, executed_at FROM schema_migrations ORDER BY executed_at;

-- Show table counts
SELECT 
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'personas', COUNT(*) FROM personas
UNION ALL
SELECT 'chat_messages', COUNT(*) FROM chat_messages
UNION ALL
SELECT 'threads', COUNT(*) FROM threads;

-- Success message
SELECT '✅ All migrations completed successfully!' as status;
