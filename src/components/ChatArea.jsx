import React, { useEffect, useRef, useCallback } from 'react';
import MessageBubble from './MessageBubble.jsx';
import EmptyState from './EmptyState.jsx';
import MessageComposer from './MessageComposer.jsx';
import { useChatStore } from '../store.js';

export default function ChatArea({ conversation }) {
  const { addMessage, isLoading, setLoading, abortController, setAbortController, stopGenerating,
    appendToLastAssistant, editMessage, setStreamingContent, createChat, setActiveId, settings } = useChatStore();
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => { scrollToBottom(false); }, [conversation?.messages, scrollToBottom]);
  const streamingContent = useChatStore(s => s.streamingContent);
  useEffect(() => { if (streamingContent) scrollToBottom(true); }, [streamingContent, scrollToBottom]);

  const sendMessage = useCallback(async (content, images) => {
    if (!conversation || isLoading) return;
    const model = settings.model, temperature = settings.temperature, maxTokens = settings.maxTokens;

    const userMsg = { id: 'msg_' + Date.now() + '_u', role: 'user', content: content || '', timestamp: Date.now() };
    if (images && images.length > 0) userMsg.images = images;
    addMessage(conversation.id, userMsg);

    addMessage(conversation.id, { id: 'msg_' + Date.now() + '_a', role: 'assistant', content: '', timestamp: Date.now() });
    setLoading(true); setStreamingContent('');

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const msgs = useChatStore.getState().conversations.find(c => c.id === conversation.id)?.messages || [];
      const apiMessages = msgs
        .filter(m => m.role !== 'assistant' || m.content)
        .map(m => ({ role: m.role, content: m.content }));

      const body = {
        messages: [{ role: 'system', content: 'You are a helpful, intelligent AI assistant.' }, ...apiMessages.slice(-30)],
        model, temperature, max_tokens: maxTokens,
      };
      if (images && images.length > 0) body.images = images;

      const response = await fetch('/api/chat/stream', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'API error (' + response.status + ')');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed?.choices?.[0]?.delta?.content;
              if (delta) appendToLastAssistant(conversation.id, delta);
            } catch {}
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        const errorMsg = err.message || 'An error occurred.';
        useChatStore.setState(state => {
          const chats = state.conversations.map(c => {
            if (c.id !== conversation.id) return c;
            const msgs = [...c.messages];
            const last = msgs[msgs.length - 1];
            if (last && last.role === 'assistant' && !last.content)
              msgs[msgs.length - 1] = { ...last, content: 'Error: ' + errorMsg };
            return { ...c, messages: msgs };
          });
          return { conversations: chats };
        });
      }
    } finally {
      setLoading(false);
      setStreamingContent('');
      setAbortController(null);
    }
  }, [conversation, isLoading, settings, addMessage, setLoading, setAbortController, setStreamingContent, appendToLastAssistant]);

  const handleGenerateImage = useCallback(async (prompt) => {
    if (!conversation || isLoading) return;

    // Add user message showing the prompt
    addMessage(conversation.id, {
      id: 'msg_' + Date.now() + '_u',
      role: 'user',
      content: 'Generate image: ' + prompt,
      timestamp: Date.now()
    });

    setLoading(true);
    try {
      const res = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = await res.json();

      if (data.success && data.images.length > 0) {
        // Add assistant message with the generated image
        addMessage(conversation.id, {
          id: 'msg_' + Date.now() + '_a',
          role: 'assistant',
          content: data.text || 'Here is your generated image:',
          generatedImages: data.images.map(img => img.dataUrl),
          timestamp: Date.now()
        });
      } else {
        addMessage(conversation.id, {
          id: 'msg_' + Date.now() + '_a',
          role: 'assistant',
          content: data.error || 'Failed to generate image.',
          timestamp: Date.now()
        });
      }
    } catch (err) {
      addMessage(conversation.id, {
        id: 'msg_' + Date.now() + '_a',
        role: 'assistant',
        content: 'Error: ' + err.message,
        timestamp: Date.now()
      });
    } finally {
      setLoading(false);
    }
  }, [conversation, isLoading, addMessage, setLoading]);

  const handleRegenerate = useCallback(async () => {
    if (!conversation) return;
    const msgs = conversation.messages;
    const reversed = [...msgs].reverse();
    const lastUserIdx = reversed.findIndex(m => m.role === 'user');
    if (lastUserIdx === -1) return;
    const actualIdx = msgs.length - 1 - lastUserIdx;
    const userMsg = msgs[actualIdx];
    useChatStore.setState(state => {
      const chats = state.conversations.map(c =>
        c.id !== conversation.id ? c : { ...c, messages: c.messages.slice(0, actualIdx + 1) }
      );
      return { conversations: chats };
    });
    setTimeout(() => sendMessage(userMsg.content, userMsg.images), 100);
  }, [conversation, sendMessage]);

  const handleEditMessage = useCallback((messageId, newContent) => {
    if (!conversation) return;
    editMessage(conversation.id, messageId, newContent);
    setTimeout(() => sendMessage(newContent), 100);
  }, [conversation, editMessage, sendMessage]);

  const messages = conversation?.messages || [];
  const showEmpty = !conversation || messages.length === 0;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }} ref={chatContainerRef}>
      {showEmpty ? <EmptyState /> : (
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px', paddingBottom: 8 }}>
          {messages.map((msg, i) => (
            <MessageBubble key={msg.id} message={msg} onEdit={handleEditMessage}
              onRegenerate={handleRegenerate}
              isStreaming={isLoading && i === messages.length - 1 && msg.role === 'assistant'} />
          ))}
          {isLoading && messages[messages.length - 1]?.content === '' && (
            <div style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="dot-wave"><span></span><span></span><span></span></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}
      <MessageComposer chatId={conversation?.id} onSubmit={sendMessage}
        isStreaming={isLoading} onStop={stopGenerating} onGenerateImage={handleGenerateImage} />
    </div>
  );
}
