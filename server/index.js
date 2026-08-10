import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat.js';
import filesRouter from './routes/files.js';
import imageRouter from './routes/image.js';

const app = express();
const PORT = process.env.PORT || 3001;

const rateLimitMap = new Map();
function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart > 60000) { entry.count = 0; entry.windowStart = now; }
  entry.count++;
  rateLimitMap.set(ip, entry);
  if (entry.count > 30) return res.status(429).json({ error: 'Too many requests.' });
  next();
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/api', rateLimiter);
app.use('/api/chat', chatRouter);
app.use('/api/files', filesRouter);
app.use('/api/image', imageRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', model: process.env.DEFAULT_MODEL || 'llama-3.1-70b-versatile' });
});

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log('Dtrexas AI running on port ' + PORT);
});
