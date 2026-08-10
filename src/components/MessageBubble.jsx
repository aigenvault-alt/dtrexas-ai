import React, { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Pencil, RotateCcw, Download } from 'lucide-react';

export default function MessageBubble({ message, onEdit, onRegenerate, isStreaming }) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const handleCopy = useCallback(async () => {
    try { await navigator.clipboard.writeText(message.content); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }, [message.content]);

  const handleEditSubmit = () => {
    if (editValue.trim() && editValue !== message.content) onEdit(message.id, editValue.trim());
    setEditing(false);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSubmit(); }
    if (e.key === 'Escape') { setEditing(false); setEditValue(message.content); }
  };

  const handleDownload = async (dataUrl, index) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'generated-image-' + (index + 1) + '.png';
    a.click();
  };

  const hasGenerated = message.generatedImages && message.generatedImages.length > 0;

  return (
    <div style={styles.bubble}>
      {editing ? (
        <div style={styles.editArea}>
          <textarea style={styles.editInput} value={editValue} onChange={e => setEditValue(e.target.value)}
            onKeyDown={handleEditKeyDown} rows={3} autoFocus />
          <div style={styles.editActions}>
            <button style={styles.cancelBtn} onClick={() => { setEditing(false); setEditValue(message.content); }}>Cancel</button>
            <button style={styles.saveBtn} onClick={handleEditSubmit}>Save &amp; Send</button>
          </div>
        </div>
      ) : (
        <>
          {isUser ? (
            <div style={styles.userContent}>
              {message.images && message.images.length > 0 && (
                <div style={styles.attachedImages}>
                  {message.images.map((img, i) => (
                    <img key={i} src={img} alt={'Attached ' + (i + 1)} style={styles.attachedImg} />
                  ))}
                </div>
              )}
              {message.content && <p style={styles.userText}>{message.content}</p>}
            </div>
          ) : (
            <div style={styles.assistantContent}>
              {/* Generated images */}
              {hasGenerated && (
                <div style={styles.generatedImages}>
                  {message.generatedImages.map((img, i) => (
                    <div key={i} style={styles.genImgWrapper}>
                      <img src={img} alt={'Generated ' + (i + 1)} style={styles.genImg} />
                      <button style={styles.downloadBtn} onClick={() => handleDownload(img, i)} title="Download">
                        <Download size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {message.content && (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const code = String(children).replace(/\n$/, '');
                    if (!inline && match) return <CodeBlock language={match[1]} code={code} />;
                    return <code className={className} {...props}>{children}</code>;
                  },
                  a({ children, href, ...props }) {
                    return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
                  },
                }}>{message.content}</ReactMarkdown>
              )}
              {isStreaming && <span style={styles.cursor}>▊</span>}
            </div>
          )}
          {isAssistant && !isStreaming && (
            <div style={styles.actions}>
              <button style={styles.actionBtn} onClick={handleCopy} title="Copy">{copied ? <Check size={14} /> : <Copy size={14} />}</button>
              {!hasGenerated && onRegenerate && <button style={styles.actionBtn} onClick={() => onRegenerate()} title="Regenerate"><RotateCcw size={14} /></button>}
            </div>
          )}
          {isUser && (
            <div style={styles.actions}>
              <button style={styles.actionBtn} onClick={handleCopy} title="Copy">{copied ? <Check size={14} /> : <Copy size={14} />}</button>
              <button style={styles.actionBtn} onClick={() => { setEditing(true); setEditValue(message.content); }} title="Edit"><Pencil size={14} /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {} };
  return (
    <div style={styles.codeBlock}>
      <div style={styles.codeHeader}>
        <span>{language}</span>
        <button style={styles.codeCopyBtn} onClick={handleCopy}>{copied ? <Check size={12} /> : <Copy size={12} />}{copied ? 'Copied' : 'Copy'}</button>
      </div>
      <SyntaxHighlighter style={vscDarkPlus} language={language} PreTag="div" customStyle={{ margin: 0, borderRadius: '0 0 8px 8px', fontSize: 13 }}>{code}</SyntaxHighlighter>
    </div>
  );
}

const styles = {
  bubble: { padding: '12px 0', animation: 'fadeIn 0.3s ease-out' },
  editArea: { display: 'flex', flexDirection: 'column', gap: 8 },
  editInput: { width: '100%', background: 'var(--bg-input)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)', padding: 10, color: 'var(--text-primary)', fontSize: 14, lineHeight: '20px', resize: 'vertical', outline: 'none', fontFamily: 'inherit' },
  editActions: { display: 'flex', gap: 8, justifyContent: 'flex-end' },
  cancelBtn: { padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-secondary)', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' },
  saveBtn: { padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: 12, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' },
  userContent: { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' },
  attachedImages: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  attachedImg: { maxWidth: 200, maxHeight: 200, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', objectFit: 'contain' },
  userText: { margin: 0, fontSize: 14, lineHeight: '22px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  assistantContent: { fontSize: 14, lineHeight: '24px', color: 'var(--text-primary)' },
  generatedImages: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 },
  genImgWrapper: { position: 'relative', display: 'inline-block', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)', maxWidth: 512 },
  genImg: { width: '100%', height: 'auto', display: 'block' },
  downloadBtn: { position: 'absolute', bottom: 8, right: 8, padding: 6, borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' },
  cursor: { color: 'var(--accent)', animation: 'pulse 1s infinite' },
  actions: { display: 'flex', gap: 4, marginTop: 8 },
  actionBtn: { padding: 6, borderRadius: 4, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer' },
  codeBlock: { borderRadius: 'var(--radius-sm)', overflow: 'hidden', margin: '10px 0' },
  codeHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: '#1e1e2e', fontSize: 12, color: 'var(--text-secondary)' },
  codeCopyBtn: { display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, padding: '2px 6px', borderRadius: 4 },
};
