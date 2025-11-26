import express from 'express';
import { query } from '../db/connection.js';
import authMiddleware from '../middleware/auth.js';
import { generateTwinReply } from '../services/personaEngine.js';

const router = express.Router();

// Test endpoint to verify chat routes are working
router.get('/test', (req, res) => {
    res.json({
        status: 'Chat routes are working!',
        timestamp: new Date().toISOString(),

        if(!message || !message.trim()) {
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

    // Try to save to database, but don't fail if table doesn't exist
    try {
        await query(
            'INSERT INTO chat_messages (user_id, persona_id, role, content) VALUES ($1, $2, $3, $4)',
            [req.userId, persona.id, 'user', message]
        );
        await query(
            'INSERT INTO chat_messages (user_id, persona_id, role, content, confidence) VALUES ($1, $2, $3, $4, $5)',
            [req.userId, persona.id, 'assistant', response.text, response.confidence]
        );
    } catch (dbError) {
        console.log('Database save skipped (table may not exist yet):', dbError.message);
    }

    res.json({
        message: response.text,
        confidence: response.confidence,
        rationale: response.rationale,
    });
} catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to generate response: ' + error.message });
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
        // Return empty array if table doesn't exist yet
        res.json([]);
    }
});

// Clear chat history
router.delete('/clear', authMiddleware, async (req, res) => {
    try {
        await query('DELETE FROM chat_messages WHERE user_id = $1', [req.userId]);
        res.json({ message: 'Chat history cleared' });
    } catch (error) {
        console.error('Clear history error:', error);
        res.json({ message: 'History cleared (or table does not exist yet)' });
    }
});

export default router;
