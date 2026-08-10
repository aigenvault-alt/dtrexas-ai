import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Paperclip } from 'lucide-react';
import { useChatStore } from '../store.js';

export default function MessageComposer({ chatId, onSubmit, isStreaming, onStop }) {
  const [input, setInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const settings = useChatStore(s => s.settings);

  useEffect(() => { const el = textareaRef.current; if (!el) return; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 200) + 'px'; }, [input]);

  const handleSend = () => { const trimmed = input.trim(); if (!trimmed || isStreaming) return; onSubmit(trimmed); setInput(''); };
  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const handleFileUpload = async (file) => {
    if (!file) return; setUploading(true);
    try {
      const formData = new FormData(); formData.append('file', file);
      const res = await fetch('/api/files/extract', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success && data.content) { const prefix = `[File: ${data.filename}]\n\n${data.content}\n\n[End of file]`; onSubmit(prefix); }
      else alert(data.error || 'File extraction failed');
    } catch (err) { alert('Failed to upload file: ' + err.message); }
    finally { setUploading(false); }
  };

  return (
    <div style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '8px 12px', background: 'var(--bg-input)', border: `1px solid ${isDragging ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius-xl)', transition: 'var(--transition)' }}
        onDrop={e => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files[0]; if (file) handleFileUpload(file); }}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".txt,.pdf,.docx,.json,.csv,.md" onChange={e => { if (e.target.files[0]) handleFileUpload(e.target.files[0]); e.target.value = ''; }} />
        <button style={{ padding: 8, color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)', flexShrink: 0 }} onClick={() => fileInputRef.current?.click()} disabled={uploading} title="Attach file"><Paperclip size={18} /></button>
        <textarea ref={textareaRef} data-composer-input style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14.5, lineHeight: 1.5, color: 'var(--text-primary)', resize: 'none', padding: '4px 0', maxHeight: 200 }} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={uploading ? 'Extracting text...' : 'Message Dtrexas AI...'} rows={1} disabled={isStreaming || uploading} />
        {isStreaming ? <button style={{ padding: 8, borderRadius: '50%', background: 'var(--error)', color: '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 1.5s infinite' }} onClick={onStop} title="Stop"><Square size={16} fill="currentColor" /></button> : <button style={{ padding: 8, borderRadius: '50%', background: input.trim() ? 'var(--accent)' : 'var(--bg-tertiary)', color: input.trim() ? '#fff' : 'var(--text-muted)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={handleSend} disabled={!input.trim() || uploading} title="Send"><Send size={17} /></button>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px 0' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 4 }}>{settings.model}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Enter to send · Shift+Enter for new line</span>
      </div>
    </div>
  );
}
