import React, { useState } from 'react';
import { Plus, Trash2, MessageSquare, Check, Pencil } from 'lucide-react';

export default function Sidebar({ conversations, activeId, onSelect, onNew, onDelete, onRename, onClose }) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const startRename = (chat) => { setEditingId(chat.id); setEditValue(chat.title); };
  const confirmRename = () => { if (editingId && editValue.trim()) onRename(editingId, editValue.trim()); setEditingId(null); };
  const handleKeyDown = (e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setEditingId(null); };

  return (
    <>
      <div style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
        <button style={s.newChatBtn} onClick={() => { const id = onNew(); onSelect(id); }}>
          <Plus size={18} /><span>New Chat</span>
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {conversations.length === 0 && (
          <div style={s.emptyState}>
            <MessageSquare size={32} style={{ opacity: 0.3 }} />
            <p>No conversations yet</p>
          </div>
        )}
        {conversations.map(chat => (
          <div key={chat.id} style={{ ...s.chatItem, background: chat.id === activeId ? 'var(--bg-tertiary)' : 'transparent' }}
            onClick={() => { onSelect(chat.id); if (window.innerWidth < 768) onClose(); }}>
            <MessageSquare size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            {editingId === chat.id ? (
              <input style={s.editInput} value={editValue} onChange={e => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown} onBlur={confirmRename} autoFocus onClick={e => e.stopPropagation()} />
            ) : (
              <span style={s.chatTitle}>{chat.title}</span>
            )}
            <div style={{ display: 'flex', gap: 2 }}>
              {editingId === chat.id ? (
                <button style={s.actionBtn} onClick={e => { e.stopPropagation(); confirmRename(); }} title="Save"><Check size={14} /></button>
              ) : (
                <button style={s.actionBtn} onClick={e => { e.stopPropagation(); startRename(chat); }} title="Rename"><Pencil size={14} /></button>
              )}
              <button style={{ ...s.actionBtn, color: 'var(--error)' }} onClick={e => { e.stopPropagation(); onDelete(chat.id); }} title="Delete"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
      <div style={s.userFooter}>
        <span style={s.version}>Dtrexas AI v1.0</span>
      </div>
    </>
  );
}

const s = {
  newChatBtn: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 14px', borderRadius: 'var(--radius-md)',
    background: 'var(--accent)', color: '#fff', fontWeight: 600, fontSize: 14,
    border: 'none', cursor: 'pointer',
  },
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 40, color: 'var(--text-muted)', fontSize: 13,
  },
  chatItem: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
    borderRadius: 'var(--radius-sm)', cursor: 'pointer', marginBottom: 2,
  },
  editInput: {
    flex: 1, background: 'var(--bg-input)', border: '1px solid var(--accent)',
    borderRadius: 4, padding: '2px 6px', fontSize: 13, color: 'var(--text-primary)', outline: 'none',
  },
  chatTitle: {
    flex: 1, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden',
    textOverflow: 'ellipsis', color: 'var(--text-secondary)',
  },
  actionBtn: {
    padding: 4, borderRadius: 4, color: 'var(--text-muted)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: 'none', background: 'none', cursor: 'pointer',
  },
  userFooter: {
    borderTop: '1px solid var(--border)', padding: '10px 12px 14px',
  },
  version: {
    fontSize: 11, color: 'var(--text-muted)',
  },
};
