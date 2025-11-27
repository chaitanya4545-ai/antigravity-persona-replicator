import { query } from '../db/connection.js';

export async function generateTwinReply(persona, message, options = {}) {
    const { mode = 'hybrid', toneShift = 0, riskTolerance = 50 } = options;

    try {
        // Get persona samples for context
        const samplesResult = await query(
            'SELECT content FROM persona_samples WHERE persona_id = $1 ORDER BY created_at DESC LIMIT 5',
            [persona.id]
        );

        const samples = samplesResult.rows.map((r) => r.content).join('\n\n');
        const metadata = persona.metadata || {};

        // Build system prompt
        const systemPrompt = buildSystemPrompt(metadata, mode, toneShift, riskTolerance);

        // Build user prompt
        const userPrompt = `
Inbound email:
From: ${message.from_email}
Subject: ${message.subject}
Body: ${message.body}

Context samples from your writing style:
${samples.substring(0, 1000)}

Generate 3 candidate replies (Conservative, Normal, Bold) that match your persona.
`;

        // Use Google Gemini if API key is available
        if (process.env.GEMINI_API_KEY) {
            const { GoogleGenerativeAI } = await import('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

            const result = await model.generateContent(systemPrompt + '\n\n' + userPrompt);
            const response = await result.response;
            const responseText = response.text();

            // Parse response into candidates
            const candidates = parseCandidates(responseText);
            return candidates;
        } else {
            // Return fallback candidates if no API key
            return generateFallbackCandidates(message);
        }
    } catch (error) {
        console.error('Generate twin reply error:', error);

        // Return fallback candidates
        return generateFallbackCandidates(message);
    }
}

function buildSystemPrompt(metadata, mode, toneShift, riskTolerance) {
    const tone = metadata.tone || 'professional';
    const riskLevel = metadata.riskLevel || 'Medium';
    const commonPhrases = metadata.commonPhrases || [];

    return `You are a persona replicator engine. Your task is to generate email replies that match the user's writing style.

Persona Profile:
- Tone: ${tone}
- Risk Level: ${riskLevel}
- Common Phrases: ${commonPhrases.join(', ')}

Mode: ${mode}
- ghost: Fully automated, minimal human touch
- auto: Automated with safety checks
- hybrid: Human-in-the-loop, suggestions only

Tone Shift: ${toneShift} (-10 to +10, where negative is more formal, positive is more casual)
Risk Tolerance: ${riskTolerance}% (higher = bolder, more direct)

Generate 3 candidate replies:
1. Conservative: Safest, most polite version
2. Normal: Balanced, default persona behavior
3. Bold: Strongest tone allowed by risk tolerance

For each candidate, provide:
- The reply text
- Confidence score (0-100)
- Brief rationale (1 sentence)

Format your response as:
CONSERVATIVE:
[reply text]
Confidence: [score]
Rationale: [reason]

NORMAL:
[reply text]
Confidence: [score]
Rationale: [reason]

BOLD:
[reply text]
Confidence: [score]
Rationale: [reason]
`;
}

function parseCandidates(response) {
    const candidates = [];
    const sections = response.split(/(?:CONSERVATIVE:|NORMAL:|BOLD:)/i).filter(s => s.trim());

    const labels = ['Conservative', 'Normal', 'Bold'];

    sections.forEach((section, index) => {
        if (index >= 3) return;

        const lines = section.trim().split('\n');
        const textLines = [];
        let confidence = 75;
        let rationale = 'Generated based on persona profile';

        for (const line of lines) {
            if (line.toLowerCase().startsWith('confidence:')) {
                confidence = parseInt(line.split(':')[1]) || 75;
            } else if (line.toLowerCase().startsWith('rationale:')) {
                rationale = line.split(':').slice(1).join(':').trim();
            } else if (line.trim() && !line.toLowerCase().includes('confidence') && !line.toLowerCase().includes('rationale')) {
                textLines.push(line);
            }
        }

        const text = textLines.join('\n').trim();

        candidates.push({
            label: labels[index] || 'Normal',
            text,
            length_chars: text.length,
            confidence,
            rationale,
            persona_rules_applied: ['tone_matching', 'phrase_usage', 'risk_assessment'],
        });
    });

    // Ensure we always have 3 candidates
    while (candidates.length < 3) {
        candidates.push({
            label: labels[candidates.length],
            text: 'Thank you for your email. I will review this and get back to you soon.',
            length_chars: 67,
            confidence: 50,
            rationale: 'Fallback response',
            persona_rules_applied: [],
        });
    }

    return candidates;
}

function generateFallbackCandidates(message) {
    return [
        {
            label: 'Conservative',
            text: `Thank you for reaching out regarding "${message.subject}". I appreciate you taking the time to contact me. I will review your message carefully and respond as soon as possible.`,
            length_chars: 165,
            confidence: 60,
            rationale: 'Safe, polite fallback response',
            persona_rules_applied: ['politeness'],
        },
        {
            label: 'Normal',
            text: `Thanks for your email about "${message.subject}". I'll take a look and get back to you soon.`,
            length_chars: 93,
            confidence: 65,
            rationale: 'Balanced fallback response',
            persona_rules_applied: ['brevity'],
        },
        {
            label: 'Bold',
            text: `Got your message about "${message.subject}". I'll review and respond shortly.`,
            length_chars: 78,
            confidence: 70,
            rationale: 'Direct fallback response',
            persona_rules_applied: ['directness'],
        },
    ];
}
