import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/connection.js';
import authMiddleware from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, signupSchema } from '../validators/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Signup - with validation and rate limiting
router.post('/signup', authLimiter, validate(signupSchema), async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Check if user exists
        const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const result = await query(
            'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
            [email, passwordHash, name]
        );

        const user = result.rows[0];

        // Create default persona
        await query(
            'INSERT INTO personas (user_id, name) VALUES ($1, $2)',
            [user.id, 'My Twin']
        );

        // Create metrics record
        await query('INSERT INTO metrics (user_id) VALUES ($1)', [user.id]);

        // Generate token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-secret-key', {
            expiresIn: '30d',
        });

        logger.info('User signed up', { userId: user.id, email: user.email });
        res.json({ user, token });
    } catch (error) {
        logger.error('Signup error', { error: error.message });
        res.status(500).json({ error: 'Signup failed' });
    }
});

// Login - with validation and rate limiting
router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Verify password
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-secret-key', {
            expiresIn: '30d',
        });

        logger.info('User logged in', { userId: user.id, email: user.email });
        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
            token,
        });
    } catch (error) {
        logger.error('Login error', { error: error.message });
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const result = await query('SELECT id, email, name, created_at FROM users WHERE id = $1', [
            req.userId,
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Get user error', { error: error.message });
        res.status(500).json({ error: 'Failed to get user' });
    }
});

export default router;
