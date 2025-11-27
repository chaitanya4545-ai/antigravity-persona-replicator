import pg from 'pg';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = 'postgresql://antigravity:7Goj3mAxwUbfKzkvv4AAc6WOFMJkehu4@dpg-d4ipehs9c44c73b1p230-a.singapore-postgres.render.com/antigravity';

async function runMigration() {
    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected!');

        console.log('📄 Reading migration file...');
        const sql = fs.readFileSync(join(__dirname, '../run-gmail-migration.sql'), 'utf8');

        console.log('🚀 Running migration...');
        await client.query(sql);

        console.log('✅ Migration completed successfully!');
        console.log('\n📊 Tables created:');
        console.log('  - email_accounts');
        console.log('  - email_messages');
        console.log('  - email_replies');
        console.log('  - email_settings');
        console.log('\n🎉 Gmail integration is ready to use!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
