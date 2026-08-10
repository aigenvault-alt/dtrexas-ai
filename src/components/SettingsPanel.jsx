import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, ExternalLink, Server } from 'lucide-react';
import { useChatStore } from '../store.js';

const AVAILABLE_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', provider: 'Meta', desc: 'Best overall performance' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', provider: 'Meta', desc: 'Fastest chat responses' },
  { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B', provider: 'OpenAI', desc: 'Powerful reasoning' },
  { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B', provider: 'OpenAI', desc: 'Fast and capable' },
  { id: 'qwen/qwen3.6-27b', name: 'Qwen 3.6 27B', provider: 'Alibaba', desc: 'Vision-capable' },
  { id: 'groq/compound', name: 'Groq Compound', provider: 'Groq', desc: 'Agentic tool-using' },
  { id: 'groq/compound-mini', name: 'Groq Compound Mini', provider: 'Groq', desc: 'Lightweight agentic' },
  { id: 'allam-2-7b', name: 'Allam 2 7B', provider: 'SDAIA', desc: 'Compact Arabic/English' },
];

export default function SettingsPanel({ onClose }) {
  const { settings, updateSettings, activeId, clearChat, conversations } = useChatStore();
  const [health, setHealth] = useState(null);
  const [testing, setTesting] = useState(false);

  const checkHealth = async () => { setTesting(true); try { const res = await fetch('/api/health'); const data = await res.json(); setHealth({ ok: true, model: data.model }); } catch { setHealth({ ok: false }); } setTesting(false); };
  useEffect(() => { checkHealth(); }, []);

  const activeConv = conversations.find(c => c.id === activeId);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 60, zIndex: 200 }} onClick={onClose}>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 560, maxHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}><h2 style={{ fontSize: 18, fontWeight: 600 }}>Settings</h2><button style={{ padding: 6, borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', display: 'flex' }} onClick={onClose}><X size={20} /></button></div>
        <div style={{ padding: '20px', overflow: 'auto', flex: 1 }}>
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Model</h3>
            {AVAILABLE_MODELS.map(m => (
              <button key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: `1px solid ${settings.model === m.id ? 'var(--accent)' : 'var(--border)'}`, background: 'var(--bg-tertiary)', cursor: 'pointer', textAlign: 'left', marginBottom: 6, boxShadow: settings.model === m.id ? '0 0 0 1px var(--accent-glow)' : 'none' }} onClick={() => updateSettings({ model: m.id })}>
                <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>{m.name}{settings.model === m.id && <Check size={14} color="var(--accent)" />}</div>
                <div style={{ fontSize: 11, color: 'var(--accent)' }}>{m.provider}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.desc}</div>
              </button>
            ))}
          </div>
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Temperature: <span style={{ color: 'var(--accent)' }}>{settings.temperature}</span></h3>
            <input type="range" min="0" max="2" step="0.1" value={settings.temperature} onChange={e => updateSettings({ temperature: parseFloat(e.target.value) })} style={{ width: '100%', accentColor: 'var(--accent)', height: 6 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}><span>Precise (0)</span><span>Creative (2)</span></div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Max Response: <span style={{ color: 'var(--accent)' }}>{settings.maxTokens.toLocaleString()} tokens</span></h3>
            <input type="range" min="256" max="32768" step="256" value={settings.maxTokens} onChange={e => updateSettings({ maxTokens: parseInt(e.target.value) })} style={{ width: '100%', accentColor: 'var(--accent)', height: 6 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}><span>256</span><span>32,768</span></div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Conversation</h3>
            <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--error)', color: 'var(--error)', fontSize: 13, fontWeight: 500, width: '100%' }} onClick={() => { if (activeId && confirm('Clear all messages?')) clearChat(activeId); }} disabled={!activeConv || activeConv.messages.length === 0}><Trash2 size={16} />Clear Current Conversation</button>
          </div>
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>API Status</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: health?.ok ? 'var(--success)' : health === false ? 'var(--error)' : 'var(--text-muted)' }} /><span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{health === null ? 'Checking...' : health.ok ? `Connected - ${health.model}` : 'Disconnected'}</span><button style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-secondary)', border: '1px solid var(--border)' }} onClick={checkHealth} disabled={testing}><Server size={14} />{testing ? 'Testing...' : 'Test'}</button></div>
          </div>
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>Dtrexas AI v1.0 - Powered by Groq API</p>
            <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>Groq Console <ExternalLink size={13} /></a>
          </div>
        </div>
      </div>
    </div>
  );
}
