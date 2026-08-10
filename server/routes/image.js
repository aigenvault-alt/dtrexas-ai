import { Router } from 'express';

const router = Router();

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const MODELS = [
  'gemini-2.0-flash-exp',
  'gemini-2.5-pro-preview-05-06',
  'gemini-2.5-flash',
];

async function tryGenerate(apiKey, prompt) {
  for (const model of MODELS) {
    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ['Text', 'Image'] }
          }),
        }
      );
      if (!response.ok) {
        console.error(`Gemini model ${model} failed: status ${response.status}`);
        continue;
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
      if (images.length === 0) continue;
      let text = '';
      for (const candidate of (data.candidates || [])) {
        for (const part of (candidate.content?.parts || [])) {
          if (part.text) text += part.text;
        }
      }
      return { success: true, images, text: text || null, model };
    } catch (err) {
      console.error(`Gemini model ${model} error:`, err.message);
    }
  }
  return null;
}

router.post('/generate', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured.' });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required.' });

  try {
    const result = await tryGenerate(apiKey, prompt);
    if (result) return res.json(result);
    res.status(502).json({ error: 'All models failed. Check if your API key has image generation enabled.' });
  } catch (err) {
    console.error('Gemini error:', err);
    res.status(502).json({ error: 'Failed to generate image.' });
  }
});

export default router;
