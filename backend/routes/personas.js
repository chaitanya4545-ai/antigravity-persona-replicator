import express from 'express';
import multer from 'multer';
import { query } from '../db/connection.js';
import authMiddleware from '../middleware/auth.js';
import { ingestSamples, retrainPersona } from '../services/ingestWorker.js';
import logger from '../utils/logger.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Get active persona (current behavior for backward compatibility)
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM personas WHERE user_id = $1 AND is_active = true LIMIT 1',
            [req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No active persona found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Get active persona error', { error: error.message, userId: req.userId });
        res.status(500).json({ error: 'Failed to get persona' });
    }
});

// Get all user's personas
router.get('/all', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM personas WHERE user_id = $1 ORDER BY created_at DESC',
            [req.userId]
        );

        logger.info('All personas fetched', { userId: req.userId, count: result.rows.length });
        res.json(result.rows);
    } catch (error) {
        logger.error('Get all personas error', { error: error.message, userId: req.userId });
        res.status(500).json({ error: 'Failed to get personas' });
    }
});

// Create new persona
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { name, description, color } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Persona name is required' });
        }

        const result = await query(
            `INSERT INTO personas (user_id, name, description, color, is_active, metadata)
             VALUES ($1, $2, $3, $4, false, $5)
             RETURNING *`,
            [req.userId, name.trim(), description || '', color || '#4f46e5', JSON.stringify({})]
        );

        logger.info('Persona created', { userId: req.userId, personaId: result.rows[0].id, name });
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Create persona error', { error: error.message, userId: req.userId });
        res.status(500).json({ error: 'Failed to create persona' });
    }
});

// Set active persona
router.post('/:id/activate', authMiddleware, async (req, res) => {
    try {
        // Deactivate all personas for user
        await query(
            'UPDATE personas SET is_active = false WHERE user_id = $1',
            [req.userId]
        );

        // Activate selected persona
        const result = await query(
            'UPDATE personas SET is_active = true WHERE id = $1 AND user_id = $2 RETURNING *',
            [req.params.id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Persona not found' });
        }

        logger.info('Persona activated', { userId: req.userId, personaId: req.params.id });
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Activate persona error', { error: error.message, userId: req.userId });
        res.status(500).json({ error: 'Failed to activate persona' });
    }
});

// Update persona
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { name, description, color } = req.body;

        const result = await query(
            `UPDATE personas 
             SET name = COALESCE($1, name),
                 description = COALESCE($2, description),
                 color = COALESCE($3, color),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4 AND user_id = $5
             RETURNING *`,
            [name, description, color, req.params.id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Persona not found' });
        }

        logger.info('Persona updated', { userId: req.userId, personaId: req.params.id });
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Update persona error', { error: error.message, userId: req.userId });
        res.status(500).json({ error: 'Failed to update persona' });
    }
});

// Delete persona
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        // Check if this is the only persona
        const countResult = await query(
            'SELECT COUNT(*) as count FROM personas WHERE user_id = $1',
            [req.userId]
        );

        if (parseInt(countResult.rows[0].count) <= 1) {
            return res.status(400).json({ error: 'Cannot delete your only persona' });
        }

        // Check if deleting active persona
        const personaResult = await query(
            'SELECT is_active FROM personas WHERE id = $1 AND user_id = $2',
            [req.params.id, req.userId]
        );

        if (personaResult.rows.length === 0) {
            return res.status(404).json({ error: 'Persona not found' });
        }

        const wasActive = personaResult.rows[0].is_active;

        // Delete persona
        await query(
            'DELETE FROM personas WHERE id = $1 AND user_id = $2',
            [req.params.id, req.userId]
        );

        // If deleted persona was active, activate another one
        if (wasActive) {
            await query(
                `UPDATE personas 
                 SET is_active = true 
                 WHERE user_id = $1 
                 AND id = (SELECT id FROM personas WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1)`,
                [req.userId]
            );
        }

        logger.info('Persona deleted', { userId: req.userId, personaId: req.params.id });
        res.json({ message: 'Persona deleted successfully' });
    } catch (error) {
        logger.error('Delete persona error', { error: error.message, userId: req.userId });
        res.status(500).json({ error: 'Failed to delete persona' });
    }
});

// Upload samples for ingestion (uses active persona)
router.post('/ingest', authMiddleware, upload.array('files', 10), async (req, res) => {
    try {
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        // Get user's active persona
        const personaResult = await query(
            'SELECT id FROM personas WHERE user_id = $1 AND is_active = true LIMIT 1',
            [req.userId]
        );

        if (personaResult.rows.length === 0) {
            return res.status(404).json({ error: 'No active persona found' });
        }

        const personaId = personaResult.rows[0].id;

        // Process files
        const samples = await ingestSamples(personaId, files);

        // Log action
        await query(
            'INSERT INTO actions (user_id, action_type, details) VALUES ($1, $2, $3)',
            [req.userId, 'samples_uploaded', { count: files.length, personaId }]
        );

        res.json({ samples, message: 'Files uploaded successfully' });
    } catch (error) {
        logger.error('Ingest error', { error: error.message, userId: req.userId });
        res.status(500).json({ error: 'Failed to ingest samples' });
    }
});

// Retrain persona (uses active persona)
router.post('/retrain', authMiddleware, async (req, res) => {
    try {
        // Get user's active persona
        const personaResult = await query(
            'SELECT * FROM personas WHERE user_id = $1 AND is_active = true LIMIT 1',
            [req.userId]
        );

        if (personaResult.rows.length === 0) {
            return res.status(404).json({ error: 'No active persona found' });
        }

        const persona = personaResult.rows[0];

        // Retrain
        const updatedPersona = await retrainPersona(persona.id);

        // Log action
        await query(
            'INSERT INTO actions (user_id, action_type, details) VALUES ($1, $2, $3)',
            [req.userId, 'persona_retrained', { personaId: persona.id }]
        );

        res.json({ persona: updatedPersona, message: 'Persona retrained successfully' });
    } catch (error) {
        logger.error('Retrain error', { error: error.message, userId: req.userId });
        res.status(500).json({ error: 'Failed to retrain persona' });
    }
});

// Export persona data (uses active persona)
router.get('/export', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM personas WHERE user_id = $1 AND is_active = true LIMIT 1',
            [req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No active persona found' });
        }

        const exportData = {
            exported_at: new Date().toISOString(),
            persona: result.rows[0]
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=persona-data-${new Date().toISOString().split('T')[0]}.json`);

        logger.info('Persona exported', { userId: req.userId, personaId: result.rows[0].id });
        res.json(exportData);
    } catch (error) {
        logger.error('Export persona error', { error: error.message, userId: req.userId });
        res.status(500).json({ error: 'Export failed' });
    }
});

export default router;
