import { Router } from 'express';

const router = Router();

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const IMAGE_MODELS = [
  'gemini-2.5-pro-exp-03-25',
  'gemini-2.0-flash-exp',
  'gemini-2.5-pro-preview-05-06',
];

async function tryGenerateImage(apiKey, prompt) {
  for (const model of IMAGE_MODELS) {
    try {
      const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`;
      const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['Text', 'Image'] }
      };
      console.log(`Trying Gemini model: ${model}`);
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!response.ok) { const errText = await response.text(); console.error(`Gemini ${model} failed [${response.status}]:`, errText.substring(0, 200)); continue; }
      const data = await response.json();
      console.log(`Gemini ${model} response:`, JSON.stringify(data).substring(0, 300));
      const images = [];
      for (const candidate of (data.candidates || [])) {
        for (const part of (candidate.content?.parts || [])) {
          if (part.inlineData) images.push({ dataUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`, mimeType: part.inlineData.mimeType });
        }
      }
      if (images.length > 0) {
        let text = '';
        for (const candidate of (data.candidates || [])) for (const part of (candidate.content?.parts || [])) if (part.text) text += part.text;
        return { success: true, images, text: text || null, model };
      }
      console.log(`Gemini ${model}: no images, trying next...`);
    } catch (err) { console.error(`Gemini ${model} exception:`, err.message); }
  }
  return null;
}

router.post('/generate', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured.' });
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required.' });
  try {
    const result = await tryGenerateImage(apiKey, prompt);
    if (result) return res.json(result);
    res.status(502).json({ error: 'Image generation unavailable. Your Gemini API key may need billing enabled at https://ai.google.dev.' });
  } catch (err) { console.error(err); res.status(502).json({ error: 'Failed to generate image.' }); }
});

export default router;
