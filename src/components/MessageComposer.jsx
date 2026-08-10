import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, ImagePlus, Wand2, X } from 'lucide-react';
import { useChatStore } from '../store.js';

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDim = 512;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round((height / width) * maxDim); width = maxDim; }
          else { width = Math.round((width / height) * maxDim); height = maxDim; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          const smallReader = new FileReader();
          smallReader.onloadend = () => resolve(smallReader.result);
          smallReader.readAsDataURL(blob);
        }, 'image/jpeg', 0.6);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function MessageComposer({ chatId, onSubmit, isStreaming, onStop, onGenerateImage }) {
  const [input, setInput] = useState('');
  const [attachedImages, setAttachedImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImageGen, setShowImageGen] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const genInputRef = useRef(null);
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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const processImages = async (files) => {
    setUploadingImage(true);
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) { alert(file.name + ' is not an image.'); continue; }
        const compressed = await compressImage(file);
        setAttachedImages(prev => [...prev, { dataUrl: compressed, filename: file.name }]);
      }
    } catch (err) { alert('Failed: ' + err.message); }
    finally { setUploadingImage(false); }
  };

  const handlePaste = (e) => {
    const items = Array.from(e.clipboardData.items);
    const imageFiles = items.filter(i => i.type.startsWith('image/')).map(i => i.getAsFile()).filter(Boolean);
    if (imageFiles.length > 0) { e.preventDefault(); processImages(imageFiles); }
  };

  const handleGenSubmit = () => {
    if (!onGenerateImage || !genInputRef.current) return;
    const prompt = genInputRef.current.value.trim();
    if (!prompt || isStreaming) return;
    onGenerateImage(prompt);
    genInputRef.current.value = '';
    setShowImageGen(false);
  };

  const handleGenKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleGenSubmit(); }
    if (e.key === 'Escape') setShowImageGen(false);
  };

  return (
    <div style={s.wrapper}>
      {/* Image Gen bar */}
      {showImageGen && (
        <div style={s.genBar}>
          <Wand2 size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <input ref={genInputRef} style={s.genInput} placeholder="Describe an image to generate..."
            onKeyDown={handleGenKeyDown} autoFocus />
          <button style={s.genBtn} onClick={handleGenSubmit}>Generate</button>
          <button style={s.genCancel} onClick={() => setShowImageGen(false)}><X size={14} /></button>
        </div>
      )}
      {/* Image previews */}
      {attachedImages.length > 0 && (
        <div style={s.imagePreviewRow}>
          {attachedImages.map((img, i) => (
            <div key={i} style={s.imageThumb}>
              <img src={img.dataUrl} alt={img.filename} style={s.thumbImg} />
              <button style={s.removeBtn} onClick={() => setAttachedImages(prev => prev.filter((_, j) => j !== i))}><X size={12} /></button>
            </div>
          ))}
        </div>
      )}
      <div style={s.inputRow}>
        <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
          onChange={e => { if (e.target.files.length) processImages(Array.from(e.target.files)); e.target.value = ''; }} />
        <button style={{ ...s.iconBtn, opacity: uploadingImage ? 0.5 : 1 }}
          onClick={() => fileInputRef.current?.click()} disabled={isStreaming || uploadingImage} title="Attach image">
          <ImagePlus size={20} />
        </button>
        <button style={{ ...s.iconBtn, opacity: isStreaming ? 0.5 : 1 }}
          onClick={() => setShowImageGen(!showImageGen)} disabled={isStreaming} title="Generate image">
          <Wand2 size={20} />
        </button>
        <textarea ref={textareaRef} style={s.textarea}
          value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} onPaste={handlePaste}
          placeholder={uploadingImage ? 'Processing...' : 'Message Dtrexas AI...'}
          rows={1} disabled={isStreaming || uploadingImage} />
        {isStreaming ? (
          <button style={s.stopBtn} onClick={onStop}><Square size={16} fill="currentColor" /></button>
        ) : (
          <button style={{ ...s.sendBtn, opacity: (!input.trim() && attachedImages.length === 0) ? 0.4 : 1 }}
            onClick={handleSend} disabled={!input.trim() && attachedImages.length === 0}>
            <Send size={16} />
          </button>
        )}
      </div>
      <div style={s.footer}>
        <span style={s.modelBadge}>{settings.model}</span>
        <span style={s.hint}>Enter to send · Paste for images · 🪄 for AI gen</span>
      </div>
    </div>
  );
}

const s = {
  wrapper: { padding: '0 16px 12px' },
  genBar: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--bg-input)', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--accent)', padding: '8px 12px', marginBottom: 8,
  },
  genInput: {
    flex: 1, background: 'none', border: 'none', outline: 'none',
    fontSize: 13, color: 'var(--text-primary)', fontFamily: 'inherit',
  },
  genBtn: {
    padding: '6px 14px', borderRadius: 'var(--radius-sm)',
    background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 600,
    border: 'none', cursor: 'pointer',
  },
  genCancel: {
    padding: 4, borderRadius: 4, color: 'var(--text-muted)',
    background: 'none', border: 'none', cursor: 'pointer', display: 'flex',
  },
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
