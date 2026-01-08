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

/**
 * POST /models/image endpoint
 * Fetches available image generation models from Vercel AI Gateway
 */
router.post('/models/image', async (req, res) => {
    try {
        const key = readSecret(req.user.directories, SECRET_KEYS.VERCEL_AI_GATEWAY);

        if (!key) {
            console.warn('Vercel AI Gateway API key not found');
            return res.status(400).json({ error: 'Vercel AI Gateway API key not found' });
        }

        const models = await fetchAllModels(key);

        // Filter models that support image generation
        const imageModels = models.filter(model =>
            model.id?.includes('dall-e') ||
            model.id?.includes('imagen') ||
            model.id?.includes('stable-diffusion') ||
            model.id?.includes('flux') ||
            model.id?.includes('midjourney') ||
            model.capabilities?.includes('image-generation')
        );

        return res.json(imageModels);
    } catch (error) {
        console.error('Error fetching Vercel AI Gateway image models:', error);
        return res.sendStatus(500);
    }
});

/**
 * POST /image/generate endpoint
 * Generates an image using Vercel AI Gateway
 */
router.post('/image/generate', async (req, res) => {
    try {
        const key = readSecret(req.user.directories, SECRET_KEYS.VERCEL_AI_GATEWAY);

        if (!key) {
            console.warn('Vercel AI Gateway API key not found');
            return res.status(400).json({ error: 'Vercel AI Gateway API key not found' });
        }

        const { model, prompt, width, height } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const size = width && height ? `${width}x${height}` : '1024x1024';

        const response = await fetch(`${API_VERCEL_AI_GATEWAY}/images/generations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`,
            },
            body: JSON.stringify({
                model: model || 'dall-e-3',
                prompt: prompt,
                size: size,
                n: 1,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Vercel AI Gateway image generation failed:', response.status, errorText);
            return res.status(response.status).json({ error: 'Image generation failed', details: errorText });
        }

        /** @type {any} */
        const data = await response.json();

        return res.json(data);
    } catch (error) {
        console.error('Error generating image with Vercel AI Gateway:', error);
        return res.sendStatus(500);
    }
});

/**
 * POST /models/embedding endpoint
 * Fetches available embedding models from Vercel AI Gateway
 */
router.post('/models/embedding', async (req, res) => {
    try {
        const key = readSecret(req.user.directories, SECRET_KEYS.VERCEL_AI_GATEWAY);

        if (!key) {
            console.warn('Vercel AI Gateway API key not found');
            return res.status(400).json({ error: 'Vercel AI Gateway API key not found' });
        }

        const models = await fetchAllModels(key);

        // Filter models that support embeddings
        const embeddingModels = models.filter(model =>
            model.id?.includes('embedding') ||
            model.id?.includes('embed') ||
            model.capabilities?.includes('embedding')
        );

        return res.json(embeddingModels);
    } catch (error) {
        console.error('Error fetching Vercel AI Gateway embedding models:', error);
        return res.sendStatus(500);
    }
});

/**
 * POST /embeddings endpoint
 * Creates embeddings using Vercel AI Gateway
 */
router.post('/embeddings', async (req, res) => {
    try {
        const key = readSecret(req.user.directories, SECRET_KEYS.VERCEL_AI_GATEWAY);

        if (!key) {
            console.warn('Vercel AI Gateway API key not found');
            return res.status(400).json({ error: 'Vercel AI Gateway API key not found' });
        }

        const { model, input } = req.body;

        if (!input) {
            return res.status(400).json({ error: 'Input is required' });
        }

        const response = await fetch(`${API_VERCEL_AI_GATEWAY}/embeddings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`,
            },
            body: JSON.stringify({
                model: model || 'text-embedding-3-small',
                input: input,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Vercel AI Gateway embeddings failed:', response.status, errorText);
            return res.status(response.status).json({ error: 'Embeddings generation failed', details: errorText });
        }

        /** @type {any} */
        const data = await response.json();

        return res.json(data);
    } catch (error) {
        console.error('Error generating embeddings with Vercel AI Gateway:', error);
        return res.sendStatus(500);
    }
});

/**
 * POST /models/multimodal endpoint
 * Fetches available multimodal (vision) models from Vercel AI Gateway
 */
router.post('/models/multimodal', async (req, res) => {
    try {
        const key = readSecret(req.user.directories, SECRET_KEYS.VERCEL_AI_GATEWAY);

        if (!key) {
            console.warn('Vercel AI Gateway API key not found');
            return res.json([]);
        }

        const models = await fetchAllModels(key);

        // Filter models that support vision/multimodal
        const multimodalModels = models.filter(model =>
            model.capabilities?.includes('vision') ||
            model.capabilities?.includes('multimodal') ||
            model.id?.includes('vision') ||
            model.id?.includes('gpt-4o') ||
            model.id?.includes('gpt-4-turbo') ||
            model.id?.includes('claude-3') ||
            model.id?.includes('gemini')
        );

        // Return just the model IDs as an array of strings
        return res.json(multimodalModels.map(m => m.id));
    } catch (error) {
        console.error('Error fetching Vercel AI Gateway multimodal models:', error);
        return res.json([]);
    }
});
