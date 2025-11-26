import express from 'express';
import { query } from '../db/connection.js';
import authMiddleware from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Get all user's threads
router.get('/', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            `SELECT t.*, p.name as persona_name, p.color as persona_color
             FROM threads t
             LEFT JOIN personas p ON t.persona_id = p.id
             WHERE t.user_id = $1
             ORDER BY t.last_message_at DESC NULLS LAST, t.updated_at DESC`,
            [req.userId]
        );

        logger.info('Threads fetched', { userId: req.userId, count: result.rows.length });
        res.json(result.rows);
    } catch (error) {
        logger.error('Get threads error', { error: error.message, userId: req.userId });
        res.status(500).json({ error: 'Failed to get threads' });
    }
});

// Create thread
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, description, persona_id } = req.body;

        if (!title || title.trim().length === 0) {
            return res.status(400).json({ error: 'Thread title is required' });
        }

        const result = await query(
            `INSERT INTO threads (user_id, persona_id, title, description)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [req.userId, persona_id || null, title.trim(), description || '']
        );

        logger.info('Thread created', { userId: req.userId, threadId: result.rows[0].id, title });
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Create thread error', { error: error.message, userId: req.userId });
        res.status(500).json({ error: 'Failed to create thread' });
    }
});

// Update thread
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { title, description } = req.body;

        const result = await query(
            `UPDATE threads 
             SET title = COALESCE($1, title),
                 description = COALESCE($2, description),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3 AND user_id = $4
             RETURNING *`,
            [title, description, req.params.id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Thread not found' });
        }

        logger.info('Thread updated', { userId: req.userId, threadId: req.params.id });
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Update thread error', { error: error.message, userId: req.userId });
        res.status(500).json({ error: 'Failed to update thread' });
    }
});

// Delete thread
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        // Check if this is the only thread
        const countResult = await query(
            'SELECT COUNT(*) as count FROM threads WHERE user_id = $1',
            [req.userId]
        );

        if (parseInt(countResult.rows[0].count) <= 1) {
            return res.status(400).json({ error: 'Cannot delete your only thread' });
        }

        const result = await query(
            'DELETE FROM threads WHERE id = $1 AND user_id = $2 RETURNING *',
            [req.params.id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Thread not found' });
        }

        logger.info('Thread deleted', { userId: req.userId, threadId: req.params.id });
        res.json({ message: 'Thread deleted successfully' });
    } catch (error) {
        logger.error('Delete thread error', { error: error.message, userId: req.userId });
        res.status(500).json({ error: 'Failed to delete thread' });
    }
});

// Get thread messages
router.get('/:id/messages', authMiddleware, async (req, res) => {
    try {
        // Verify thread belongs to user
        const threadCheck = await query(
            'SELECT id FROM threads WHERE id = $1 AND user_id = $2',
            [req.params.id, req.userId]
        );

        if (threadCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Thread not found' });
        }

        const result = await query(
            `SELECT * FROM chat_messages 
             WHERE thread_id = $1
             ORDER BY created_at ASC`,
            [req.params.id]
        );

        logger.info('Thread messages fetched', { userId: req.userId, threadId: req.params.id, count: result.rows.length });
        res.json(result.rows);
    } catch (error) {
        logger.error('Get thread messages error', { error: error.message, userId: req.userId });
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

export default router;
