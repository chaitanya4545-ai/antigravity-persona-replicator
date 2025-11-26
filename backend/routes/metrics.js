import express from 'express';
import { query } from '../db/connection.js';
import authMiddleware from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Get overview metrics
router.get('/overview', authMiddleware, async (req, res) => {
    try {
        const [messages, personas, threads] = await Promise.all([
            query('SELECT COUNT(*) as count FROM chat_messages WHERE user_id = $1', [req.userId]),
            query('SELECT COUNT(*) as count FROM personas WHERE user_id = $1', [req.userId]),
            query('SELECT COUNT(*) as count FROM threads WHERE user_id = $1', [req.userId])
        ]);

        res.json({
            total_messages: parseInt(messages.rows[0].count),
            total_personas: parseInt(personas.rows[0].count),
            total_threads: parseInt(threads.rows[0].count)
        });
    } catch (error) {
        logger.error('Get overview metrics error', { error: error.message, userId: req.userId });
        res.status(500).json({ error: 'Failed to get metrics' });
    }
});

// Get messages over time
router.get('/messages-over-time', authMiddleware, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;

        const result = await query(
            `SELECT DATE(created_at) as date, COUNT(*) as count
             FROM chat_messages
             WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '${days} days'
             GROUP BY DATE(created_at)
             ORDER BY date ASC`,
            [req.userId]
        );

        res.json(result.rows);
    } catch (error) {
        logger.error('Get messages over time error', { error: error.message, userId: req.userId });
        res.status(500).json({ error: 'Failed to get data' });
    }
});

// Get persona usage
router.get('/persona-usage', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            `SELECT p.name, p.color, COUNT(cm.id) as message_count
             FROM personas p
             LEFT JOIN chat_messages cm ON cm.user_id = p.user_id
             WHERE p.user_id = $1
             GROUP BY p.id, p.name, p.color
             ORDER BY message_count DESC`,
            [req.userId]
        );

        res.json(result.rows);
    } catch (error) {
        logger.error('Get persona usage error', { error: error.message, userId: req.userId });
        res.status(500).json({ error: 'Failed to get data' });
    }
});

// Get thread activity
router.get('/thread-activity', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            `SELECT t.title, t.message_count, t.last_message_at
             FROM threads t
             WHERE t.user_id = $1
             ORDER BY t.message_count DESC
             LIMIT 10`,
            [req.userId]
        );

        res.json(result.rows);
    } catch (error) {
        logger.error('Get thread activity error', { error: error.message, userId: req.userId });
        res.status(500).json({ error: 'Failed to get data' });
    }
});

export default router;
