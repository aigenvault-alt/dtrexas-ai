import React, { useState } from 'react';
import { loginWithGoogle, loginWithEmail, registerWithEmail } from '../firebase.js';
import { LogIn, Mail, Lock, UserPlus, Chrome } from 'lucide-react';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // login | register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') await loginWithEmail(email, password);
      else await registerWithEmail(email, password);
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\s*\(auth\/.*\)/, ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\s*\(auth\/.*\)/, ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.wrapper}>
      <div style={s.card}>
        <img src="/favicon.png" alt="Dtrexas AI" style={s.logoImg} />
        <h1 style={s.title}>Dtrexas AI</h1>
        <p style={s.subtitle}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</p>

        {error && <div style={s.error}>{error}</div>}

        <button style={s.googleBtn} onClick={handleGoogle} disabled={loading}>
          <Chrome size={20} />
          Continue with Google
        </button>

        <div style={s.divider}><span>or</span></div>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.inputGroup}>
            <Mail size={18} style={s.inputIcon} />
            <input style={s.input} type="email" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)} required />
          </div>
          <div style={s.inputGroup}>
            <Lock size={18} style={s.inputIcon} />
            <input style={s.input} type="password" placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          <button style={s.submitBtn} type="submit" disabled={loading}>
            {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
            {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p style={s.switch}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button style={s.switchBtn} onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}

const s = {
  wrapper: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100%', width: '100%', background: 'var(--bg-primary)',
  },
  card: {
    width: 380, maxWidth: '90%', padding: 40,
    background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border)', textAlign: 'center',
    boxShadow: 'var(--shadow-lg)',
  },
  logo: { fontSize: 48, marginBottom: 12 },
  logoImg: { width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', marginBottom: 16, display: 'block', margin: '0 auto 16px' },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' },
  subtitle: { fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 },
  error: {
    padding: '10px 14px', borderRadius: 'var(--radius-sm)',
    background: 'rgba(248, 113, 113, 0.15)', color: 'var(--error)',
    fontSize: 13, marginBottom: 16,
  },
  googleBtn: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    padding: '12px', borderRadius: 'var(--radius-md)',
    background: '#fff', color: '#333', fontWeight: 600, fontSize: 14,
    border: '1px solid #ddd', cursor: 'pointer',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0',
    color: 'var(--text-muted)', fontSize: 12,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  inputGroup: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'var(--bg-input)', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)', padding: '0 14px',
  },
  inputIcon: { color: 'var(--text-muted)', flexShrink: 0 },
  input: {
    flex: 1, background: 'none', border: 'none', outline: 'none',
    padding: '12px 0', fontSize: 14, color: 'var(--text-primary)',
  },
  submitBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '12px', borderRadius: 'var(--radius-md)',
    background: 'var(--accent)', color: '#fff', fontWeight: 600, fontSize: 14,
    border: 'none', cursor: 'pointer', marginTop: 4,
  },
  switch: { marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' },
  switchBtn: {
    color: 'var(--accent)', fontWeight: 600, border: 'none',
    background: 'none', cursor: 'pointer', fontSize: 13,
  },
};
