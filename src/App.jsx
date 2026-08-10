import React, { useEffect, useRef, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import ChatArea from './components/ChatArea.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import LoginPage from './components/LoginPage.jsx';
import { useChatStore } from './store.js';
import { Menu, PanelLeftClose, PanelLeft } from 'lucide-react';
import { auth, onAuthChange } from './firebase.js';

export default function App() {
  const { conversations, activeId, createChat, setActiveId, sidebarOpen, toggleSidebar, settingsOpen } = useChatStore();
  const initialized = useRef(false);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
    const unsub = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!initialized.current && authChecked && user) {
      initialized.current = true;
      if (conversations.length === 0) {
        const id = createChat();
        setActiveId(id);
      } else if (!activeId) {
        setActiveId(conversations[0]?.id || null);
      }
    }
  }, [authChecked, user]);

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg-primary)' }}>
        <div className="dot-wave"><span></span><span></span><span></span></div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  const activeConv = conversations.find(c => c.id === activeId);

  return (
    <div style={styles.wrapper}>
      {sidebarOpen && (
        <div style={styles.sidebar}>
          <Sidebar
            conversations={conversations}
            activeId={activeId}
            user={user}
            onSelect={setActiveId}
            onNew={createChat}
            onDelete={(id) => useChatStore.getState().deleteChat(id)}
            onRename={(id, t) => useChatStore.getState().renameChat(id, t)}
            onClose={toggleSidebar}
          />
        </div>
      )}
      <div style={styles.main}>
        <div style={styles.topBar}>
          <button style={styles.iconBtn} onClick={toggleSidebar} title="Toggle sidebar">
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
          </button>
          <span style={styles.topTitle}>{activeConv?.title || 'Dtrexas AI'}</span>
          <button style={styles.iconBtn} onClick={() => useChatStore.getState().toggleSettings()} title="Settings">
            <Menu size={18} />
          </button>
        </div>
        <ChatArea conversation={activeConv || null} />
      </div>
      {settingsOpen && <SettingsPanel user={user} onClose={() => useChatStore.getState().toggleSettings()} />}
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', height: '100%', width: '100%', position: 'relative', overflow: 'hidden' },
  sidebar: { width: 280, minWidth: 280, height: '100%', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', zIndex: 100, transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' },
  topBar: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', minHeight: 52 },
  topTitle: { flex: 1, fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  iconBtn: { padding: 8, borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition)', border: 'none', background: 'none', cursor: 'pointer' },
};
