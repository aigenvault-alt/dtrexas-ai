import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth.jsx';
import { ChatApp } from './components/ChatApp.jsx';
import { useAuthStore } from './store.js';

const API = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }

    fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setUser(data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = async (email, password, isRegister) => {
    setError('');
    const endpoint = isRegister ? 'register' : 'login';
    try {
      const res = await fetch(`${API}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem('token', data.token);
      setUser(data.user);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    useAuthStore.getState().logout();
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f0f0f', color: '#aaa' }}>Loading...</div>;
  }

  if (!user) {
    return <Auth onLogin={handleLogin} error={error} />;
  }

  return <ChatApp user={user} onLogout={handleLogout} />;
}
