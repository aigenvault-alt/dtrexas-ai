import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, ImagePlus, X } from 'lucide-react';
import { useChatStore } from '../store.js';

export default function MessageComposer({ chatId, onSubmit, isStreaming, onStop }) {
  const [input, setInput] = useState('');
  const [attachedImages, setAttachedImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const settings = useChatStore(s => s.settings);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [input]);

  const handleSend = () => {
    const trimmed = input.trim();
    if ((!trimmed && attachedImages.length === 0) || isStreaming) return;
    onSubmit(trimmed, attachedImages.map(img => img.dataUrl));
    setInput('');
    setAttachedImages([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const uploadImages = async (files) => {
    setUploadingImage(true);
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          alert(file.name + ' is not an image file.');
          continue;
        }
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch('/api/chat/upload-image', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) {
          setAttachedImages(prev => [...prev, { dataUrl: data.dataUrl, filename: data.filename }]);
        } else {
          alert(data.error || 'Image upload failed');
        }
      }
    } catch (err) {
      alert('Failed to upload image: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePaste = (e) => {
    const items = Array.from(e.clipboardData.items);
    const imageFiles = items
      .filter(item => item.type.startsWith('image/'))
      .map(item => item.getAsFile())
      .filter(Boolean);
    if (imageFiles.length > 0) {
      e.preventDefault();
      uploadImages(imageFiles);
    }
  };

  return (
    <div style={s.wrapper}>
      {attachedImages.length > 0 && (
        <div style={s.imagePreviewRow}>
          {attachedImages.map((img, i) => (
            <div key={i} style={s.imageThumb}>
              <img src={img.dataUrl} alt={img.filename} style={s.thumbImg} />
              <button style={s.removeBtn} onClick={() => setAttachedImages(prev => prev.filter((_, j) => j !== i))} title="Remove">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div style={s.inputRow}>
        <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
          onChange={e => { if (e.target.files.length) uploadImages(Array.from(e.target.files)); e.target.value = ''; }} />
        <button style={{ ...s.iconBtn, opacity: uploadingImage ? 0.5 : 1 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={isStreaming || uploadingImage} title="Attach image">
          <ImagePlus size={20} />
        </button>
        <textarea ref={textareaRef} style={s.textarea}
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown} onPaste={handlePaste}
          placeholder={uploadingImage ? 'Uploading image...' : 'Message Dtrexas AI... (paste images or click the image icon)'}
          rows={1} disabled={isStreaming || uploadingImage} />
        {isStreaming ? (
          <button style={s.stopBtn} onClick={onStop} title="Stop"><Square size={16} fill="currentColor" /></button>
        ) : (
          <button style={{ ...s.sendBtn, opacity: (!input.trim() && attachedImages.length === 0) ? 0.4 : 1 }}
            onClick={handleSend} disabled={!input.trim() && attachedImages.length === 0} title="Send">
            <Send size={16} />
          </button>
        )}
      </div>
      <div style={s.footer}>
        <span style={s.modelBadge}>{settings.model}</span>
        <span style={s.hint}>Enter to send · Shift+Enter for new line · Paste images</span>
      </div>
    </div>
  );
}

const s = {
  wrapper: { padding: '0 16px 12px' },
  imagePreviewRow: { display: 'flex', gap: 8, padding: '8px 0', flexWrap: 'wrap' },
  imageThumb: { position: 'relative', width: 64, height: 64, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-input)' },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  removeBtn: { position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', fontSize: 10 },
  inputRow: { display: 'flex', alignItems: 'flex-end', gap: 8, background: 'var(--bg-input)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '8px 12px' },
  iconBtn: { padding: 8, borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer' },
  textarea: { flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontSize: 14, lineHeight: '20px', color: 'var(--text-primary)', padding: '4px 0', maxHeight: 200, fontFamily: 'inherit' },
  sendBtn: { padding: 8, borderRadius: 'var(--radius-sm)', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: 'none', cursor: 'pointer' },
  stopBtn: { padding: 8, borderRadius: 'var(--radius-sm)', background: 'var(--error)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: 'none', cursor: 'pointer' },
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px 0' },
  modelBadge: { fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 4 },
  hint: { fontSize: 11, color: 'var(--text-muted)' },
};
