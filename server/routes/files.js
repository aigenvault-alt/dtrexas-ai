import { Router } from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', 'uploads');
try { await fs.mkdir(uploadDir, { recursive: true }); } catch {}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

router.post('/extract', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  const filePath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();

  try {
    let text = '';
    if (['.txt', '.md', '.csv', '.json'].includes(ext)) {
      text = await fs.readFile(filePath, 'utf-8');
    } else if (ext === '.pdf') {
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(await fs.readFile(filePath));
      text = data.text || '';
    } else if (ext === '.docx') {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer: await fs.readFile(filePath) });
      text = result.value || '';
    } else {
      text = await fs.readFile(filePath, 'utf-8').catch(() => '');
      if (!text) return res.status(400).json({ error: `Unsupported file type: ${ext}` });
    }
    if (text.length > 100_000) text = text.slice(0, 100_000) + '\n\n[Content truncated...]';
    await fs.unlink(filePath).catch(() => {});
    res.json({ success: true, filename: req.file.originalname, content: text, charCount: text.length });
  } catch (err) {
    console.error('File extraction error:', err);
    await fs.unlink(filePath).catch(() => {});
    res.status(500).json({ error: 'Failed to extract text from file.' });
  }
});

export default router;
