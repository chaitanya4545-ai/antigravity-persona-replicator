import express from 'express';
import { query } from '../db/connection.js';
import authMiddleware from '../middleware/auth.js';
import { generateTwinReply } from '../services/personaEngine.js';

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
router.post('/assistant', authMiddleware, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message required' });
        }

        // Use Google Gemini
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const result = await model.generateContent(message);
        const response = await result.response;
        const responseText = response.text();

        res.json({
            message: responseText,
            confidence: null,
            rationale: 'Powered by Google Gemini',
        });
    } catch (error) {
        console.error('Gemini error:', error);
        res.status(500).json({ error: 'Failed: ' + error.message });
    }
});

// AI Twin mode
router.post('/message', authMiddleware, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message required' });
        }

        const personaResult = await query(
            'SELECT * FROM personas WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
            [req.userId]
        );

        if (personaResult.rows.length === 0) {
            return res.status(404).json({ error: 'Persona not found. Upload samples first.' });
        }

        const persona = personaResult.rows[0];
        const mockMessage = { from_email: 'user', subject: 'Chat', body: message };

        const candidates = await generateTwinReply(persona, mockMessage, {
            mode: 'hybrid',
            toneShift: 0,
            riskTolerance: 50,
        });

        const response = candidates.find(c => c.label === 'Normal') || candidates[0];

        res.json({
            message: response.text,
            confidence: response.confidence,
            rationale: response.rationale,
        });
    } catch (error) {
        console.error('Twin error:', error);
        res.status(500).json({ error: 'Failed: ' + error.message });
    }
});

// Get history
router.get('/history', authMiddleware, async (req, res) => {
    res.json([]);  // Return empty for now
});

// Clear history
router.delete('/clear', authMiddleware, async (req, res) => {
    res.json({ message: 'Cleared' });
});

export default router;
