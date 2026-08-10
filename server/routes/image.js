import { Router } from 'express';

const router = Router();

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const MODEL = 'gemini-2.0-flash-exp-image-generation';

router.post('/generate', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured.' });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required.' });

  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            responseModalities: ['Text', 'Image']
          }
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini error:', errText);
      return res.status(502).json({ error: 'Gemini API error: ' + errText.slice(0, 200) });
    }

    const data = await response.json();
    const images = [];
    for (const candidate of (data.candidates || [])) {
      for (const part of (candidate.content?.parts || [])) {
        if (part.inlineData) {
          images.push({
            dataUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
            mimeType: part.inlineData.mimeType
          });
        }
      }
    }
    let text = '';
    for (const candidate of (data.candidates || [])) {
      for (const part of (candidate.content?.parts || [])) {
        if (part.text) text += part.text;
      }
    }
    if (images.length === 0) {
      return res.json({ success: true, text: text || 'No image generated.', images: [] });
    }
    res.json({ success: true, images, text: text || null });
  } catch (err) {
    console.error('Gemini error:', err);
    res.status(502).json({ error: 'Failed to generate image.' });
  }
});

export default router;
