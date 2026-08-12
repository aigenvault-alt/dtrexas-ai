import { Router } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const router = Router();

// Simple file-based user store (no DB needed)
let users = {};
const DATA_FILE = 'users.json';
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

// Try to load existing users
import('fs').then(fs => {
  try { users = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch {}
});
import('fs').then(fs => {
  const save = () => fs.writeFileSync(DATA_FILE, JSON.stringify(users));
  setInterval(() => save(), 30000);
});

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + JWT_SECRET).digest('hex');
}

// Register
router.post('/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
  if (users[email]) return res.status(409).json({ error: 'Email already registered.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  users[email] = {
    email,
    password: hashPassword(password),
    name: name || email.split('@')[0],
    createdAt: new Date().toISOString()
  };

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { email, name: users[email].name } });
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

  const user = users[email];
  if (!user || user.password !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { email, name: user.name } });
});

// Verify token
router.get('/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users[decoded.email];
    if (!user) return res.status(401).json({ error: 'User not found.' });
    res.json({ user: { email: user.email, name: user.name } });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

export default router;
