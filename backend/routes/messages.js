import express from 'express';
import { query } from '../db/connection.js';
import authMiddleware from '../middleware/auth.js';
import { generateTwinReply } from '../services/personaEngine.js';

const router = express.Router();

// Get inbox messages
router.get('/inbox', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            `SELECT * FROM messages 
       WHERE user_id = $1 AND direction = 'inbound' 
       ORDER BY received_at DESC, created_at DESC 
       LIMIT 50`,
            [req.userId]
        );

        // Format for frontend
        const messages = result.rows.map((msg) => ({
            id: msg.id,
            from: msg.from_email,
            subject: msg.subject,
            snippet: msg.snippet || msg.body?.substring(0, 100),
            received: formatTimeAgo(msg.received_at || msg.created_at),
            body: msg.body,
        }));

        res.json(messages);
    } catch (error) {
        console.error('Get inbox error:', error);
        res.status(500).json({ error: 'Failed to get inbox' });
    }
});

// Generate twin reply
router.post('/:messageId/generate', authMiddleware, async (req, res) => {
    try {
        const { messageId } = req.params;
        const { mode, toneShift, riskTolerance } = req.body;

        // Get message
        const msgResult = await query('SELECT * FROM messages WHERE id = $1 AND user_id = $2', [
            messageId,
            req.userId,
        ]);

        if (msgResult.rows.length === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }

        const message = msgResult.rows[0];

        // Get persona
        const personaResult = await query(
            'SELECT * FROM personas WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
            [req.userId]
        );

        if (personaResult.rows.length === 0) {
            return res.status(404).json({ error: 'Persona not found' });
        }

        const persona = personaResult.rows[0];

        // Generate reply
        const candidates = await generateTwinReply(persona, message, {
            mode: mode || 'hybrid',
            toneShift: toneShift || 0,
            riskTolerance: riskTolerance || 50,
        });

        // Log action
        await query(
            'INSERT INTO actions (user_id, message_id, action_type, details) VALUES ($1, $2, $3, $4)',
            [req.userId, messageId, 'reply_generated', { mode, candidateCount: candidates.length }]
        );

        res.json({ candidates });
    } catch (error) {
        console.error('Generate reply error:', error);
        res.status(500).json({ error: 'Failed to generate reply' });
    }
});

// Send message
router.post('/:messageId/send', authMiddleware, async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;

        // Get original message
        const msgResult = await query('SELECT * FROM messages WHERE id = $1 AND user_id = $2', [
            messageId,
            req.userId,
        ]);

        if (msgResult.rows.length === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }

        const originalMessage = msgResult.rows[0];

        // Create outbound message
        const result = await query(
            `INSERT INTO messages (user_id, direction, from_email, to_email, subject, body, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
            [
                req.userId,
                'outbound',
                originalMessage.to_email,
                originalMessage.from_email,
                `Re: ${originalMessage.subject}`,
                content,
                'sent',
            ]
        );

        // Update metrics
        await query(
            'UPDATE metrics SET messages_sent = messages_sent + 1 WHERE user_id = $1',
            [req.userId]
        );

        // Log action
        await query(
            'INSERT INTO actions (user_id, message_id, action_type, details) VALUES ($1, $2, $3, $4)',
            [req.userId, result.rows[0].id, 'message_sent', { originalMessageId: messageId }]
        );

        res.json({ message: result.rows[0], success: true });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

function formatTimeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(date).toLocaleDateString();
}

export default router;
