import React, { useEffect, useRef, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import ChatArea from './components/ChatArea.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import { Auth } from './components/Auth.jsx';
import { useChatStore } from './store.js';
import { Menu, PanelLeftClose, PanelLeft } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setAuthLoading(false); return; }
    fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setUser(data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setAuthLoading(false));
  }, []);

  const handleLogin = async (email, password, isRegister) => {
    setAuthError('');
    const endpoint = isRegister ? 'register' : 'login';
    const res = await fetch(`${API}/api/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (authLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f0f0f', color: '#aaa', fontSize: 16 }}>Loading...</div>;
  }

  if (!user) {
    return <Auth onLogin={handleLogin} error={authError} />;
  }

  return <ChatInterface user={user} onLogout={handleLogout} />;
}

function ChatInterface({ user, onLogout }) {
  const { conversations, activeId, createChat, setActiveId, sidebarOpen, toggleSidebar, settingsOpen } = useChatStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      if (conversations.length === 0) { const id = createChat(); setActiveId(id); }
      else if (!activeId) setActiveId(conversations[0]?.id || null);
    }
  }, []);

  const activeConv = conversations.find(c => c.id === activeId);

  return (
    <div style={styles.wrapper}>
      {sidebarOpen && <div style={styles.mobileOverlay} onClick={toggleSidebar} />}
      <div style={{ ...styles.sidebar, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)', ...(sidebarOpen ? {} : { position: 'absolute' }) }}>
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={setActiveId}
          onNew={createChat}
          onDelete={(id) => useChatStore.getState().deleteChat(id)}
          onRename={(id, t) => useChatStore.getState().renameChat(id, t)}
          onClose={toggleSidebar}
        />
      </div>
      <div style={styles.main}>
        <div style={styles.topBar}>
          <button style={styles.iconBtn} onClick={toggleSidebar} title="Toggle sidebar">{sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}</button>
          <div style={styles.topTitle}>{activeConv?.title || 'Dtrexas AI'}</div>
          <button style={styles.iconBtn} onClick={() => useChatStore.getState().toggleSettings()} title="Settings"><Menu size={20} /></button>
        </div>
        <ChatArea conversation={activeConv} />
      </div>
      {settingsOpen && <SettingsPanel onClose={() => useChatStore.getState().toggleSettings()} />}
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', height: '100%', width: '100%', position: 'relative', overflow: 'hidden' },
  sidebar: { width: 280, minWidth: 280, height: '100%', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', zIndex: 100, transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' },
  mobileOverlay: { display: 'none' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' },
  topBar: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', minHeight: 52 },
  topTitle: { flex: 1, fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  iconBtn: { padding: 8, borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition)', background: 'none', border: 'none', cursor: 'pointer' },
};
