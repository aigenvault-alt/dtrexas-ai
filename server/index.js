import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chatRoutes from './routes/chat.js';
import imageRoutes from './routes/image.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));

app.use('/api/chat', chatRoutes);
app.use('/api/image', imageRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', model: process.env.MODEL || 'llama-3.3-70b-versatile' });
});

app.use(express.static(join(__dirname, '..', 'dist')));
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
