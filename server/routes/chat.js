import { Router } from 'express';

const router = Router();

const GROQ_API_BASE = 'https://api.groq.com/openai/v1';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Helper: analyze images with Gemini 1.5 Flash
async function analyzeImages(apiKey, images, userText) {
  const url = `${GEMINI_API_BASE}/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const parts = [];
  for (const img of images) {
    const match = img.match(/^data:(.+?);base64,(.+)$/);
    if (!match) continue;
    parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
  }
  parts.push({ text: userText || 'Describe this image in detail. What do you see?' });

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
    console.error('Gemini vision error:', err.substring(0, 200));
    throw new Error('Image analysis failed');
  }

  const data = await response.json();
  let text = '';
  for (const candidate of (data.candidates || [])) {
    for (const part of (candidate.content?.parts || [])) {
      if (part.text) text += part.text;
    }
  }
  return text;
}

router.post('/stream', async (req, res) => {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!groqKey) return res.status(500).json({ error: 'Groq API key not configured.' });

  const { messages, model, temperature, max_tokens, images } = req.body;
  if (!messages || messages.length === 0) return res.status(400).json({ error: 'Messages are required.' });

  try {
    let apiMessages = [...messages];

    // If images are attached, analyze them with Gemini first
    if (images && images.length > 0 && geminiKey) {
      try {
        const lastUserMsg = [...apiMessages].reverse().find(m => m.role === 'user');
        const userText = lastUserMsg?.content || '';
        const description = await analyzeImages(geminiKey, images, userText);

        // Replace the last user message with the image description
        apiMessages = apiMessages.map(m => {
          if (m === lastUserMsg || (m.role === 'user' && m.content === userText)) {
            return { ...m, content: `[User sent an image. Image description: ${description}]\n\nUser message: ${userText || '(no text)'}` };
          }
          return m;
        });
      } catch (err) {
        console.error('Image analysis failed, proceeding without:', err.message);
        apiMessages[apiMessages.length - 1] = {
          role: 'user',
          content: '[User sent an image but it could not be analyzed. Please let them know.]'
        };
      }
    }

    const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: model || 'llama-3.3-70b-versatile',
        messages: apiMessages,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens || 8192,
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(502).json({ error: err.error?.message || 'Groq API error' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          res.write('data: [DONE]\n\n');
          res.end();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
            res.end();
            return;
          }
          try {
            JSON.parse(data);
            res.write(`${trimmed}\n\n`);
          } catch {
            continue;
          }
        }
      }
    } catch (err) {
      if (err.message?.includes('abort') || err.code === 'ERR_STREAM_PREMATURE_CLOSE') {
        try { res.end(); } catch {}
      } else {
        console.error('Stream error:', err);
        try { res.end(); } catch {}
      }
    }
  } catch (err) {
    console.error('Chat route error:', err);
    if (!res.headersSent) {
      res.status(502).json({ error: err.message || 'Chat API error' });
    }
  }
});

export default router;
