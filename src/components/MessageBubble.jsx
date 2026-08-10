import React, { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Pencil, RotateCcw } from 'lucide-react';

export default function MessageBubble({ message, onEdit, onRegenerate, isStreaming }) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const handleCopy = useCallback(async () => { try { await navigator.clipboard.writeText(message.content); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {} }, [message.content]);
  const handleEditSubmit = () => { if (editValue.trim() && editValue !== message.content) onEdit(message.id, editValue.trim()); setEditing(false); };
  const handleEditKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSubmit(); } if (e.key === 'Escape') { setEditing(false); setEditValue(message.content); } };

  return (
    <div style={{ display: 'flex', marginBottom: 8, animation: 'fadeIn 0.25s ease-out', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-lg)', position: 'relative', maxWidth: isUser ? '75%' : '100%', background: isUser ? 'var(--accent)' : 'transparent', color: isUser ? '#fff' : 'var(--text-primary)', borderBottomRightRadius: isUser ? 4 : 'var(--radius-lg)', borderBottomLeftRadius: isUser ? 'var(--radius-lg)' : 4, paddingLeft: isUser ? 16 : 0 }}>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <textarea style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', color: '#fff', fontSize: 14, resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5 }} value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={handleEditKeyDown} rows={3} autoFocus />
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}><button style={{ padding: '4px 12px', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'rgba(255,255,255,0.7)' }} onClick={() => { setEditing(false); setEditValue(message.content); }}>Cancel</button><button style={{ padding: '4px 14px', borderRadius: 'var(--radius-sm)', fontSize: 12, background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }} onClick={handleEditSubmit}>Save & Send</button></div>
          </div>
        ) : (
          <>
            {isUser ? <div style={{ fontSize: 14.5, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{message.content}</div> : (
              <div style={{ fontSize: 14.5, lineHeight: 1.7 }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code({ node, inline, className, children, ...props }) { const match = /language-(\w+)/.exec(className || ''); const codeContent = String(children).replace(/\n$/, ''); if (!inline && match) return <CodeBlock language={match[1]} code={codeContent} />; if (!inline) return <CodeBlock language="text" code={codeContent} />; return <code className={className} {...props}>{children}</code>; }, a({ children, href, ...props }) { return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>; } }}>{message.content}</ReactMarkdown>
                {isStreaming && <span style={{ display: 'inline-block', animation: 'pulse 0.8s infinite', color: 'var(--accent)', fontWeight: 'bold', fontSize: 16, marginLeft: 2 }}>▊</span>}
              </div>
            )}
            {isAssistant && !isStreaming && <div style={{ display: 'flex', gap: 2, marginTop: 6, opacity: 0.5 }}><button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 6px', borderRadius: 4, color: 'var(--text-muted)', fontSize: 12 }} onClick={handleCopy} title="Copy">{copied ? <Check size={15} /> : <Copy size={15} />}</button><button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 6px', borderRadius: 4, color: 'var(--text-muted)', fontSize: 12 }} onClick={() => onRegenerate && onRegenerate()} title="Regenerate"><RotateCcw size={15} /></button></div>}
            {isUser && <div style={{ display: 'flex', gap: 2, marginTop: 6, opacity: 0.5 }}><button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 6px', borderRadius: 4, color: 'var(--text-muted)', fontSize: 12 }} onClick={handleCopy} title="Copy">{copied ? <Check size={14} /> : <Copy size={14} />}</button><button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 6px', borderRadius: 4, color: 'var(--text-muted)', fontSize: 12 }} onClick={() => { setEditing(true); setEditValue(message.content); }} title="Edit"><Pencil size={14} /></button></div>}
          </>
        )}
      </div>
    </div>
  );
}

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {} };
  return (
    <div style={{ margin: '10px 0', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)' }}><span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{language}</span><button style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', padding: '3px 8px', borderRadius: 4, fontSize: 11 }} onClick={handleCopy}>{copied ? <Check size={13} /> : <Copy size={13} />}<span style={{ fontSize: 11 }}>{copied ? 'Copied' : 'Copy'}</span></button></div>
      <SyntaxHighlighter style={vscDarkPlus} language={language} PreTag="div" customStyle={{ margin: 0, borderRadius: '0 0 var(--radius-sm) var(--radius-sm)', fontSize: 13, padding: '14px 16px', background: '#0d0d14' }}>{code}</SyntaxHighlighter>
    </div>
  );
}
