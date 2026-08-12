import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export function Auth({ onLogin, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try { await onLogin(email, password, isRegister); }
    finally { setLoading(false); }
  };

  return (
    <div style={s.wrapper}>
      <div style={s.card}>
        <div style={s.icon}>🤖</div>
        <h1 style={s.title}>Dtrexas AI</h1>
        <p style={s.subtitle}>Welcome back</p>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.inputGroup}>
            <Mail size={18} style={s.inputIcon} />
            <input style={s.input} type="email" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)} required />
          </div>
          <div style={s.inputGroup}>
            <Lock size={18} style={s.inputIcon} />
            <input style={s.input} type={showPassword ? 'text' : 'password'} placeholder="Password"
              value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button type="submit" disabled={loading} style={s.submitBtn}>
            {loading ? 'Loading...' : isRegister ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <p style={s.switchText}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setIsRegister(!isRegister)} style={s.switchBtn}>
            {isRegister ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}

const s = {
  wrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0f0f0f', padding: 20 },
  card: { width: '100%', maxWidth: 400, padding: 40, background: '#1a1a1a', borderRadius: 16, border: '1px solid #2a2a2a', textAlign: 'center' },
  icon: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 4px' },
  subtitle: { fontSize: 14, color: '#888', margin: '0 0 20px' },
  error: { background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '10px 16px', borderRadius: 8, fontSize: 13, marginBottom: 16 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  inputGroup: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: 14, color: '#666' },
  input: { width: '100%', padding: '12px 14px 12px 42px', border: '1px solid #333', borderRadius: 10, background: '#0f0f0f', color: '#fff', fontSize: 14, outline: 'none' },
  eyeBtn: { position: 'absolute', right: 12, background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 0, display: 'flex' },
  submitBtn: { padding: '12px', background: '#7c3aed', color: '#fff', fontSize: 15, fontWeight: 600, border: 'none', borderRadius: 10, cursor: 'pointer', marginTop: 4 },
  switchText: { marginTop: 20, fontSize: 13, color: '#888' },
  switchBtn: { background: 'none', border: 'none', color: '#7c3aed', fontWeight: 600, cursor: 'pointer', fontSize: 13 },
};
