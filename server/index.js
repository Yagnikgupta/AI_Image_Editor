import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ========================================
   Background Removal via remove.bg
   ======================================== */
app.post('/api/remove-bg', upload.single('image'), async (req, res) => {
  try {
    const apiKey = process.env.REMOVEBG_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'REMOVEBG_API_KEY not configured in .env' });
    }

    const formData = new FormData();
    formData.append('image_file', req.file.buffer, {
      filename: req.file.originalname || 'image.png',
      contentType: req.file.mimetype,
    });
    formData.append('size', 'auto');

    const response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
      headers: {
        ...formData.getHeaders(),
        'X-Api-Key': apiKey,
      },
      responseType: 'arraybuffer',
    });

    res.set('Content-Type', 'image/png');
    res.send(Buffer.from(response.data));
  } catch (err) {
    console.error('Remove BG Error:', err.response?.data?.toString() || err.message);
    res.status(500).json({ error: 'Failed to remove background' });
  }
});

/* ========================================
   AI Prompt Agent
   ======================================== */
app.post('/api/ai-agent', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Fallback: local parsing
      const actions = parsePromptLocally(prompt);
      return res.json({
        actions,
        reply: `Applied ${actions.length} edit(s) based on your request.`,
      });
    }

    // Call OpenAI
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an image editing assistant. The user will describe how they want to edit an image. Convert their request into a JSON array of actions.

Available action types:
1. { "type": "adjustment", "key": "<key>", "value": <number -100 to 100> }
   Keys: brightness, contrast, saturation, exposure, temperature, sharpness, highlights, shadows

2. { "type": "filter", "value": "<filter_name>" }
   Filters: vintage, bw, cinematic, hdr, warm, cool, sepia, bright

3. { "type": "enhance" } - auto-enhance the image

4. { "type": "reset" } - reset all edits

Reply with valid JSON only. Format: { "actions": [...], "reply": "friendly message" }`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 300,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response.data.choices[0]?.message?.content;
    const parsed = JSON.parse(content);
    res.json(parsed);
  } catch (err) {
    console.error('AI Agent Error:', err.message);
    // Fallback
    const actions = parsePromptLocally(req.body.prompt || '');
    res.json({
      actions,
      reply: `Applied ${actions.length} edit(s) locally.`,
    });
  }
});

/* ========================================
   Cloudinary Upload
   ======================================== */
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'pixelmind' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    console.error('Upload Error:', err.message);
    res.status(500).json({ error: 'Failed to upload to Cloudinary' });
  }
});

/* ========================================
   Image Enhancement via Replicate
   ======================================== */
app.post('/api/enhance', async (req, res) => {
  try {
    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) return res.status(400).json({ error: 'REPLICATE_API_TOKEN not configured' });

    const { imageUrl } = req.body;
    const response = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: 'dfad41707589d68ecdccd1dfa600d55a208f9310748e44bfe35b4a6291453d5e', // Real-ESRGAN
        input: { image: imageUrl, scale: 2 },
      },
      {
        headers: {
          Authorization: `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Poll for result
    let prediction = response.data;
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
      await new Promise((r) => setTimeout(r, 2000));
      const poll = await axios.get(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        { headers: { Authorization: `Token ${apiKey}` } }
      );
      prediction = poll.data;
    }

    if (prediction.status === 'failed') {
      return res.status(500).json({ error: 'Enhancement failed' });
    }

    res.json({ url: prediction.output });
  } catch (err) {
    console.error('Enhance Error:', err.message);
    res.status(500).json({ error: 'Failed to enhance image' });
  }
});

/* ========================================
   Local fallback prompt parser
   ======================================== */
function parsePromptLocally(prompt) {
  const lower = prompt.toLowerCase();
  const actions = [];

  const filters = ['vintage', 'bw', 'cinematic', 'hdr', 'warm', 'cool', 'sepia', 'bright'];
  for (const f of filters) {
    if (lower.includes(f) || (f === 'bw' && (lower.includes('black and white') || lower.includes('b&w')))) {
      actions.push({ type: 'filter', value: f });
    }
  }

  const adjustmentMap = {
    bright: 'brightness', brighter: 'brightness', brightness: 'brightness',
    contrast: 'contrast',
    saturat: 'saturation', vivid: 'saturation', vibrant: 'saturation',
    sharp: 'sharpness', sharpen: 'sharpness',
    exposure: 'exposure',
    temperature: 'temperature',
    highlight: 'highlights',
    shadow: 'shadows',
  };

  for (const [keyword, key] of Object.entries(adjustmentMap)) {
    if (lower.includes(keyword) && !actions.some((a) => a.type === 'filter')) {
      const isDecrease = lower.includes('decrease') || lower.includes('reduce') || lower.includes('less');
      actions.push({ type: 'adjustment', key, value: isDecrease ? -30 : 30 });
    }
  }

  if (lower.includes('enhance') || lower.includes('improve') || lower.includes('auto')) {
    actions.push({ type: 'enhance' });
  }
  if (lower.includes('reset') || lower.includes('clear') || lower.includes('undo all')) {
    actions.push({ type: 'reset' });
  }

  return actions;
}

/* ========================================
   Start Server
   ======================================== */
app.listen(PORT, () => {
  console.log(`\n  🚀 PixelMind API Server running on http://localhost:${PORT}\n`);
});
