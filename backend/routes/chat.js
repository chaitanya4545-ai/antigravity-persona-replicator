import express from 'express';
import { query } from '../db/connection.js';
import authMiddleware from '../middleware/auth.js';
import { generateTwinReply } from '../services/personaEngine.js';
import { validate } from '../middleware/validate.js';
import { chatMessageSchema } from '../validators/chat.js';
import { chatLimiter } from '../middleware/rateLimiter.js';
import logger from '../utils/logger.js';
import { convertToCSV } from '../utils/csv.js';

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
    res.json({
        status: 'Chat routes working!',
        timestamp: new Date().toISOString(),
        geminiConfigured: !!process.env.GEMINI_API_KEY
    });
});

// AI Assistant mode - Google Gemini (FREE)
router.post('/assistant', authMiddleware, chatLimiter, validate(chatMessageSchema), async (req, res) => {
    try {
        const { message } = req.body;

        // Check if API key is configured
        if (!process.env.GEMINI_API_KEY) {
            logger.error('GEMINI_API_KEY not configured', { userId: req.userId });
            return res.status(200).json({
                error: 'AI Assistant is not configured. Please contact administrator.',
                message: 'Sorry, the AI Assistant is currently unavailable. Please try again later or contact support.'
            });
        }

        // Save user message to database
        await query(
            'INSERT INTO chat_messages (user_id, role, content) VALUES ($1, $2, $3)',
            [req.userId, 'user', message]
        );

        // Use Google Gemini with updated model name
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const result = await model.generateContent(message);
        const response = await result.response;
        const responseText = response.text();

        // Save assistant response to database
        await query(
            'INSERT INTO chat_messages (user_id, role, content) VALUES ($1, $2, $3)',
            [req.userId, 'assistant', responseText]
        );

        logger.info('AI Assistant response generated', { userId: req.userId, messageLength: message.length });
        res.json({
            message: responseText,
            confidence: null,
            rationale: 'Powered by Google Gemini',
        });
    } catch (error) {
        logger.error('Gemini error', { error: error.message, stack: error.stack, userId: req.userId });

        // Return 200 with error message to avoid triggering logout
        res.status(200).json({
            error: error.message,
            message: 'Sorry, I encountered an error. Please try again or contact support if the issue persists.'
        });
    }
});

// AI Twin mode
router.post('/message', authMiddleware, chatLimiter, validate(chatMessageSchema), async (req, res) => {
    try {
        const { message } = req.body;

        const personaResult = await query(
            'SELECT * FROM personas WHERE user_id = $1 AND is_active = true LIMIT 1',
            [req.userId]
        );

        if (personaResult.rows.length === 0) {
            return res.status(200).json({
                error: 'No active persona found',
                message: 'Please create and activate a persona first by uploading training samples in the "Train Persona" section.'
            });
        }

        const persona = personaResult.rows[0];

        // Save user message to database
        await query(
            'INSERT INTO chat_messages (user_id, role, content) VALUES ($1, $2, $3)',
            [req.userId, 'user', message]
        );

        const mockMessage = { from_email: 'user', subject: 'Chat', body: message };

        const candidates = await generateTwinReply(persona, mockMessage, {
            mode: 'hybrid',
            toneShift: 0,
            riskTolerance: 50,
        });

        const response = candidates.find(c => c.label === 'Normal') || candidates[0];

        // Save twin response to database
        await query(
            'INSERT INTO chat_messages (user_id, role, content) VALUES ($1, $2, $3)',
            [req.userId, 'twin', response.text]
        );

        logger.info('AI Twin response generated', { userId: req.userId, personaId: persona.id });
        res.json({
            message: response.text,
            confidence: response.confidence,
            rationale: response.rationale,
        });
    } catch (error) {
        logger.error('Twin error', { error: error.message, stack: error.stack, userId: req.userId });

        // Return 200 with error message to avoid triggering logout
        res.status(200).json({
            error: error.message,
            message: 'Sorry, I encountered an error generating a response. Please try again.'
        });
    }
});

// Search chat messages
router.get('/search', authMiddleware, async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length === 0) {
            return res.json({ results: [], count: 0 });
        }

        const searchQuery = `
            SELECT id, role, content, created_at,
                   ts_rank(to_tsvector('english', content), plainto_tsquery('english', $1)) as rank
            FROM chat_messages
            WHERE user_id = $2
            AND to_tsvector('english', content) @@ plainto_tsquery('english', $1)
            ORDER BY rank DESC, created_at DESC
            LIMIT 50
        `;

        const result = await query(searchQuery, [q, req.userId]);

        logger.info('Search completed', { userId: req.userId, query: q, resultsCount: result.rows.length });
        res.json({
            results: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        logger.error('Search error', { error: error.message, userId: req.userId });
        res.status(500).json({ error: 'Search failed' });
    }
});

// Export chat history as JSON
router.get('/export/json', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM chat_messages WHERE user_id = $1 ORDER BY created_at ASC',
            [req.userId]
        );

        const exportData = {
            exported_at: new Date().toISOString(),
            message_count: result.rows.length,
            messages: result.rows
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=chat-history-${new Date().toISOString().split('T')[0]}.json`);

        logger.info('Chat exported as JSON', { userId: req.userId, messageCount: result.rows.length });
        res.json(exportData);
    } catch (error) {
        logger.error('Export JSON error', { error: error.message, userId: req.userId });
        res.status(500).json({ error: 'Export failed' });
    }
});

// Export chat history as CSV
router.get('/export/csv', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            'SELECT role, content, created_at FROM chat_messages WHERE user_id = $1 ORDER BY created_at ASC',
            [req.userId]
        );

        const csv = convertToCSV(result.rows);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=chat-history-${new Date().toISOString().split('T')[0]}.csv`);

        logger.info('Chat exported as CSV', { userId: req.userId, messageCount: result.rows.length });
        res.send(csv);
    } catch (error) {
        logger.error('Export CSV error', { error: error.message, userId: req.userId });
        res.status(500).json({ error: 'Export failed' });
    }
});

// Get history
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM chat_messages WHERE user_id = $1 ORDER BY created_at ASC',
            [req.userId]
        );

        logger.info('Chat history retrieved', { userId: req.userId, messageCount: result.rows.length });
        res.json(result.rows);
    } catch (error) {
        logger.error('Get history error', { error: error.message, userId: req.userId });
        res.status(500).json({ error: 'Failed to get history' });
    }
});

// Clear history
router.delete('/clear', authMiddleware, async (req, res) => {
    try {
        await query('DELETE FROM chat_messages WHERE user_id = $1', [req.userId]);

        logger.info('Chat history cleared', { userId: req.userId });
        res.json({ message: 'Chat history cleared successfully' });
    } catch (error) {
        logger.error('Clear history error', { error: error.message, userId: req.userId });
        res.status(500).json({ error: 'Failed to clear history' });
    }
});

export default router;
