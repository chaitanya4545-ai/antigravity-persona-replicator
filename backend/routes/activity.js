import express from 'express';
import { query } from '../db/connection.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Get recent activity
router.get('/', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            `SELECT action_type, details, created_at 
       FROM actions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 20`,
            [req.userId]
        );

        const activity = result.rows.map((row) => ({
            action: formatAction(row.action_type, row.details),
            timestamp: formatTimeAgo(row.created_at),
        }));

        res.json(activity);
    } catch (error) {
        console.error('Get activity error:', error);
        res.status(500).json({ error: 'Failed to get activity' });
    }
});

// Get metrics
router.get('/metrics', authMiddleware, async (req, res) => {
    try {
        const result = await query('SELECT * FROM metrics WHERE user_id = $1', [req.userId]);

        if (result.rows.length === 0) {
            return res.json({
                tokensUsed: 0,
                messagesSent: 0,
                approvalRate: 0,
                confidence: 0,
                responseTime: 0,
            });
        }

        const metrics = result.rows[0];
        res.json({
            tokensUsed: metrics.tokens_used || 0,
            messagesSent: metrics.messages_sent || 0,
            approvalRate: parseFloat(metrics.approval_rate) || 0,
            confidence: parseFloat(metrics.avg_confidence) || 0,
            responseTime: parseFloat(metrics.avg_response_time) || 0,
        });
    } catch (error) {
        console.error('Get metrics error:', error);
        res.status(500).json({ error: 'Failed to get metrics' });
    }
});

function formatAction(actionType, details) {
    const actions = {
        samples_uploaded: `Uploaded ${details.count || 0} samples`,
        persona_retrained: 'Persona retrained successfully',
        reply_generated: `Generated ${details.candidateCount || 3} reply candidates`,
        message_sent: 'Message sent successfully',
    };

    return actions[actionType] || actionType;
}

function formatTimeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
}

export default router;
