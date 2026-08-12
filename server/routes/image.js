import { Router } from 'express';

const router = Router();

// Image generation - requires GEMINI_API_KEY env var
router.post('/generate', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Image generation is not configured.' });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required.' });

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
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
      return res.status(502).json({ error: 'Gemini API error.' });
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
      return res.status(502).json({ error: 'No image generated.' });
    }

    res.json({ success: true, images, text: text || null, model: 'gemini-2.0-flash-exp' });
  } catch (err) {
    console.error('Image gen error:', err);
    res.status(502).json({ error: 'Failed to generate image.' });
  }
});

// Image analysis - uses gemini-1.5-flash
router.post('/analyze', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Image analysis is not configured.' });

  const { images, prompt } = req.body;
  if (!images || images.length === 0) return res.status(400).json({ error: 'At least one image is required.' });

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const parts = [];
    for (const img of images) {
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
