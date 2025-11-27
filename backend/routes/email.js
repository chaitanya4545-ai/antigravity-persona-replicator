import express from 'express';
import { google } from 'googleapis';
import { query } from '../db/connection.js';
import authMiddleware from '../middleware/auth.js';
import logger from '../utils/logger.js';
import {
    getOAuth2Client,
    getAuthenticatedClient,
    parseGmailMessage,
    createEmailReply,
    shouldFilterEmail
} from '../services/gmailService.js';
import { generateTwinReply } from '../services/personaEngine.js';

const router = express.Router();

// Get OAuth URL for user to authorize Gmail
router.get('/auth/url', authMiddleware, (req, res) => {
    try {
        const oauth2Client = getOAuth2Client();

        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/gmail.send',
                'https://www.googleapis.com/auth/gmail.modify'
            ],
            state: req.userId,
            prompt: 'consent'  // Force consent screen to get refresh token
        });

        logger.info('Generated OAuth URL', { userId: req.userId });
        res.json({ authUrl });
    } catch (error) {
        logger.error('Error generating OAuth URL', { error: error.message });
        res.status(500).json({ error: 'Failed to generate authorization URL' });
    }
});

// Handle OAuth callback
router.post('/auth/callback', authMiddleware, async (req, res) => {
    try {
        const { code } = req.body;

        const oauth2Client = getOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Get user's email address
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        const profile = await gmail.users.getProfile({ userId: 'me' });

        // Store in database
        await query(`
            INSERT INTO email_accounts (user_id, email_address, access_token, refresh_token, token_expires_at)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id, email_address) 
            DO UPDATE SET 
                access_token = $3, 
                refresh_token = $4, 
                token_expires_at = $5, 
                is_connected = true,
                updated_at = NOW()
        `, [
            req.userId,
            profile.data.emailAddress,
            tokens.access_token,
            tokens.refresh_token,
            new Date(tokens.expiry_date)
        ]);

        // Create default email settings
        await query(`
            INSERT INTO email_settings (user_id)
            VALUES ($1)
            ON CONFLICT (user_id) DO NOTHING
        `, [req.userId]);

        logger.info('Gmail account connected', { userId: req.userId, email: profile.data.emailAddress });
        res.json({ success: true, email: profile.data.emailAddress });
    } catch (error) {
        logger.error('OAuth callback error', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to connect Gmail account' });
    }
});

// Get connected email account
router.get('/account', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            'SELECT id, email_address, is_connected, created_at FROM email_accounts WHERE user_id = $1',
            [req.userId]
        );

        res.json({ account: result.rows[0] || null });
    } catch (error) {
        logger.error('Error fetching email account', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch email account' });
    }
});

// Disconnect email account
router.post('/disconnect', authMiddleware, async (req, res) => {
    try {
        await query(
            'UPDATE email_accounts SET is_connected = false WHERE user_id = $1',
            [req.userId]
        );

        logger.info('Gmail account disconnected', { userId: req.userId });
        res.json({ success: true });
    } catch (error) {
        logger.error('Error disconnecting email', { error: error.message });
        res.status(500).json({ error: 'Failed to disconnect email account' });
    }
});

// Fetch inbox (unread emails)
router.get('/inbox', authMiddleware, async (req, res) => {
    try {
        const { oauth2Client, account } = await getAuthenticatedClient(req.userId);
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        // Fetch unread messages
        const response = await gmail.users.messages.list({
            userId: 'me',
            q: 'is:unread',
            maxResults: 20
        });

        if (!response.data.messages) {
            return res.json({ messages: [] });
        }

        // Fetch full message details
        const messages = await Promise.all(
            response.data.messages.map(async (msg) => {
                const detail = await gmail.users.messages.get({
                    userId: 'me',
                    id: msg.id,
                    format: 'full'
                });
                return parseGmailMessage(detail.data);
            })
        );

        // Store in database
        for (const message of messages) {
            await query(`
                INSERT INTO email_messages (account_id, message_id, thread_id, from_email, from_name, subject, body, snippet, received_at, is_read)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (account_id, message_id) DO NOTHING
            `, [
                account.id,
                message.message_id,
                message.thread_id,
                message.from_email,
                message.from_name,
                message.subject,
                message.body,
                message.snippet,
                message.received_at,
                message.is_read
            ]);
        }

        logger.info('Fetched inbox', { userId: req.userId, count: messages.length });
        res.json({ messages });
    } catch (error) {
        logger.error('Error fetching inbox', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to fetch inbox' });
    }
});

// Generate AI reply for email
router.post('/generate-reply', authMiddleware, async (req, res) => {
    try {
        const { messageId } = req.body;

        // Get email from database
        const emailResult = await query(`
            SELECT em.* FROM email_messages em
            JOIN email_accounts ea ON em.account_id = ea.id
            WHERE em.message_id = $1 AND ea.user_id = $2
        `, [messageId, req.userId]);

        if (emailResult.rows.length === 0) {
            return res.status(404).json({ error: 'Email not found' });
        }

        const email = emailResult.rows[0];

        // Get active persona
        const personaResult = await query(
            'SELECT * FROM personas WHERE user_id = $1 AND is_active = true LIMIT 1',
            [req.userId]
        );

        if (personaResult.rows.length === 0) {
            return res.status(404).json({ error: 'No active persona found. Please activate a persona first.' });
        }

        const persona = personaResult.rows[0];

        // Generate reply using AI Twin
        const mockMessage = {
            from_email: email.from_email,
            subject: email.subject,
            body: email.body
        };

        const candidates = await generateTwinReply(persona, mockMessage, {
            mode: 'hybrid',
            toneShift: 0,
            riskTolerance: 50
        });

        const reply = candidates.find(c => c.label === 'Normal') || candidates[0];

        // Store reply draft
        const replyResult = await query(`
            INSERT INTO email_replies (message_id, user_id, persona_id, reply_text, confidence, mode)
            VALUES ($1, $2, $3, $4, $5, 'manual')
            RETURNING id
        `, [email.id, req.userId, persona.id, reply.text, reply.confidence]);

        logger.info('Generated email reply', { userId: req.userId, messageId });
        res.json({
            reply: {
                id: replyResult.rows[0].id,
                text: reply.text,
                confidence: reply.confidence,
                rationale: reply.rationale
            }
        });
    } catch (error) {
        logger.error('Error generating reply', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to generate reply' });
    }
});

// Send email reply
router.post('/send-reply', authMiddleware, async (req, res) => {
    try {
        const { replyId } = req.body;

        // Get reply and original email
        const result = await query(`
            SELECT er.*, em.*, ea.email_address
            FROM email_replies er
            JOIN email_messages em ON er.message_id = em.id
            JOIN email_accounts ea ON em.account_id = ea.id
            WHERE er.id = $1 AND er.user_id = $2
        `, [replyId, req.userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Reply not found' });
        }

        const data = result.rows[0];
        const { oauth2Client } = await getAuthenticatedClient(req.userId);
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        // Create email in RFC 2822 format
        const rawEmail = createEmailReply(data, data.reply_text, data.email_address);

        // Send email
        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: rawEmail,
                threadId: data.thread_id
            }
        });

        // Mark as sent
        await query('UPDATE email_replies SET sent = true, sent_at = NOW() WHERE id = $1', [replyId]);
        await query('UPDATE email_messages SET is_processed = true WHERE id = $1', [data.message_id]);

        logger.info('Email reply sent', { userId: req.userId, replyId });
        res.json({ success: true });
    } catch (error) {
        logger.error('Error sending reply', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to send reply' });
    }
});

// Get email settings
router.get('/settings', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM email_settings WHERE user_id = $1',
            [req.userId]
        );

        res.json({ settings: result.rows[0] || null });
    } catch (error) {
        logger.error('Error fetching email settings', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Update email settings
router.put('/settings', authMiddleware, async (req, res) => {
    try {
        const { auto_reply_enabled, mode, filters, schedule } = req.body;

        await query(`
            INSERT INTO email_settings (user_id, auto_reply_enabled, mode, filters, schedule)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                auto_reply_enabled = $2,
                mode = $3,
                filters = $4,
                schedule = $5,
                updated_at = NOW()
        `, [req.userId, auto_reply_enabled, mode, JSON.stringify(filters), JSON.stringify(schedule)]);

        logger.info('Email settings updated', { userId: req.userId });
        res.json({ success: true });
    } catch (error) {
        logger.error('Error updating email settings', { error: error.message });
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

export default router;
