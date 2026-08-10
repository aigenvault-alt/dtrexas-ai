import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat.js';
import filesRouter from './routes/files.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }
  entry.count++;
  rateLimitMap.set(ip, entry);
  if (entry.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }
  next();
}

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3001', 'http://127.0.0.1:5173'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/api', rateLimiter);
app.use('/api/chat', chatRouter);
app.use('/api/files', filesRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', model: process.env.DEFAULT_MODEL || 'llama-3.1-70b-versatile' });
});

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => { console.error('Server error:', err); res.status(500).json({ error: 'Internal server error' }); });

app.listen(PORT, () => {
  console.log(`Dtrexas AI backend running on http://localhost:${PORT}`);
  console.log(`Model: ${process.env.DEFAULT_MODEL || 'llama-3.1-70b-versatile'}`);
});
