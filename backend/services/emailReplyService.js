import axios from 'axios';
import { query } from '../db/connection.js';

/**
 * Generate email reply using AI Twin persona
 */
export async function generateAITwinEmailReply(email, userId) {
    // Get active persona
    const personaResult = await query(
        'SELECT * FROM personas WHERE user_id = $1 AND is_active = true LIMIT 1',
        [userId]
    );

    if (personaResult.rows.length === 0) {
        throw new Error('No active persona found. Please create and activate a persona first.');
    }

    const persona = personaResult.rows[0];

    // Get recent chat history for context
    const historyResult = await query(`
        SELECT content, role FROM messages 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 15
    `, [userId]);

    const chatContext = historyResult.rows
        .reverse()
        .map(m => `${m.role === 'user' ? 'You' : persona.name}: ${m.content}`)
        .join('\n');

    // Use Gemini with AI Twin context
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const prompt = `You are ${persona.name}, an AI Twin that writes emails exactly as the user would. You have access to recent conversations to understand the user's style and knowledge.

RECENT CHAT HISTORY (your knowledge base):
${chatContext}

EMAIL TO REPLY TO:
From: ${email.from_name || email.from_email}
Subject: ${email.subject}
Body:
${email.body}

INSTRUCTIONS:
1. Reply AS ${persona.name} (the user), not as an assistant
2. Use the natural, conversational style from the chat history
3. If the email asks about something mentioned in the chat history, use that information
4. Be authentic and personal, like the user would write
5. Keep it concise but complete
6. Include a natural greeting and sign-off
7. If you don't have specific information, be honest but friendly

Write the email reply (just the body text, no subject):`;

    const response = await axios.post(apiUrl, {
        contents: [{
            parts: [{
                text: prompt
            }]
        }]
    });

    const replyText = response.data.candidates[0].content.parts[0].text;

    return {
        text: replyText,
        personaId: persona.id,
        personaName: persona.name
    };
}
