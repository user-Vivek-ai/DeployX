'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Edit2,
  Copy,
  Check,
  RotateCw,
  Square,
  ArrowUp,
  AlertCircle,
  Key,
  ExternalLink,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Bot,
  User as UserIcon,
  LogOut,
  Layers,
  Code2,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export type AIProviderId = 'openai' | 'gemini' | 'anthropic';

export interface ModelOption {
  provider: AIProviderId;
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  badge?: string;
  keyConfigured?: boolean;
}

export interface ConvoMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  usageTokens?: number;
}

export interface ConversationSummary {
  id: string;
  userId: string;
  title: string;
  provider: AIProviderId;
  model: string;
  createdAt: string;
  updatedAt: string;
  messages: ConvoMessage[];
}

const DEFAULT_MODELS: Record<AIProviderId, ModelOption[]> = {
  openai: [
    {
      provider: 'openai',
      id: 'gpt-4o',
      name: 'GPT-4o',
      description: 'Flagship omni-intelligence for complex reasoning and analysis',
      capabilities: ['text', 'vision', 'reasoning'],
      badge: 'Flagship'
    },
    {
      provider: 'openai',
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      description: 'Affordable, low-latency intelligence for everyday questions',
      capabilities: ['text', 'speed'],
      badge: 'Fast & Efficient'
    },
    {
      provider: 'openai',
      id: 'o1-mini',
      name: 'o1-mini',
      description: 'Specialized reasoning model for coding, STEM, and logic',
      capabilities: ['text', 'deep-reasoning'],
      badge: 'Deep Logic'
    },
    {
      provider: 'openai',
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      description: 'High-capability GPT-4 model with wide context',
      capabilities: ['text'],
      badge: 'Advanced'
    }
  ],
  gemini: [
    {
      provider: 'gemini',
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      description: 'Google’s ultra-fast, cost-effective multimodal model with generous free tier',
      capabilities: ['text', 'multimodal', 'speed'],
      badge: 'Free Tier Friendly'
    },
    {
      provider: 'gemini',
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      description: 'Google’s top-tier model with 1M+ token context and profound reasoning',
      capabilities: ['text', 'multimodal', 'long-context'],
      badge: '1M Context'
    },
    {
      provider: 'gemini',
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      description: 'Next-gen lightning intelligence for real-time applications',
      capabilities: ['text', 'speed'],
      badge: 'Next-Gen'
    }
  ],
  anthropic: [
    {
      provider: 'anthropic',
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      description: 'Anthropic’s smartest model — state-of-the-art coding and nuanced human tone',
      capabilities: ['text', 'coding', 'reasoning'],
      badge: 'Best for Coding'
    },
    {
      provider: 'anthropic',
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      description: 'Instant response time with unmatched speed and concise answers',
      capabilities: ['text', 'speed'],
      badge: 'Lightning Fast'
    },
    {
      provider: 'anthropic',
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      description: 'Powerhouse intelligence for long-form analysis and creative writing',
      capabilities: ['text', 'deep-thinking'],
      badge: 'Deep Thinker'
    }
  ]
};

const PROVIDER_METADATA: Record<
  AIProviderId,
  {
    name: string;
    tagline: string;
    brandColor: string;
    borderActive: string;
    iconText: string;
    envVar: string;
    docsUrl: string;
  }
> = {
  openai: {
    name: 'OpenAI ChatGPT',
    tagline: 'GPT-4o, GPT-4o Mini & Reasoning Models',
    brandColor: 'from-emerald-600 to-teal-500',
    borderActive: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
    iconText: '🟢',
    envVar: 'OPENAI_API_KEY',
    docsUrl: 'https://platform.openai.com/api-keys'
  },
  gemini: {
    name: 'Google Gemini',
    tagline: 'Gemini 1.5 Flash, Pro & 2.0 with Free Quotas',
    brandColor: 'from-blue-600 to-indigo-500',
    borderActive: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
    iconText: '✨',
    envVar: 'GEMINI_API_KEY',
    docsUrl: 'https://aistudio.google.com/app/apikey'
  },
  anthropic: {
    name: 'Anthropic Claude',
    tagline: 'Claude 3.5 Sonnet, Haiku & Opus Intelligence',
    brandColor: 'from-amber-600 to-orange-500',
    borderActive: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
    iconText: '🟣',
    envVar: 'ANTHROPIC_API_KEY',
    docsUrl: 'https://console.anthropic.com/settings/keys'
  }
};

interface UnifiedAIChatProps {
  onSwitchToBuilder?: () => void;
}

export function UnifiedAIChat({ onSwitchToBuilder }: UnifiedAIChatProps) {
  const { user, logout } = useAuth();

  // Active Provider & Model
  const [selectedProvider, setSelectedProvider] = useState<AIProviderId>('gemini');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-1.5-flash');
  const [availableModels, setAvailableModels] = useState<ModelOption[]>(DEFAULT_MODELS.gemini);

  // Conversations
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<ConvoMessage[]>([]);
  const [conversationSearch, setConversationSearch] = useState('');

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configMissingProvider, setConfigMissingProvider] = useState<AIProviderId | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages, isGenerating]);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
    fetchModels();
  }, []);

  // Sync available models when selected provider changes
  useEffect(() => {
    const models = DEFAULT_MODELS[selectedProvider];
    setAvailableModels(models);
    if (!models.some(m => m.id === selectedModel)) {
      setSelectedModel(models[0]?.id || '');
    }
  }, [selectedProvider]);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        if (data.conversations) {
          setConversations(data.conversations);
        }
      }
    } catch {}
  };

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/models');
      if (res.ok) {
        const data = await res.json();
        if (data.models && Array.isArray(data.models)) {
          // Update default models with real config statuses
          const grouped: Record<AIProviderId, ModelOption[]> = {
            openai: [],
            gemini: [],
            anthropic: []
          };
          data.models.forEach((m: any) => {
            const p = m.provider as AIProviderId;
            if (grouped[p]) {
              grouped[p].push({
                provider: p,
                id: m.id,
                name: m.name,
                description: m.description,
                capabilities: m.capabilities || ['text'],
                keyConfigured: m.keyConfigured
              });
            }
          });
          if (grouped.openai.length > 0) DEFAULT_MODELS.openai = grouped.openai;
          if (grouped.gemini.length > 0) DEFAULT_MODELS.gemini = grouped.gemini;
          if (grouped.anthropic.length > 0) DEFAULT_MODELS.anthropic = grouped.anthropic;
          setAvailableModels(DEFAULT_MODELS[selectedProvider]);
        }
      }
    } catch {}
  };

  const selectConversation = async (convo: ConversationSummary) => {
    setActiveConvoId(convo.id);
    setActiveMessages(convo.messages || []);
    if (convo.provider && ['openai', 'gemini', 'anthropic'].includes(convo.provider)) {
      setSelectedProvider(convo.provider as AIProviderId);
    }
    if (convo.model) {
      setSelectedModel(convo.model);
    }
    setErrorMessage(null);
  };

  const startNewChat = () => {
    setActiveConvoId(null);
    setActiveMessages([]);
    setInputPrompt('');
    setErrorMessage(null);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const text = (customPrompt || inputPrompt).trim();
    if (!text || isGenerating) return;

    setErrorMessage(null);
    setInputPrompt('');
    setIsGenerating(true);

    // Optimistic user message
    const userMsg: ConvoMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString()
    };

    const nextMessages = [...activeMessages, userMsg];
    setActiveMessages(nextMessages);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConvoId || undefined,
          message: text,
          provider: selectedProvider,
          model: selectedModel
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.configError) {
          setConfigMissingProvider(selectedProvider);
          setShowConfigModal(true);
        }
        throw new Error(data.error || 'Failed to generate response.');
      }

      const assistantMsg: ConvoMessage = {
        id: `msg_a_${Date.now()}`,
        role: 'assistant',
        content: data.response,
        createdAt: new Date().toISOString(),
        usageTokens: data.usage
      };

      setActiveMessages([...nextMessages, assistantMsg]);

      // Update or set active conversation ID
      if (data.conversationId) {
        setActiveConvoId(data.conversationId);
        // Refresh sidebar conversations
        fetchConversations();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while communicating with the AI model.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    if (activeMessages.length === 0 || isGenerating) return;
    // Find last user message
    const lastUserMsg = [...activeMessages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      // Remove last assistant message if present
      if (activeMessages[activeMessages.length - 1].role === 'assistant') {
        setActiveMessages(prev => prev.slice(0, -1));
      }
      handleSendMessage(lastUserMsg.content);
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConvoId === id) {
        startNewChat();
      }
    } catch {}
  };

  const handleSaveRename = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!renameText.trim()) return;

    try {
      const res = await fetch('/api/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: id,
          title: renameText.trim()
        })
      });

      if (res.ok) {
        setConversations(prev =>
          prev.map(c => (c.id === id ? { ...c, title: renameText.trim() } : c))
        );
        setRenameTargetId(null);
      }
    } catch {}
  };

  const copyMessageContent = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(conversationSearch.toLowerCase())
  );

  const activeProviderMeta = PROVIDER_METADATA[selectedProvider];
  const activeModelMeta =
    availableModels.find(m => m.id === selectedModel) || availableModels[0];

  return (
    <div className="h-[100dvh] flex bg-[#0e0e0e] text-[#f1f1f1] font-sans overflow-hidden select-none">
      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR (ChatGPT / Claude / Gemini Hybrid Navigation) */}
      {/* ========================================================================= */}
      <aside
        className={`bg-[#141414] border-r border-white/5 flex flex-col transition-all duration-200 z-30 flex-shrink-0 ${
          isSidebarOpen ? 'w-72' : 'w-0 overflow-hidden'
        }`}
      >
        {/* Top Brand & Actions */}
        <div className="p-3.5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Close sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center font-extrabold text-white text-xs shadow-md shadow-brand-600/30">
                X
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-white">DeployX</span>
                <span className="ml-1 text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                  AI Hub
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={startNewChat}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Start new chat"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Primary Button */}
        <div className="p-3">
          <button
            onClick={startNewChat}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-brand-600/20 flex items-center justify-between transition-all active:scale-[0.98]"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>New Conversation</span>
            </span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">⌘N</span>
          </button>
        </div>

        {/* Mode Switcher: AI Chat vs Web Builder */}
        {onSwitchToBuilder && (
          <div className="px-3 pb-2">
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#1c1c1c] rounded-xl border border-white/5 text-[11px] font-semibold">
              <button
                className="py-1 px-2 rounded-lg bg-white/10 text-white shadow-sm flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>Multi-AI</span>
              </button>
              <button
                onClick={onSwitchToBuilder}
                className="py-1 px-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-center gap-1.5 transition-colors"
                title="Switch to Web App Synthesis & Artifacts"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Web Builder</span>
              </button>
            </div>
          </div>
        )}

        {/* Provider Quick Switcher Tabs */}
        <div className="px-3 py-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Active Intelligence
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#1b1b1b] rounded-xl border border-white/5">
            <button
              onClick={() => setSelectedProvider('openai')}
              className={`py-1.5 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${
                selectedProvider === 'openai'
                  ? 'bg-[#262626] text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>🟢</span>
              <span>ChatGPT</span>
            </button>
            <button
              onClick={() => setSelectedProvider('gemini')}
              className={`py-1.5 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${
                selectedProvider === 'gemini'
                  ? 'bg-[#262626] text-blue-400 border border-blue-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>✨</span>
              <span>Gemini</span>
            </button>
            <button
              onClick={() => setSelectedProvider('anthropic')}
              className={`py-1.5 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${
                selectedProvider === 'anthropic'
                  ? 'bg-[#262626] text-amber-400 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>🟣</span>
              <span>Claude</span>
            </button>
          </div>
        </div>

        {/* Search Conversations */}
        <div className="px-3 pt-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={conversationSearch}
              onChange={e => setConversationSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-[#1b1b1b] border border-white/5 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-white/15"
            />
          </div>
        </div>

        {/* Conversations History List */}
        <div className="mt-3 px-3.5 flex items-center justify-between text-[11px] font-semibold text-slate-500">
          <span>Conversations ({filteredConversations.length})</span>
        </div>

        <div className="flex-grow overflow-y-auto px-2 py-1 space-y-0.5">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 px-4 text-xs text-slate-500">
              <MessageSquare className="w-5 h-5 mx-auto mb-2 opacity-30" />
              <p>No conversations yet</p>
              <p className="text-[10px] text-slate-600 mt-1">Start chatting with ChatGPT, Gemini or Claude.</p>
            </div>
          ) : (
            filteredConversations.map(convo => {
              const isSelected = activeConvoId === convo.id;
              const isRenaming = renameTargetId === convo.id;

              return (
                <div
                  key={convo.id}
                  onClick={() => selectConversation(convo)}
                  className={`group relative w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-white/10 text-white font-medium border border-white/5'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {isRenaming ? (
                    <form
                      onSubmit={e => handleSaveRename(convo.id, e)}
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1 w-full"
                    >
                      <input
                        autoFocus
                        type="text"
                        value={renameText}
                        onChange={e => setRenameText(e.target.value)}
                        className="w-full bg-[#242424] px-2 py-0.5 rounded text-xs text-white border border-brand-500 outline-none"
                      />
                      <button
                        type="submit"
                        className="p-1 rounded bg-brand-600 text-white hover:bg-brand-500"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="text-[11px]">
                          {convo.provider === 'openai' ? '🟢' : convo.provider === 'gemini' ? '✨' : '🟣'}
                        </span>
                        <span className="truncate">{convo.title || 'Untitled Chat'}</span>
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setRenameTargetId(convo.id);
                            setRenameText(convo.title);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={e => handleDeleteConversation(convo.id, e)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-white/10"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* User Profile Bar */}
        <div className="p-3 border-t border-white/5 relative">
          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-2.5 truncate">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Developer'}</p>
                <p className="text-[10px] text-slate-400">DeployX Unified AI</p>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {showUserMenu && (
            <div className="absolute bottom-16 left-3 right-3 bg-[#242424] border border-white/10 rounded-2xl shadow-2xl p-1.5 space-y-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-white/5">
                <p className="text-xs font-bold text-white">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setConfigMissingProvider(selectedProvider);
                  setShowConfigModal(true);
                  setShowUserMenu(false);
                }}
                className="w-full px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/5 rounded-xl transition-colors flex items-center gap-2 text-left"
              >
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>API Keys & Configuration</span>
              </button>
              <button
                onClick={logout}
                className="w-full px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors flex items-center gap-2 text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN CHAT AREA */}
      {/* ========================================================================= */}
      <div className="flex-grow flex flex-col h-full overflow-hidden relative">
        {/* Top Header with Model Picker Pill & Actions */}
        <header className="h-14 px-4 border-b border-white/5 flex items-center justify-between bg-[#121212] flex-shrink-0 z-20">
          <div className="flex items-center space-x-3">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Open sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Model Selector Pill Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white flex items-center gap-2 transition-all shadow-sm"
              >
                <span className="text-xs">{activeProviderMeta.iconText}</span>
                <span className="font-bold">{activeModelMeta?.name || selectedModel}</span>
                <span className="text-[10px] text-slate-400 border-l border-white/10 pl-2">
                  {activeProviderMeta.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Model Picker Dropdown Panel */}
              {showModelPicker && (
                <div className="absolute top-12 left-0 w-80 sm:w-96 bg-[#212121] border border-white/15 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Provider & Model
                  </div>

                  {/* Provider Tabs inside modal */}
                  <div className="grid grid-cols-3 gap-1 p-1 bg-[#161616] rounded-xl mb-2">
                    {(['openai', 'gemini', 'anthropic'] as AIProviderId[]).map(p => (
                      <button
                        key={p}
                        onClick={() => setSelectedProvider(p)}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                          selectedProvider === p
                            ? PROVIDER_METADATA[p].borderActive + ' border shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {p === 'openai' ? 'ChatGPT' : p === 'gemini' ? 'Gemini' : 'Claude'}
                      </button>
                    ))}
                  </div>

                  {/* Models List for Selected Provider */}
                  <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                    {availableModels.map(model => {
                      const isModelActive = selectedModel === model.id;
                      return (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model.id);
                            setShowModelPicker(false);
                          }}
                          className={`w-full p-2.5 rounded-xl text-left transition-colors flex items-start justify-between gap-2 ${
                            isModelActive
                              ? 'bg-brand-500/15 border border-brand-500/40 text-white'
                              : 'hover:bg-white/5 text-slate-300'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{model.name}</span>
                              {model.badge && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300 font-semibold border border-white/5">
                                  {model.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 leading-tight">
                              {model.description}
                            </p>
                          </div>
                          {isModelActive && <Check className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Header Status & Keys Info */}
          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => {
                setConfigMissingProvider(selectedProvider);
                setShowConfigModal(true);
              }}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[11px] flex items-center gap-1.5 border border-white/5 transition-colors"
              title="API Key Status"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">API Setup</span>
            </button>

            {onSwitchToBuilder && (
              <button
                onClick={onSwitchToBuilder}
                className="px-3 py-1 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-brand-600/30 transition-all flex items-center gap-1.5"
                title="Switch to Web App Synthesis & Live Artifact Preview"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Web Builder</span>
              </button>
            )}
          </div>
        </header>

        {/* Free Tier Notice Banner */}
        <div className="bg-[#171717] border-b border-white/5 px-4 py-1.5 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
            <span>
              Connected to <strong>{activeProviderMeta.name}</strong> official API. Usage respects your server API key quotas.
            </span>
          </div>
          <span className="text-[10px] text-slate-500 hidden md:inline">
            Same-tab workspace • No external redirects
          </span>
        </div>

        {/* ========================================================================= */}
        {/* VIEW A: WELCOME SCREEN (When Conversation is Empty) */}
        {/* ========================================================================= */}
        {activeMessages.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="max-w-2xl w-full space-y-6 text-center">
              {/* Centered Heading */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>One Platform. Multiple Intelligence.</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Welcome to <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">DeployX</span>
                </h1>
                <p className="text-sm text-slate-400 max-w-lg mx-auto">
                  Choose your favourite AI model and turn your ideas into reality. Instant access to ChatGPT, Gemini, and Claude inside one unified interface.
                </p>
              </div>

              {/* Provider Showcase Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
                <div
                  onClick={() => {
                    setSelectedProvider('openai');
                    setSelectedModel('gpt-4o');
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    selectedProvider === 'openai'
                      ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30'
                      : 'bg-[#181818] border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">🟢</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                      GPT-4o
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white">ChatGPT</h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Industry standard for conversational problem solving and general knowledge.
                  </p>
                </div>

                <div
                  onClick={() => {
                    setSelectedProvider('gemini');
                    setSelectedModel('gemini-1.5-flash');
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    selectedProvider === 'gemini'
                      ? 'bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/30'
                      : 'bg-[#181818] border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">✨</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                      Free Tier
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white">Google Gemini</h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Multimodal speed, long context and cost-effective official Google API access.
                  </p>
                </div>

                <div
                  onClick={() => {
                    setSelectedProvider('anthropic');
                    setSelectedModel('claude-3-5-sonnet-20241022');
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    selectedProvider === 'anthropic'
                      ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
                      : 'bg-[#181818] border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">🟣</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                      Sonnet 3.5
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white">Claude</h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Anthropic’s benchmark coding, reasoning and human-grade writing.
                  </p>
                </div>
              </div>

              {/* Quick Starter Prompts */}
              <div className="pt-2">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Suggested Questions & Prompts
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {[
                    'Explain quantum computing in simple terms with an everyday analogy.',
                    'Write a production-grade TypeScript debounce function with unit tests.',
                    'Compare OpenAI GPT-4o, Google Gemini, and Claude Sonnet for software engineering.',
                    'Review my startup architecture: Next.js + Tailwind + Serverless APIs.',
                    'Give me 5 creative, high-potential SaaS startup ideas with target markets.',
                    'Help me optimize database indexes for a high-traffic e-commerce checkout.'
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(chip)}
                      className="px-3.5 py-1.5 rounded-full text-xs bg-[#1a1a1a] hover:bg-[#252525] border border-white/5 hover:border-white/15 text-slate-300 hover:text-white transition-all text-left active:scale-95"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW B: CONVERSATION MESSAGE FEED */
          /* ========================================================================= */
          <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {activeMessages.map(msg => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 text-xs leading-relaxed ${
                      isUser ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm ${
                        isUser
                          ? 'bg-[#2b2b2b] text-white border border-white/10'
                          : selectedProvider === 'openai'
                          ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white'
                          : selectedProvider === 'gemini'
                          ? 'bg-gradient-to-tr from-blue-600 to-indigo-500 text-white'
                          : 'bg-gradient-to-tr from-amber-600 to-orange-500 text-white'
                      }`}
                    >
                      {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                        isUser
                          ? 'bg-[#272727] text-white rounded-tr-none border border-white/5'
                          : 'bg-[#181818] text-slate-200 rounded-tl-none border border-white/5 space-y-2'
                      }`}
                    >
                      {/* Assistant Header Badge */}
                      {!isUser && (
                        <div className="flex items-center justify-between pb-1 border-b border-white/5 text-[10px] text-slate-400 font-medium">
                          <span className="flex items-center gap-1.5">
                            <span>{activeProviderMeta.iconText}</span>
                            <span className="font-semibold text-slate-200">{activeModelMeta?.name}</span>
                          </span>
                          {msg.usageTokens && (
                            <span className="text-[10px] text-slate-500">
                              {msg.usageTokens} tokens
                            </span>
                          )}
                        </div>
                      )}

                      {/* Content */}
                      {isUser ? (
                        <p className="whitespace-pre-wrap text-xs sm:text-[13px] leading-relaxed">
                          {msg.content}
                        </p>
                      ) : (
                        <MarkdownRenderer content={msg.content} />
                      )}

                      {/* Message Actions */}
                      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/5 text-[11px] text-slate-500">
                        <button
                          onClick={() => copyMessageContent(msg.id, msg.content)}
                          className="flex items-center gap-1 hover:text-white transition-colors"
                          title="Copy response"
                        >
                          {copiedMsgId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        {!isUser && (
                          <button
                            onClick={handleRegenerate}
                            disabled={isGenerating}
                            className="flex items-center gap-1 hover:text-white transition-colors disabled:opacity-40"
                            title="Regenerate response"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                            <span>Regenerate</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Generating / Typing Indicator */}
              {isGenerating && (
                <div className="flex gap-3 text-xs leading-relaxed animate-in fade-in duration-150">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 animate-pulse ${
                      selectedProvider === 'openai'
                        ? 'bg-emerald-600 text-white'
                        : selectedProvider === 'gemini'
                        ? 'bg-blue-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-4 bg-[#181818] rounded-2xl rounded-tl-none border border-white/5 text-slate-300 space-y-1">
                    <div className="flex items-center space-x-2 text-brand-400 font-semibold text-xs">
                      <div className="w-2 h-2 rounded-full bg-brand-400 animate-ping" />
                      <span>{activeModelMeta.name} is thinking...</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Querying official {activeProviderMeta.name} API.
                    </p>
                  </div>
                </div>
              )}

              {/* Error Banner inside feed */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">{errorMessage}</p>
                    <button
                      onClick={() => {
                        setConfigMissingProvider(selectedProvider);
                        setShowConfigModal(true);
                      }}
                      className="text-[11px] underline hover:text-white"
                    >
                      Click here to check API key configuration instructions →
                    </button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. MESSAGE COMPOSER BAR */}
        {/* ========================================================================= */}
        <div className="p-4 bg-[#121212] border-t border-white/5 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="bg-[#1e1e1e] border border-white/10 focus-within:border-brand-500/50 rounded-2xl p-2.5 transition-all shadow-xl space-y-2">
              <textarea
                ref={textareaRef}
                rows={3}
                value={inputPrompt}
                onChange={e => setInputPrompt(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isGenerating}
                placeholder={`Ask ${activeModelMeta.name} anything... (Enter to send, Shift+Enter for new line)`}
                className="w-full bg-transparent px-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none resize-none leading-relaxed disabled:opacity-50"
              />

              <div className="flex items-center justify-between pt-1 border-t border-white/5 px-1">
                {/* Active Model Indicator Tag */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs">{activeProviderMeta.iconText}</span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {activeModelMeta.name}
                  </span>
                </div>

                {/* Send / Stop Buttons */}
                <div className="flex items-center space-x-2">
                  {isGenerating ? (
                    <button
                      type="button"
                      onClick={() => setIsGenerating(false)}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition-all"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendMessage()}
                      disabled={!inputPrompt.trim() || isGenerating}
                      className="w-8 h-8 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-md active:scale-95"
                      title="Send message"
                    >
                      <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center mt-2 text-[10px] text-slate-500">
              DeployX provides a unified interface to OpenAI, Google Gemini, and Anthropic Claude APIs.
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. API CONFIGURATION INSTRUCTIONS MODAL */}
      {/* ========================================================================= */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#1e1e1e] border border-white/15 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">API Keys Configuration</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              DeployX connects directly to the official provider APIs on the server. Your API keys are kept securely on the backend in environment variables and are never sent to browser code.
            </p>

            <div className="space-y-3">
              {/* OpenAI Key */}
              <div className="p-3 rounded-2xl bg-[#141414] border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                    <span>🟢</span> OpenAI ChatGPT
                  </span>
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-brand-400 hover:underline flex items-center gap-1"
                  >
                    <span>Get Key</span> <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <code className="block font-mono text-[11px] text-slate-300 bg-black/40 px-2 py-1 rounded">
                  OPENAI_API_KEY
                </code>
              </div>

              {/* Gemini Key */}
              <div className="p-3 rounded-2xl bg-[#141414] border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-blue-400 flex items-center gap-1.5">
                    <span>✨</span> Google Gemini (Free Tier)
                  </span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-brand-400 hover:underline flex items-center gap-1"
                  >
                    <span>Get Key</span> <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <code className="block font-mono text-[11px] text-slate-300 bg-black/40 px-2 py-1 rounded">
                  GEMINI_API_KEY
                </code>
              </div>

              {/* Claude Key */}
              <div className="p-3 rounded-2xl bg-[#141414] border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-400 flex items-center gap-1.5">
                    <span>🟣</span> Anthropic Claude
                  </span>
                  <a
                    href="https://console.anthropic.com/settings/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-brand-400 hover:underline flex items-center gap-1"
                  >
                    <span>Get Key</span> <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <code className="block font-mono text-[11px] text-slate-300 bg-black/40 px-2 py-1 rounded">
                  ANTHROPIC_API_KEY
                </code>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-[11px] text-brand-300 space-y-1">
              <strong>How to add these to Vercel:</strong>
              <p className="text-slate-300">
                Go to your Vercel Dashboard → Select <strong>deployx-project</strong> → <strong>Settings</strong> → <strong>Environment Variables</strong> → Add the keys above, then trigger a redeploy.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
