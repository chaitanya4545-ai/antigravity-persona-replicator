import express from 'express';
import { query } from '../db/connection.js';
import authMiddleware from '../middleware/auth.js';
import { generateTwinReply } from '../services/personaEngine.js';

const router = express.Router();

// Send message to AI twin
router.post('/message', authMiddleware, async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get user's persona
        const personaResult = await query(
            'SELECT * FROM personas WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
            [req.userId]
        );

        if (personaResult.rows.length === 0) {
            return res.status(404).json({ error: 'Persona not found. Please upload training samples first.' });
        }

        const persona = personaResult.rows[0];

        // Save user message
        await query(
            'INSERT INTO chat_messages (user_id, persona_id, role, content) VALUES ($1, $2, $3, $4)',
            [req.userId, persona.id, 'user', message]
        );

        // Generate AI response using persona engine
        const mockMessage = {
            from_email: 'user',
            subject: 'Chat',
            body: message,
        };

        const candidates = await generateTwinReply(persona, mockMessage, {
            mode: 'hybrid',
            toneShift: 0,
            riskTolerance: 50,
        });

        // Use the "Normal" candidate as the response
        const response = candidates.find(c => c.label === 'Normal') || candidates[0];

        // Save AI response
        await query(
            'INSERT INTO chat_messages (user_id, persona_id, role, content, confidence) VALUES ($1, $2, $3, $4, $5)',
            [req.userId, persona.id, 'assistant', response.text, response.confidence]
        );

        res.json({
            message: response.text,
            confidence: response.confidence,
            rationale: response.rationale,
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

// Get chat history
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;

        const result = await query(
            `SELECT role, content, confidence, created_at 
       FROM chat_messages 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
            [req.userId, limit]
        );

        // Reverse to get chronological order
        const messages = result.rows.reverse().map(row => ({
            role: row.role,
            content: row.content,
            confidence: row.confidence ? parseFloat(row.confidence) : null,
            timestamp: row.created_at,
        }));

        res.json(messages);
    } catch (error) {
        console.error('Get history error:', error);
        import express from 'express';
        import { query } from '../db/connection.js';
        import authMiddleware from '../middleware/auth.js';
        import { generateTwinReply } from '../services/personaEngine.js';

        const router = express.Router();

        // Send message to AI twin
        router.post('/message', authMiddleware, async (req, res) => {
            try {
                const { message } = req.body;

                if (!message || !message.trim()) {
                    return res.status(400).json({ error: 'Message is required' });
                }

                // Get user's persona
                const personaResult = await query(
                    'SELECT * FROM personas WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
                    [req.userId]
                );

                if (personaResult.rows.length === 0) {
                    return res.status(404).json({ error: 'Persona not found. Please upload training samples first.' });
                }

                const persona = personaResult.rows[0];

                // Save user message
                await query(
                    'INSERT INTO chat_messages (user_id, persona_id, role, content) VALUES ($1, $2, $3, $4)',
                    [req.userId, persona.id, 'user', message]
                );

                // Generate AI response using persona engine
                const mockMessage = {
                    from_email: 'user',
                    subject: 'Chat',
                    body: message,
                };

                const candidates = await generateTwinReply(persona, mockMessage, {
                    mode: 'hybrid',
                    toneShift: 0,
                    riskTolerance: 50,
                });

                // Use the "Normal" candidate as the response
                const response = candidates.find(c => c.label === 'Normal') || candidates[0];

                // Save AI response
                await query(
                    'INSERT INTO chat_messages (user_id, persona_id, role, content, confidence) VALUES ($1, $2, $3, $4, $5)',
                    [req.userId, persona.id, 'assistant', response.text, response.confidence]
                );

                res.json({
                    message: response.text,
                    confidence: response.confidence,
                    rationale: response.rationale,
                });
            } catch (error) {
                console.error('Chat error:', error);
                res.status(500).json({ error: 'Failed to generate response' });
            }
        });

        // Get chat history
        router.get('/history', authMiddleware, async (req, res) => {
            try {
                const limit = parseInt(req.query.limit) || 50;

                const result = await query(
                    `SELECT role, content, confidence, created_at 
       FROM chat_messages 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
                    [req.userId, limit]
                );

                // Reverse to get chronological order
                const messages = result.rows.reverse().map(row => ({
                    role: row.role,
                    content: row.content,
                    confidence: row.confidence ? parseFloat(row.confidence) : null,
                    timestamp: row.created_at,
                }));

                res.json(messages);
            } catch (error) {
                console.error('Get history error:', error);
                res.status(500).json({ error: 'Failed to get chat history' });
            }
        });

        // Clear chat history
        router.delete('/clear', authMiddleware, async (req, res) => {
            try {
                await query('DELETE FROM chat_messages WHERE user_id = $1', [req.userId]);
                res.json({ message: 'Chat history cleared' });
            } catch (error) {
                console.error('Clear history error:', error);
                res.status(500).json({ error: 'Failed to clear history' });
            }
        });

        // AI Assistant mode (ChatGPT-like, no persona)
        router.post('/assistant', authMiddleware, async (req, res) => {
            try {
                const { message } = req.body;

                if (!message || !message.trim()) {
                    return res.status(400).json({ error: 'Message is required' });
                }

                // Use OpenAI directly without persona context
                const OpenAI = (await import('openai')).default;
                const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

                const completion = await openai.chat.completions.create({
                    model: 'gpt-4',
                    messages: [
                        { role: 'system', content: 'You are a helpful AI assistant. Provide clear, accurate, and helpful responses.' },
                        { role: 'user', content: message },
                    ],
                    temperature: 0.7,
                    max_tokens: 500,
                });

                const responseText = completion.choices[0].message.content;

                // Save conversation
                await query(
                    'INSERT INTO chat_messages (user_id, role, content) VALUES ($1, $2, $3)',
                    [req.userId, 'user', message]
                );

                await query(
                    'INSERT INTO chat_messages (user_id, role, content) VALUES ($1, $2, $3)',
                    [req.userId, 'assistant', responseText]
                );

                res.json({
                    message: responseText,
                    confidence: null,
                    rationale: 'General AI assistant response',
                });
            } catch (error) {
                console.error('Assistant chat error:', error);
                res.status(500).json({ error: 'Failed to generate response' });
            }
        });

        export default router;
