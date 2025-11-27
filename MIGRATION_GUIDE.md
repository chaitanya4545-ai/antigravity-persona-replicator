# Database Migration Guide

## 🎯 Quick Start

Run all pending migrations automatically:

```bash
cd backend
npm run migrate
```

That's it! The script will:
- ✅ Track which migrations have been run
- ✅ Skip already-executed migrations
- ✅ Run only new migrations
- ✅ Show detailed progress
- ✅ Handle errors gracefully

---

## 📋 What Gets Migrated

### **Migration 1: schema_v2.sql** (Chat History)
- Adds `chat_messages` table
- Stores user/assistant/twin conversations
- Required for: Chat interface, search, export

### **Migration 2: schema_v3_multi_persona.sql** (Multi-Persona)
- Adds `is_active`, `description`, `color` to personas table
- Enables multiple personas per user
- Required for: Persona management, persona switching

### **Migration 3: schema_v4_threading.sql** (Conversation Threading)
- Adds `threads` table
- Links messages to threads
- Required for: Thread management, organized conversations

---

## 🔍 Migration Status

Check which migrations have been run:

```sql
SELECT * FROM schema_migrations ORDER BY executed_at;
```

---

## ⚠️ Troubleshooting

### **Error: "relation already exists"**
- **Cause**: Migration already partially run
- **Fix**: The script handles this automatically with `IF NOT EXISTS`

### **Error: "permission denied"**
- **Cause**: Database user lacks permissions
- **Fix**: Grant permissions or use admin user

### **Error: "database connection failed"**
- **Cause**: Wrong DATABASE_URL or database offline
- **Fix**: Check `.env` file and database status

---

## 🚀 Manual Migration (If Needed)

If automatic migration fails, run manually:

### **Option 1: Using psql**
```bash
psql $DATABASE_URL -f backend/db/migrations/schema_v2.sql
psql $DATABASE_URL -f backend/db/migrations/schema_v3_multi_persona.sql
psql $DATABASE_URL -f backend/db/migrations/schema_v4_threading.sql
```

### **Option 2: Using Render Shell**
1. Go to Render Dashboard
2. Select your PostgreSQL database
3. Click "Connect" → "External Connection"
4. Copy connection string
5. Use psql or any SQL client to run migrations

### **Option 3: Copy-Paste SQL**
1. Open each migration file
2. Copy the SQL
3. Paste into Render's SQL Shell or your SQL client
4. Execute

---

## ✅ Verify Migrations

After running migrations, verify:

```sql
-- Check tables exist
\dt

-- Should see:
-- users
-- personas
-- chat_messages
-- threads
-- schema_migrations

-- Check chat_messages structure
\d chat_messages

-- Check threads structure
\d threads

-- Check personas has new columns
\d personas
```

---

## 🔄 Rollback (If Needed)

If you need to rollback:

```sql
-- Rollback threading
DROP TABLE IF EXISTS threads CASCADE;
ALTER TABLE chat_messages DROP COLUMN IF EXISTS thread_id;
DELETE FROM schema_migrations WHERE filename = 'schema_v4_threading.sql';

-- Rollback multi-persona
ALTER TABLE personas DROP COLUMN IF EXISTS is_active;
ALTER TABLE personas DROP COLUMN IF EXISTS description;
ALTER TABLE personas DROP COLUMN IF EXISTS color;
DELETE FROM schema_migrations WHERE filename = 'schema_v3_multi_persona.sql';

-- Rollback chat history
DROP TABLE IF EXISTS chat_messages CASCADE;
DELETE FROM schema_migrations WHERE filename = 'schema_v2.sql';
```

---

## 📊 Expected Results

After successful migration:

```
🚀 Starting database migrations...

✅ Migrations tracking table ready

📄 Running migration: schema_v2.sql
✅ Successfully executed schema_v2.sql

📄 Running migration: schema_v3_multi_persona.sql
✅ Successfully executed schema_v3_multi_persona.sql

📄 Running migration: schema_v4_threading.sql
✅ Successfully executed schema_v4_threading.sql

🎉 All migrations completed successfully!

📊 Migration Summary:
────────────────────────────────────────────────────────────
  schema_v2.sql                      1/27/2025, 11:30:00 AM
  schema_v3_multi_persona.sql        1/27/2025, 11:30:01 AM
  schema_v4_threading.sql            1/27/2025, 11:30:02 AM
────────────────────────────────────────────────────────────

✅ Total migrations: 3
```

---

## 🎯 Next Steps After Migration

1. **Restart your backend** (if running locally)
2. **Redeploy on Render** (if in production)
3. **Test features**:
   - Chat with AI Assistant
   - Create personas
   - Create threads
   - Search messages
   - Export data

---

## 💡 Tips

- **Always backup** before running migrations in production
- **Test locally first** before running on production database
- **Check logs** if migrations fail
- **Run during low-traffic** periods for production

---

## 🆘 Need Help?

If migrations fail:
1. Check the error message
2. Verify DATABASE_URL is correct
3. Ensure database is accessible
4. Check database user permissions
5. Review migration SQL files for syntax errors

Still stuck? Check the logs or contact support!
