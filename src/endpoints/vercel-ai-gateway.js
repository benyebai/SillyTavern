import express from 'express';
import fetch from 'node-fetch';
import mime from 'mime-types';
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
 * POST /models/embedding endpoint
 * Fetches embedding models from Vercel AI Gateway
 */
router.post('/models/embedding', async (req, res) => {
    try {
        const key = readSecret(req.user.directories, SECRET_KEYS.VERCEL_AI_GATEWAY);

        if (!key) {
            console.warn('Vercel AI Gateway API key not found');
            return res.status(400).json({ error: 'Vercel AI Gateway API key not found' });
        }

        const allModels = await fetchAllModels(key);

        // Filter for embedding models
        // Embedding providers: voyage/*, openai/text-embedding-*, cohere/embed-*
        const embeddingModels = allModels.filter(model => {
            const id = model.id?.toLowerCase() || '';
            return id.startsWith('voyage/') ||
                   id.includes('embedding') ||
                   id.startsWith('cohere/embed');
        }).map(model => ({
            id: model.id,
            name: model.id,
        }));

        return res.json(embeddingModels);
    } catch (error) {
        console.error('Error fetching Vercel AI Gateway embedding models:', error);
        return res.sendStatus(500);
    }
});

/**
 * POST /models/multimodal endpoint
 * Fetches multimodal (vision) models from Vercel AI Gateway
 */
router.post('/models/multimodal', async (req, res) => {
    try {
        const key = readSecret(req.user.directories, SECRET_KEYS.VERCEL_AI_GATEWAY);

        if (!key) {
            console.warn('Vercel AI Gateway API key not found');
            return res.status(400).json({ error: 'Vercel AI Gateway API key not found' });
        }

        const allModels = await fetchAllModels(key);

        // Filter for vision/multimodal models
        // Known vision models include: gpt-4o, gpt-4-vision, claude-3-*, gemini-*-vision, etc.
        const visionPatterns = [
            'gpt-4o', 'gpt-4-turbo', 'gpt-4.1',
            'claude-3', 'claude-sonnet-4',
            'gemini-1.5', 'gemini-2',
            'grok-2-vision', 'grok-3', 'grok-4',
            'llama-4',
            'pixtral',
        ];

        const multimodalModels = allModels.filter(model => {
            const id = model.id?.toLowerCase() || '';
            // Exclude embedding models
            if (id.includes('embedding')) return false;
            // Check if it matches known vision patterns
            return visionPatterns.some(pattern => id.includes(pattern.toLowerCase()));
        }).map(model => model.id);

        return res.json(multimodalModels);
    } catch (error) {
        console.error('Error fetching Vercel AI Gateway multimodal models:', error);
        return res.sendStatus(500);
    }
});

/**
 * POST /models/image endpoint
 * Fetches image generation models from Vercel AI Gateway
 */
router.post('/models/image', async (req, res) => {
    try {
        const key = readSecret(req.user.directories, SECRET_KEYS.VERCEL_AI_GATEWAY);

        if (!key) {
            console.warn('Vercel AI Gateway API key not found');
            return res.status(400).json({ error: 'Vercel AI Gateway API key not found' });
        }

        const allModels = await fetchAllModels(key);

        // Filter for image generation models
        // Known image gen models: dall-e-*, stable-diffusion-*, flux-*, etc.
        const imageGenPatterns = [
            'dall-e', 'stable-diffusion', 'flux', 'midjourney',
            'imagen', 'kandinsky', 'sdxl',
        ];

        const imageModels = allModels.filter(model => {
            const id = model.id?.toLowerCase() || '';
            return imageGenPatterns.some(pattern => id.includes(pattern));
        }).map(model => ({
            value: model.id,
            text: model.id,
        }));

        return res.json(imageModels);
    } catch (error) {
        console.error('Error fetching Vercel AI Gateway image models:', error);
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

        if (!model || !input) {
            return res.status(400).json({ error: 'Model and input are required' });
        }

        const response = await fetch(`${API_VERCEL_AI_GATEWAY}/embeddings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`,
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                model,
                input,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.warn('Vercel AI Gateway embeddings request failed', response.statusText, errorText);
            return res.status(response.status).json({ error: 'Failed to create embeddings' });
        }

        const data = await response.json();
        return res.json(data);
    } catch (error) {
        console.error('Error creating Vercel AI Gateway embeddings:', error);
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
 * Convert aspect ratio string to size string
 * @param {string} aspectRatio - Aspect ratio like "1:1", "16:9", etc.
 * @param {number} width - Requested width
 * @param {number} height - Requested height
 * @returns {string} Size string like "1024x1024"
 */
function getImageSize(aspectRatio, width, height) {
    // If width and height are provided, use them
    if (width && height) {
        return `${width}x${height}`;
    }

    // Map common aspect ratios to sizes
    const sizeMap = {
        '1:1': '1024x1024',
        '16:9': '1792x1024',
        '9:16': '1024x1792',
        '4:3': '1024x768',
        '3:4': '768x1024',
        '3:2': '1024x683',
        '2:3': '683x1024',
    };

    return sizeMap[aspectRatio] || '1024x1024';
}

/**
 * POST /image/generate endpoint
 * Generates an image using Vercel AI Gateway (OpenAI-compatible images API)
 */
router.post('/image/generate', async (req, res) => {
    try {
        const key = readSecret(req.user.directories, SECRET_KEYS.VERCEL_AI_GATEWAY);

        if (!key) {
            console.warn('Vercel AI Gateway API key not found');
            return res.status(400).json({ error: 'Vercel AI Gateway API key not found' });
        }

        console.debug('Vercel AI Gateway image generation request', req.body);

        const { model, prompt } = req.body;

        if (!model || !prompt) {
            return res.status(400).json({ error: 'Model and prompt are required' });
        }

        const size = getImageSize(req.body.aspect_ratio, req.body.width, req.body.height);

        const response = await fetch(`${API_VERCEL_AI_GATEWAY}/images/generations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`,
            },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                n: 1,
                size: size,
                response_format: 'b64_json',
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.warn('Vercel AI Gateway image generation failed', errorText);
            return res.status(response.status).send(errorText);
        }

        /** @type {any} */
        const data = await response.json();

        // OpenAI-compatible response format: { data: [{ b64_json: "...", revised_prompt: "..." }] }
        const imageData = data?.data?.[0]?.b64_json;

        if (!imageData) {
            // Try URL format as fallback
            const imageUrl = data?.data?.[0]?.url;
            if (imageUrl) {
                // Fetch the image from URL and convert to base64
                const imageResponse = await fetch(imageUrl);
                if (imageResponse.ok) {
                    const imageBuffer = await imageResponse.buffer();
                    const base64 = imageBuffer.toString('base64');
                    const contentType = imageResponse.headers.get('content-type') || 'image/png';
                    return res.json({
                        format: mime.extension(contentType) || 'png',
                        image: base64,
                    });
                }
            }
            console.warn('No image data found in Vercel AI Gateway response', data);
            return res.sendStatus(500);
        }

        return res.json({
            format: 'png',
            image: imageData,
        });
    } catch (error) {
        console.error('Error generating image with Vercel AI Gateway:', error);
        return res.sendStatus(500);
    }
});
