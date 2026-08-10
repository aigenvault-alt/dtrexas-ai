import { create } from 'zustand';

const STORAGE_KEY = 'ai-assistant-chats';

function loadChats() { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } }
function saveChats(chats) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(chats)); } catch {} }

let nextId = Date.now();
function generateId() { return `chat_${nextId++}`; }

export const useChatStore = create((set, get) => ({
  conversations: loadChats(),
  activeId: null,
  isLoading: false,
  streamingContent: '',
  abortController: null,
  settingsOpen: false,
  sidebarOpen: true,
  settings: { model: 'llama-3.3-70b-versatile', temperature: 0.7, maxTokens: 8192 },
  getActiveConversation: () => { const { conversations, activeId } = get(); return conversations.find(c => c.id === activeId) || null; },
  setActiveId: (id) => set({ activeId: id }),
  createChat: () => { const chat = { id: generateId(), title: 'New Chat', messages: [], createdAt: Date.now() }; set(state => { const chats = [chat, ...state.conversations]; saveChats(chats); return { conversations: chats, activeId: chat.id }; }); return chat.id; },
  deleteChat: (id) => { set(state => { const chats = state.conversations.filter(c => c.id !== id); saveChats(chats); return { conversations: chats, activeId: state.activeId === id ? (chats[0]?.id || null) : state.activeId }; }); },
  renameChat: (id, title) => { set(state => { const chats = state.conversations.map(c => c.id === id ? { ...c, title } : c); saveChats(chats); return { conversations: chats }; }); },
  clearChat: (id) => { set(state => { const chats = state.conversations.map(c => c.id === id ? { ...c, messages: [], title: 'New Chat' } : c); saveChats(chats); return { conversations: chats }; }); },
  addMessage: (chatId, message) => { set(state => { const chats = state.conversations.map(c => { if (c.id !== chatId) return c; const newMessages = [...c.messages, message]; const title = c.title === 'New Chat' && message.role === 'user' ? message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '') : c.title; return { ...c, messages: newMessages, title }; }); saveChats(chats); return { conversations: chats }; }); },
  editMessage: (chatId, messageId, newContent) => { set(state => { const chats = state.conversations.map(c => { if (c.id !== chatId) return c; const newMessages = c.messages.map(m => m.id === messageId ? { ...m, content: newContent } : m); const idx = newMessages.findIndex(m => m.id === messageId); return { ...c, messages: newMessages.slice(0, idx + 1) }; }); saveChats(chats); return { conversations: chats }; }); },
  setLoading: (isLoading) => set({ isLoading }),
  setStreamingContent: (content) => set({ streamingContent: content }),
  setAbortController: (ctrl) => set({ abortController: ctrl }),
  stopGenerating: () => { const { abortController } = get(); if (abortController) { abortController.abort(); set({ abortController: null, isLoading: false }); } },
  appendToLastAssistant: (chatId, chunk) => { set(state => { const chats = state.conversations.map(c => { if (c.id !== chatId) return c; const msgs = [...c.messages]; const last = msgs[msgs.length - 1]; if (last && last.role === 'assistant') msgs[msgs.length - 1] = { ...last, content: last.content + chunk }; return { ...c, messages: msgs }; }); saveChats(chats); return { conversations: chats, streamingContent: state.streamingContent + chunk }; }); },
  toggleSettings: () => set(s => ({ settingsOpen: !s.settingsOpen })),
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  updateSettings: (partial) => set(s => ({ settings: { ...s.settings, ...partial } })),
}));
