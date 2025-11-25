import fs from 'fs';
import path from 'path';
import { query } from '../db/connection.js';

export async function ingestSamples(personaId, files) {
    const samples = [];

    for (const file of files) {
        try {
            // Read file content
            const content = fs.readFileSync(file.path, 'utf8');

            // Store in database
            const result = await query(
                `INSERT INTO persona_samples (persona_id, source, content, file_name, file_size) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
                [personaId, file.mimetype, content, file.originalname, file.size]
            );

            samples.push({
                id: result.rows[0].id,
                name: file.originalname,
                size: file.size,
            });

            // Clean up uploaded file
            fs.unlinkSync(file.path);
        } catch (error) {
            console.error(`Failed to process file ${file.originalname}:`, error);
        }
    }

    return samples;
}

export async function retrainPersona(personaId) {
    try {
        // Get all samples for this persona
        const samplesResult = await query(
            'SELECT content FROM persona_samples WHERE persona_id = $1',
            [personaId]
        );

        const samples = samplesResult.rows;

        if (samples.length === 0) {
            throw new Error('No samples available for training');
        }

        // Analyze samples to extract persona characteristics
        const metadata = await analyzePersonaCharacteristics(samples);

        // Update persona with new metadata
        const result = await query(
            'UPDATE personas SET metadata = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [JSON.stringify(metadata), personaId]
        );

        return result.rows[0];
    } catch (error) {
        console.error('Retrain error:', error);
        throw error;
    }
}

async function analyzePersonaCharacteristics(samples) {
    // Simple analysis - in production, this would use NLP/ML
    const allText = samples.map((s) => s.content).join(' ');

    // Extract basic characteristics
    const wordCount = allText.split(/\s+/).length;
    const avgSentenceLength = calculateAvgSentenceLength(allText);
    const commonPhrases = extractCommonPhrases(allText);

    // Determine tone based on simple heuristics
    const tone = determineTone(allText);
    const riskLevel = determineRiskLevel(allText);

    return {
        tone,
        riskLevel,
        commonPhrases,
        wordCount,
        avgSentenceLength,
        sampleCount: samples.length,
        lastTrained: new Date().toISOString(),
    };
}

function calculateAvgSentenceLength(text) {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    if (sentences.length === 0) return 0;

    const totalWords = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0);
    return Math.round(totalWords / sentences.length);
}

function extractCommonPhrases(text) {
    // Simple phrase extraction - look for repeated 2-3 word patterns
    const phrases = [
        'Let\'s sync up',
        'Moving forward',
        'Circle back',
        'Touch base',
        'Quick question',
    ];

    return phrases.filter((phrase) =>
        text.toLowerCase().includes(phrase.toLowerCase())
    ).slice(0, 5);
}

function determineTone(text) {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('please') && lowerText.includes('thank')) {
        return 'Polite, formal';
    } else if (lowerText.includes('!') || lowerText.includes('awesome')) {
        return 'Enthusiastic, casual';
    } else {
        return 'Direct, professional';
    }
}

function determineRiskLevel(text) {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('urgent') || lowerText.includes('asap')) {
        return 'High';
    } else if (lowerText.includes('when you can') || lowerText.includes('no rush')) {
        return 'Low';
    } else {
        return 'Medium';
    }
}
