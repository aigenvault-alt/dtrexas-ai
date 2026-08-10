import { Router } from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
try { await fs.mkdir(uploadDir, { recursive: true }); } catch {}

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const AVAILABLE_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: 'Meta' },
  { id: 'llama-3.2-90b-vision-preview', name: 'Llama 3.2 90B Vision', provider: 'Meta' },
  { id: 'llama-3.2-11b-vision-preview', name: 'Llama 3.2 11B Vision', provider: 'Meta' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', provider: 'Meta' },
  { id: 'qwen/qwen3.6-27b', name: 'Qwen 3.6 27B', provider: 'Alibaba' },
  { id: 'allam-2-7b', name: 'Allam 2 7B', provider: 'SDAIA' },
];

const GROQ_API_BASE = 'https://api.groq.com/openai/v1';

// Image upload endpoint - returns base64 data URL
router.post('/upload-image', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });
  try {
    const base64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    res.json({
      success: true,
      dataUrl: `data:${mimeType};base64,${base64}`,
      filename: req.file.originalname,
      size: req.file.size,
    });
  } catch (err) {
    console.error('Image upload error:', err);
    res.status(500).json({ error: 'Failed to process image.' });
  }
});

router.post('/stream', async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server misconfiguration: no API key.' });

  const { messages, model, temperature, max_tokens, images } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: 'Messages array is required.' });

  let selectedModel = model || process.env.DEFAULT_MODEL || 'llama-3.3-70b-versatile';
  let groqMessages = [...messages];

  if (images && images.length > 0) {
    selectedModel = 'llama-3.2-11b-vision-preview';
    const lastUserMsgIdx = groqMessages.map((m, i) => (m.role === 'user' ? i : -1)).filter(i => i >= 0).pop();
    if (lastUserMsgIdx >= 0) {
      const content = [{ type: 'text', text: groqMessages[lastUserMsgIdx].content || 'Describe this image.' }];
      for (const img of images) {
        content.push({ type: 'image_url', image_url: { url: img, detail: 'auto' } });
      }
      groqMessages = groqMessages.map((m, i) =>
        i === lastUserMsgIdx ? { role: m.role, content } : m
      );
    }
  }

  const selectedTemp = temperature ?? parseFloat(process.env.TEMPERATURE || '0.7');
  const selectedMaxTokens = max_tokens ?? parseInt(process.env.MAX_TOKENS || '8192', 10);

  try {
    const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: selectedModel, messages: groqMessages,
        temperature: selectedTemp, max_tokens: selectedMaxTokens,
        stream: true, stream_options: { include_usage: true },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      let errJson = {};
      try { errJson = JSON.parse(errBody); } catch {}
      const errMsg = errJson?.error?.message || errBody || 'Unknown API error';
      let status = 502;
      if (response.status === 401) status = 500;
      else if (response.status === 429) status = 429;
      else if (response.status === 404) status = 400;
      return res.status(status).json({ error: `AI service error: ${errMsg}` });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let aborted = false;

    req.on('close', () => { aborted = true; reader.cancel().catch(() => {}); });

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done || aborted) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') { res.write(`data: [DONE]\n\n`); break; }
            res.write(`data: ${data}\n\n`);
          }
        }
      }
    } catch (streamErr) {
      if (!aborted) console.error('Stream read error:', streamErr);
    }
    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (err) {
    console.error('Chat stream error:', err);
    if (!res.headersSent) return res.status(502).json({ error: 'Failed to connect to AI service.' });
    res.end();
  }
});

router.get('/models', (_req, res) => {
  res.json({ models: AVAILABLE_MODELS, default: process.env.DEFAULT_MODEL || 'llama-3.3-70b-versatile' });
});

export default router;
