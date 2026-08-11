import { Router } from 'express';

const router = Router();

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Image generation - uses gemini-2.0-flash-exp with responseModalities
router.post('/generate', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured.' });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required.' });

  try {
    const url = `${GEMINI_API_BASE}/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['Text', 'Image'] }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini generate error:', err.substring(0, 300));
      return res.status(502).json({ error: 'Gemini API error. Check if the API key has access to image generation.' });
    }

    const data = await response.json();
    const images = [];
    let text = '';

    for (const candidate of (data.candidates || [])) {
      for (const part of (candidate.content?.parts || [])) {
        if (part.inlineData) {
          images.push({ dataUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`, mimeType: part.inlineData.mimeType });
        }
        if (part.text) text += part.text;
      }
    }

    if (images.length === 0) {
      return res.status(502).json({ error: 'No image generated. The model may have returned text only.' });
    }

    res.json({ success: true, images, text: text || null, model: 'gemini-2.0-flash-exp' });
  } catch (err) {
    console.error('Image gen error:', err);
    res.status(502).json({ error: 'Failed to generate image.' });
  }
});

// Image analysis - uses gemini-1.5-flash for fast, cheap vision
router.post('/analyze', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured.' });

  const { images, prompt } = req.body;
  if (!images || images.length === 0) return res.status(400).json({ error: 'At least one image is required.' });

  try {
    const url = `${GEMINI_API_BASE}/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // Build parts: image(s) + optional text prompt
    const parts = [];
    for (const img of images) {
      // Extract base64 data from data URL
      const match = img.match(/^data:(.+?);base64,(.+)$/);
      if (!match) continue;
      parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
    }
    parts.push({ text: prompt || 'Describe this image in detail. What do you see?' });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 }
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini analyze error:', err.substring(0, 300));
      return res.status(502).json({ error: 'Image analysis failed.' });
    }

    const data = await response.json();
    let text = '';
    for (const candidate of (data.candidates || [])) {
      for (const part of (candidate.content?.parts || [])) {
        if (part.text) text += part.text;
      }
    }

    res.json({ success: true, text, model: 'gemini-1.5-flash' });
  } catch (err) {
    console.error('Image analyze error:', err);
    res.status(502).json({ error: 'Failed to analyze image.' });
  }
});

export default router;
