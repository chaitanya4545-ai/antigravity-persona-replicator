import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Migration files in order
const migrations = [
    'schema_v2.sql',
    'schema_v3_multi_persona.sql',
    'schema_v4_threading.sql'
];

async function runMigrations() {
    console.log('🚀 Starting database migrations...\n');

    try {
        // Create migrations tracking table if it doesn't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Migrations tracking table ready\n');

        // Get already executed migrations
        const { rows: executedMigrations } = await pool.query(
            'SELECT filename FROM schema_migrations'
        );
        const executedFiles = new Set(executedMigrations.map(m => m.filename));

        // Run each migration
        for (const migrationFile of migrations) {
            if (executedFiles.has(migrationFile)) {
                console.log(`⏭️  Skipping ${migrationFile} (already executed)`);
                continue;
            }

            console.log(`📄 Running migration: ${migrationFile}`);

            try {
                // Read migration file
                const migrationPath = path.join(__dirname, migrationFile);

                if (!fs.existsSync(migrationPath)) {
                    console.log(`⚠️  Warning: ${migrationFile} not found, skipping...`);
                    continue;
                }

                const sql = fs.readFileSync(migrationPath, 'utf8');

                // Execute migration
                await pool.query(sql);

                // Record migration
                await pool.query(
                    'INSERT INTO schema_migrations (filename) VALUES ($1)',
                    [migrationFile]
                );

                console.log(`✅ Successfully executed ${migrationFile}\n`);
            } catch (error) {
                console.error(`❌ Error executing ${migrationFile}:`);
                console.error(error.message);
                console.error('\nMigration failed. Please fix the error and try again.\n');
                process.exit(1);
            }
        }

        console.log('🎉 All migrations completed successfully!\n');

        // Show summary
        const { rows: allMigrations } = await pool.query(
            'SELECT filename, executed_at FROM schema_migrations ORDER BY executed_at ASC'
        );

        console.log('📊 Migration Summary:');
        console.log('─'.repeat(60));
        allMigrations.forEach(m => {
            console.log(`  ${m.filename.padEnd(35)} ${new Date(m.executed_at).toLocaleString()}`);
        });
        console.log('─'.repeat(60));
        console.log(`\n✅ Total migrations: ${allMigrations.length}\n`);

    } catch (error) {
        console.error('❌ Migration error:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run migrations
runMigrations();
