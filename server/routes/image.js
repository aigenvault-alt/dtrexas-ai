import { Router } from 'express';

const router = Router();

// Free image generation via Pollinations.ai - no API key, no billing needed
router.post('/generate', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required.' });

  try {
    // URL-encode the prompt and fetch from Pollinations
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${Date.now()}`;

    console.log('Generating image via Pollinations:', imageUrl.substring(0, 100));

    // Fetch the image as a buffer
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return res.status(502).json({ error: 'Image generation failed. Try a different prompt.' });
    }

    // Convert to base64 data URL
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const dataUrl = `data:${contentType};base64,${base64}`;

    res.json({
      success: true,
      images: [{ dataUrl, mimeType: contentType }],
      text: 'Here is your generated image!',
      model: 'pollinations.ai (free)'
    });
  } catch (err) {
    console.error('Image generation error:', err);
    res.status(502).json({ error: 'Failed to generate image. Pollinations might be down, try again.' });
  }
});

export default router;
