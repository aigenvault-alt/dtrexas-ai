import { Router } from 'express';

const router = Router();

const GROQ_API_BASE = 'https://api.groq.com/openai/v1';

router.post('/stream', async (req, res) => {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return res.status(500).json({ error: 'Groq API key not configured.' });

  const { messages, model, temperature, max_tokens } = req.body;
  if (!messages || messages.length === 0) return res.status(400).json({ error: 'Messages are required.' });

  try {
    const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: model || 'llama-3.3-70b-versatile',
        messages,
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
