import express from 'express';
import multer from 'multer';
import { query } from '../db/connection.js';
import authMiddleware from '../middleware/auth.js';
import { ingestSamples, retrainPersona } from '../services/ingestWorker.js';
import logger from '../utils/logger.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Get user's persona
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM personas WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
            [req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Persona not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get persona error:', error);
        res.status(500).json({ error: 'Failed to get persona' });
    }
});

// Upload samples for ingestion
router.post('/ingest', authMiddleware, upload.array('files', 10), async (req, res) => {
    try {
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        // Get user's persona
        const personaResult = await query(
            'SELECT id FROM personas WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
            [req.userId]
        );

        if (personaResult.rows.length === 0) {
            return res.status(404).json({ error: 'Persona not found' });
        }

        const personaId = personaResult.rows[0].id;

        // Process files
        const samples = await ingestSamples(personaId, files);

        // Log action
        await query(
            'INSERT INTO actions (user_id, action_type, details) VALUES ($1, $2, $3)',
            [req.userId, 'samples_uploaded', { count: files.length }]
        );

        res.json({ samples, message: 'Files uploaded successfully' });
    } catch (error) {
        console.error('Ingest error:', error);
        res.status(500).json({ error: 'Failed to ingest samples' });
    }
});

// Retrain persona
router.post('/retrain', authMiddleware, async (req, res) => {
    try {
        // Get user's persona
        const personaResult = await query(
            'SELECT * FROM personas WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
            [req.userId]
        );

        if (personaResult.rows.length === 0) {
            return res.status(404).json({ error: 'Persona not found' });
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
        console.error('Retrain error:', error);
        res.status(500).json({ error: 'Failed to retrain persona' });
    }
});

// Export persona data
router.get('/export', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM personas WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
            [req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No persona found' });
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
