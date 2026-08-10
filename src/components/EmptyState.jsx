import React from 'react';
import { Sparkles, Code2, Lightbulb, MessageSquare } from 'lucide-react';

export default function EmptyState() {
  const examples = [
    { icon: <Code2 size={20} />, text: 'Write a Python script to analyze data' },
    { icon: <Lightbulb size={20} />, text: 'Explain quantum computing in simple terms' },
    { icon: <Sparkles size={20} />, text: 'Draft a professional email for a client' },
    { icon: <MessageSquare size={20} />, text: 'Help me debug this error in my code' },
  ];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 }}>
      <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}><Sparkles size={48} color="var(--accent)" /></div>
      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>Dtrexas AI</h1>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 16 }}>Powered by Groq — fast, intelligent responses</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, maxWidth: 600, width: '100%' }}>
        {examples.map((ex, i) => (
          <button key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', cursor: 'pointer', transition: 'var(--transition)', textAlign: 'left' }} onClick={() => { const input = document.querySelector('[data-composer-input]'); if (input) { input.value = ex.text; input.focus(); } }}>
            <span style={{ color: 'var(--accent)', flexShrink: 0 }}>{ex.icon}</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{ex.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
