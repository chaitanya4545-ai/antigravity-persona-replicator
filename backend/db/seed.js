import { query } from '../db/connection.js';

// Seed sample messages for testing
async function seedDatabase() {
    try {
        console.log('Seeding database with sample data...');

        // Create a test user (password: test123)
        const userResult = await query(
            `INSERT INTO users (email, password_hash, name) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
            ['demo@antigravity.ai', '$2a$10$rQZ5YqJ5YqJ5YqJ5YqJ5YeJ5YqJ5YqJ5YqJ5YqJ5YqJ5YqJ5YqJ5Y', 'Demo User']
        );

        if (userResult.rows.length === 0) {
            console.log('Demo user already exists');
            const existing = await query('SELECT id FROM users WHERE email = $1', ['demo@antigravity.ai']);
            var userId = existing.rows[0].id;
        } else {
            var userId = userResult.rows[0].id;
            console.log('Created demo user');
        }

        // Create persona
        const personaResult = await query(
            `INSERT INTO personas (user_id, name, metadata) 
       VALUES ($1, $2, $3) 
       ON CONFLICT DO NOTHING
       RETURNING id`,
            [
                userId,
                'Demo Twin',
                JSON.stringify({
                    tone: 'Direct, professional',
                    riskLevel: 'Medium',
                    commonPhrases: ['Let\'s sync up', 'Moving forward', 'Quick question'],
                    sampleCount: 3,
                }),
            ]
        );

        const personaId = personaResult.rows.length > 0 ? personaResult.rows[0].id : null;

        if (personaId) {
            console.log('Created demo persona');

            // Add sample messages
            const messages = [
                {
                    from: 'investor@vc.com',
                    subject: 'Follow up on pitch deck',
                    body: 'Hi, I reviewed your pitch deck from last week. The numbers look promising, but I have a few questions about your go-to-market strategy. Can we schedule a call this week?',
                    snippet: 'I reviewed your pitch deck from last week...',
                },
                {
                    from: 'partner@agency.com',
                    subject: 'Collaboration proposal',
                    body: 'We specialize in growth marketing and have worked with several SaaS companies in your space. I think we could drive significant conversions for you. Would you be open to a brief intro call?',
                    snippet: 'We specialize in growth marketing...',
                },
                {
                    from: 'candidate@talent.com',
                    subject: 'Application for Senior Engineer role',
                    body: 'I came across your job posting for a Senior Engineer position. I have 8 years of experience in full-stack development and am particularly excited about your AI-powered product. Attached is my resume.',
                    snippet: 'I came across your job posting...',
                },
            ];

            for (const msg of messages) {
                await query(
                    `INSERT INTO messages (user_id, persona_id, direction, from_email, subject, body, snippet, received_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '${Math.floor(Math.random() * 48)} hours')`,
                    [userId, personaId, 'inbound', msg.from, msg.subject, msg.body, msg.snippet]
                );
            }

            console.log('Created sample messages');
        }

        // Create metrics
        await query(
            `INSERT INTO metrics (user_id, tokens_used, messages_sent, approval_rate, avg_confidence) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT DO NOTHING`,
            [userId, 12400, 15, 72.5, 82.3]
        );

        console.log('Created metrics');

        // Add sample activity
        const actions = [
            { type: 'persona_retrained', details: { personaId } },
            { type: 'reply_generated', details: { candidateCount: 3 } },
            { type: 'message_sent', details: {} },
        ];

        for (const action of actions) {
            await query(
                `INSERT INTO actions (user_id, action_type, details, created_at) 
         VALUES ($1, $2, $3, NOW() - INTERVAL '${Math.floor(Math.random() * 24)} hours')`,
                [userId, action.type, JSON.stringify(action.details)]
            );
        }

        console.log('Created sample activity');
        console.log('\n✅ Database seeded successfully!');
        console.log('\nDemo credentials:');
        console.log('Email: demo@antigravity.ai');
        console.log('Password: test123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}

seedDatabase();
