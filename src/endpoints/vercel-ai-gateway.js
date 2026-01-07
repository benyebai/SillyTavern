import express from 'express';
import fetch from 'node-fetch';
import { readSecret, SECRET_KEYS } from './secrets.js';

export const router = express.Router();
const API_VERCEL_AI_GATEWAY = 'https://ai-gateway.vercel.sh/v1';

/**
 * Fetches all models from Vercel AI Gateway
 * @param {string} key API key
 * @returns {Promise<any[]>} Array of model objects
 */
async function fetchAllModels(key) {
    const response = await fetch(`${API_VERCEL_AI_GATEWAY}/models`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${key}`,
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        console.warn('Vercel AI Gateway models request failed', response.statusText);
        return [];
    }

    /** @type {any} */
    const data = await response.json();

    if (!Array.isArray(data?.data)) {
        console.warn('Vercel AI Gateway API response was not in expected format');
        return [];
    }

    return data.data;
}

/**
 * POST /models endpoint
 * Fetches available models from Vercel AI Gateway
 */
router.post('/models', async (req, res) => {
    try {
        const key = readSecret(req.user.directories, SECRET_KEYS.VERCEL_AI_GATEWAY);

        if (!key) {
            console.warn('Vercel AI Gateway API key not found');
            return res.status(400).json({ error: 'Vercel AI Gateway API key not found' });
        }

        const models = await fetchAllModels(key);
        return res.json(models);
    } catch (error) {
        console.error('Error fetching Vercel AI Gateway models:', error);
        return res.sendStatus(500);
    }
});

/**
 * POST /models/:model endpoint
 * Fetches information about a specific model
 */
router.post('/models/:model', async (req, res) => {
    try {
        const key = readSecret(req.user.directories, SECRET_KEYS.VERCEL_AI_GATEWAY);

        if (!key) {
            console.warn('Vercel AI Gateway API key not found');
            return res.status(400).json({ error: 'Vercel AI Gateway API key not found' });
        }

        const { model } = req.params;

        if (!model) {
            return res.status(400).json({ error: 'Model ID is required' });
        }

        const response = await fetch(`${API_VERCEL_AI_GATEWAY}/models/${model}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.warn('Vercel AI Gateway model details request failed', response.statusText);
            return res.status(response.status).json({ error: 'Failed to fetch model details' });
        }

        /** @type {any} */
        const data = await response.json();

        return res.json(data);
    } catch (error) {
        console.error('Error fetching Vercel AI Gateway model details:', error);
        return res.sendStatus(500);
    }
});
