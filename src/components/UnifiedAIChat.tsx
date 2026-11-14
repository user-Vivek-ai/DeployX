'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Copy,
  Check,
  RotateCw,
  ArrowUp,
  AlertCircle,
  Paperclip,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Layers,
  Sparkles,
  Bot,
  User as UserIcon,
  Sun,
  Moon,
  Presentation,
  Globe,
  Table,
  FileText,
  Square,
  Search
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export interface ConvoMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ConvoMessage[];
}

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  content: string;
}

interface UnifiedAIChatProps {
  onSwitchToBuilder?: () => void;
}

export function UnifiedAIChat({ onSwitchToBuilder }: UnifiedAIChatProps) {
  const { user, logout } = useAuth();

  // State
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<ConvoMessage[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages, isGenerating]);

  // Load previous conversations
  useEffect(() => {
    fetchConversations();
  }, []);

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

  const selectConversation = (convo: ConversationSummary) => {
    setActiveConvoId(convo.id);
    setActiveMessages(convo.messages || []);
    setErrorMessage(null);
  };

  const startNewChat = () => {
    setActiveConvoId(null);
    setActiveMessages([]);
    setInputPrompt('');
    setAttachedFiles([]);
    setErrorMessage(null);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      const isText = file.type.startsWith('text/') ||
        file.name.endsWith('.js') ||
        file.name.endsWith('.ts') ||
        file.name.endsWith('.tsx') ||
        file.name.endsWith('.html') ||
        file.name.endsWith('.css') ||
        file.name.endsWith('.json') ||
        file.name.endsWith('.py') ||
        file.name.endsWith('.csv') ||
        file.name.endsWith('.md');

      if (isText) {
        reader.onload = ev => {
          setAttachedFiles(prev => [
            ...prev,
            {
              name: file.name,
              size: file.size,
              type: file.type || 'text/plain',
              content: (ev.target?.result as string) || ''
            }
          ]);
        };
        reader.readAsText(file);
      } else {
        // Binary / image / PDF: capture basic details and base64 preview
        reader.onload = ev => {
          setAttachedFiles(prev => [
            ...prev,
            {
              name: file.name,
              size: file.size,
              type: file.type || 'application/octet-stream',
              content: `[File Attachment: ${file.name} (${Math.round(file.size / 1024)} KB)]`
            }
          ]);
        };
        reader.readAsDataURL(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (idx: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const text = (customPrompt || inputPrompt).trim();
    if ((!text && attachedFiles.length === 0) || isGenerating) return;

    setErrorMessage(null);
    setInputPrompt('');
    const filesToSend = [...attachedFiles];
    setAttachedFiles([]);
    setIsGenerating(true);

    const userMsg: ConvoMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: text + (filesToSend.length > 0 ? `\n\n*(Attached ${filesToSend.length} file: ${filesToSend.map(f => f.name).join(', ')})*` : ''),
      createdAt: new Date().toISOString()
    };

    const nextMessages = [...activeMessages, userMsg];
    setActiveMessages(nextMessages);

    try {
      abortControllerRef.current = new AbortController();

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          conversationId: activeConvoId || undefined,
          message: text,
          attachments: filesToSend
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate response.');
      }

      const assistantMsg: ConvoMessage = {
        id: `msg_a_${Date.now()}`,
        role: 'assistant',
        content: data.response,
        createdAt: new Date().toISOString()
      };

      setActiveMessages([...nextMessages, assistantMsg]);

      if (data.conversationId) {
        setActiveConvoId(data.conversationId);
        fetchConversations();
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Generation stopped by user
        return;
      }
      setErrorMessage(err.message || 'Error communicating with AI service.');
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    if (activeMessages.length === 0 || isGenerating) return;
    const lastUserMsg = [...activeMessages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  const filteredConversations = conversations.filter(c =>
    (c.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLight = themeMode === 'light';

  return (
    <div className={`h-[100dvh] flex font-sans overflow-hidden select-none transition-colors duration-150 ${
      isLight ? 'bg-[#FAF9F5] text-[#2D2A26]' : 'bg-[#1E1E1E] text-[#E8E8E8]'
    }`}>
      {/* ========================================================================= */}
      {/* 1. CLAUDE-INSPIRED LEFT SIDEBAR */}
      {/* ========================================================================= */}
      <aside
        className={`border-r flex flex-col transition-all duration-200 z-30 flex-shrink-0 ${
          isLight ? 'bg-[#F3F1EB] border-[#E8E5DD]' : 'bg-[#181818] border-white/5'
        } ${isSidebarOpen ? 'w-64 sm:w-72' : 'w-0 overflow-hidden'}`}
      >
        {/* Top Header */}
        <div className={`p-3.5 border-b flex items-center justify-between ${
          isLight ? 'border-[#E8E5DD]' : 'border-white/5'
        }`}>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className={`p-1.5 rounded-lg transition-colors ${
                isLight ? 'text-slate-600 hover:text-black hover:bg-black/5' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Close sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className={`font-extrabold text-sm tracking-tight flex items-center gap-1.5 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <span className="w-5 h-5 rounded-md bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white text-[11px] font-bold">
                D
              </span>
              <span>DeployX</span>
            </span>
          </div>

          <button
            onClick={startNewChat}
            className={`p-1.5 rounded-lg transition-colors ${
              isLight ? 'text-slate-600 hover:text-black hover:bg-black/5' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Start new chat"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Primary "+ New Chat" Button */}
        <div className="p-3">
          <button
            onClick={startNewChat}
            className={`w-full py-2.5 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all shadow-sm ${
              isLight
                ? 'bg-white hover:bg-[#FAF9F5] border-[#E0DCD3] text-slate-900 shadow-slate-200/50'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-brand-600" />
              <span>New chat</span>
            </span>
            <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>⌘N</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="px-3 pb-1">
          <div className="relative">
            <Search className={`w-3.5 h-3.5 absolute left-2.5 top-2.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className={`w-full text-xs pl-8 pr-2.5 py-1.5 rounded-xl border outline-none transition-colors ${
                isLight
                  ? 'bg-white border-[#E0DCD3] text-slate-800 placeholder:text-slate-400 focus:border-brand-500'
                  : 'bg-[#202020] border-white/5 text-white placeholder:text-slate-500 focus:border-white/20'
              }`}
            />
          </div>
        </div>

        {/* Recent Conversations List */}
        <div className="px-3.5 pt-3 pb-1 flex items-center justify-between text-[11px] font-semibold text-slate-400">
          <span>Recent chats</span>
        </div>

        <div className="flex-grow overflow-y-auto px-2 space-y-0.5">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 px-4 text-xs text-slate-400">
              <MessageSquare className="w-5 h-5 mx-auto mb-2 opacity-30" />
              <p>No chat history</p>
              <p className="text-[10px] mt-1 text-slate-400">Your conversations will be saved here.</p>
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
                      ? isLight ? 'bg-white text-slate-900 font-semibold shadow-sm' : 'bg-white/10 text-white font-medium'
                      : isLight ? 'text-slate-700 hover:bg-black/5 hover:text-black' : 'text-slate-300 hover:bg-white/5 hover:text-white'
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
                        className="w-full px-2 py-0.5 rounded text-xs border border-brand-500 outline-none bg-white text-black"
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
                      <span className="truncate pr-2">{convo.title || 'Untitled conversation'}</span>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setRenameTargetId(convo.id);
                            setRenameText(convo.title);
                          }}
                          className="p-1 rounded hover:bg-black/10 text-slate-500 hover:text-black"
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={e => handleDeleteConversation(convo.id, e)}
                          className="p-1 rounded hover:bg-rose-500/10 text-slate-500 hover:text-rose-500"
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

        {/* User Account & Theme Bar */}
        <div className={`p-3 border-t flex items-center justify-between ${
          isLight ? 'border-[#E8E5DD]' : 'border-white/5'
        }`}>
          <div className="flex items-center space-x-2.5 truncate">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <p className={`text-xs font-semibold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setThemeMode(isLight ? 'dark' : 'light')}
              className={`p-1.5 rounded-lg transition-colors ${
                isLight ? 'text-slate-500 hover:text-black hover:bg-black/5' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title={`Switch to ${isLight ? 'Dark' : 'Light'} theme`}
            >
              {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN SPACIOUS CONVERSATION CANVAS */}
      {/* ========================================================================= */}
      <div className="flex-grow flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <header className={`h-12 px-4 border-b flex items-center justify-between flex-shrink-0 z-20 ${
          isLight ? 'bg-[#FAF9F5] border-[#E8E5DD]' : 'bg-[#1E1E1E] border-white/5'
        }`}>
          <div className="flex items-center space-x-3">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isLight ? 'text-slate-600 hover:text-black hover:bg-black/5' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title="Open sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <span className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>DeployX Assistant</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 border border-brand-500/20 font-medium">
              Autonomous Intelligence
            </span>
          </div>

          {onSwitchToBuilder && (
            <button
              onClick={onSwitchToBuilder}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isLight
                  ? 'bg-white hover:bg-[#F3F1EB] border-[#E0DCD3] text-slate-700'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white'
              }`}
              title="Switch to Autonomous Web Builder"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Web Builder</span>
            </button>
          )}
        </header>

        {/* ========================================================================= */}
        {/* VIEW A: CLAUDE-INSPIRED WELCOME SCREEN (When Conversation is Empty) */}
        {/* ========================================================================= */}
        {activeMessages.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="max-w-xl w-full space-y-6 text-center">
              {/* Friendly Claude-Style Greeting */}
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-brand-600/30 mx-auto">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h1 className={`text-2xl sm:text-3xl font-serif tracking-tight ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  {getGreeting()}, <span className="italic">{firstName}</span>
                </h1>
                <p className={`text-xs sm:text-sm max-w-md mx-auto leading-relaxed ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  What would you like DeployX to generate or explore today?
                </p>
              </div>

              {/* Starter Action Cards (PPTX, DOCX, XLSX, Web App) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left pt-2">
                {[
                  {
                    icon: <Presentation className="w-4 h-4 text-amber-500" />,
                    title: 'PowerPoint Presentation',
                    desc: 'Create an authentic 10-slide PPTX deck on Artificial Intelligence.',
                    prompt: 'Create a professional PowerPoint presentation about Artificial Intelligence with 10 slides, complete with title, key takeaways, and structured slide contents.'
                  },
                  {
                    icon: <Globe className="w-4 h-4 text-indigo-500" />,
                    title: 'Interactive Website',
                    desc: 'Generate a modern portfolio or SaaS landing page with live preview.',
                    prompt: 'Build a modern, responsive personal portfolio website with a dark theme hero, projects showcase, skills grid, and an interactive contact form.'
                  },
                  {
                    icon: <Table className="w-4 h-4 text-emerald-500" />,
                    title: 'Excel Financial Model',
                    desc: 'Generate a downloadable spreadsheet with revenue and churn formulas.',
                    prompt: 'Create a comprehensive Excel spreadsheet for a 2026 SaaS financial model with quarterly revenue projections, customer acquisition cost, and gross margins.'
                  },
                  {
                    icon: <FileText className="w-4 h-4 text-blue-500" />,
                    title: 'Professional Document',
                    desc: 'Synthesize an executive whitepaper or technical architecture report.',
                    prompt: 'Create a professional Word document (.docx) providing a comprehensive architecture overview of modern autonomous agentic AI software systems.'
                  }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.prompt)}
                    className={`p-3.5 rounded-2xl border text-left transition-all active:scale-[0.99] space-y-1 ${
                      isLight
                        ? 'bg-white hover:bg-[#F3F1EB] border-[#E5E1D8] shadow-sm shadow-slate-200/50'
                        : 'bg-[#242424] hover:bg-[#2b2b2b] border-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {item.icon}
                      <p className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.title}</p>
                    </div>
                    <p className={`text-[11px] leading-tight ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW B: CONVERSATION MESSAGES FEED */
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
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm ${
                        isUser
                          ? isLight ? 'bg-slate-200 text-slate-800' : 'bg-[#333333] text-white'
                          : 'bg-gradient-to-tr from-brand-600 to-indigo-500 text-white'
                      }`}
                    >
                      {isUser ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`max-w-[88%] rounded-2xl p-4 shadow-sm ${
                        isUser
                          ? isLight
                            ? 'bg-[#EAE6DE] text-slate-900 rounded-tr-none'
                            : 'bg-[#2e2e2e] text-white rounded-tr-none'
                          : isLight
                          ? 'bg-white text-slate-900 rounded-tl-none border border-[#E5E1D8] space-y-2'
                          : 'bg-[#242424] text-slate-200 rounded-tl-none border border-white/5 space-y-2'
                      }`}
                    >
                      {/* Content */}
                      {isUser ? (
                        <p className="whitespace-pre-wrap text-xs sm:text-[13px] leading-relaxed">
                          {msg.content}
                        </p>
                      ) : (
                        <MarkdownRenderer content={msg.content} />
                      )}

                      {/* Action Bar */}
                      <div className={`flex items-center justify-end space-x-2 pt-1 border-t text-[11px] ${
                        isLight ? 'border-slate-100 text-slate-400' : 'border-white/5 text-slate-500'
                      }`}>
                        <button
                          onClick={() => copyMessageContent(msg.id, msg.content)}
                          className={`flex items-center gap-1 transition-colors ${
                            isLight ? 'hover:text-black' : 'hover:text-white'
                          }`}
                          title="Copy message"
                        >
                          {copiedMsgId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-500">Copied</span>
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
                            className={`flex items-center gap-1 transition-colors disabled:opacity-40 ${
                              isLight ? 'hover:text-black' : 'hover:text-white'
                            }`}
                            title="Regenerate"
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

              {/* Generating / Loading indicator */}
              {isGenerating && (
                <div className="flex gap-3 text-xs leading-relaxed animate-in fade-in duration-150">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className={`p-3.5 rounded-2xl rounded-tl-none border flex items-center space-x-2 ${
                    isLight ? 'bg-white border-[#E5E1D8] text-slate-700' : 'bg-[#242424] border-white/5 text-slate-300'
                  }`}>
                    <div className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
                    <span className="text-xs">DeployX is generating...</span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{errorMessage}</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. CLAUDE-INSPIRED BOTTOM MESSAGE COMPOSER */}
        {/* ========================================================================= */}
        <div className={`p-4 border-t flex-shrink-0 ${
          isLight ? 'bg-[#FAF9F5] border-[#E8E5DD]' : 'bg-[#1E1E1E] border-white/5'
        }`}>
          <div className="max-w-2xl mx-auto space-y-2">
            {/* Attachment Chips */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-1">
                {attachedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] border ${
                      isLight ? 'bg-white border-[#E0DCD3] text-slate-800' : 'bg-[#292929] border-white/10 text-slate-200'
                    }`}
                  >
                    <Paperclip className="w-3 h-3 text-brand-500" />
                    <span className="truncate max-w-[150px] font-medium">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="text-slate-400 hover:text-rose-500 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
            />

            {/* Large Rounded Composer Card */}
            <div className={`border rounded-3xl p-3 transition-all shadow-md focus-within:ring-2 focus-within:ring-brand-500/30 space-y-2 ${
              isLight ? 'bg-white border-[#E0DCD3]' : 'bg-[#262626] border-white/10'
            }`}>
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
                placeholder="Ask DeployX anything, create a presentation, or build a website... (Enter to send, Shift+Enter for new line)"
                className={`w-full bg-transparent px-2 text-xs sm:text-sm outline-none resize-none leading-relaxed disabled:opacity-50 ${
                  isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-white placeholder:text-slate-500'
                }`}
              />

              <div className={`flex items-center justify-between pt-1 border-t px-1 ${
                isLight ? 'border-slate-100' : 'border-white/5'
              }`}>
                {/* Attachment Trigger */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-1.5 rounded-xl transition-colors flex items-center gap-1 text-xs ${
                    isLight ? 'text-slate-500 hover:text-black hover:bg-black/5' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  title="Attach file (PDF, code, image, documents)"
                >
                  <Paperclip className="w-4 h-4" />
                  <span className="text-[11px] font-medium hidden sm:inline">Attach</span>
                </button>

                {/* Send / Stop Buttons */}
                <div className="flex items-center space-x-2">
                  {isGenerating ? (
                    <button
                      type="button"
                      onClick={handleStopGeneration}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition-all"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendMessage()}
                      disabled={!inputPrompt.trim() && attachedFiles.length === 0}
                      className="w-8 h-8 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-md active:scale-95"
                      title="Send message"
                    >
                      <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <p className="text-center text-[10px] text-slate-400">
              DeployX can synthesize real presentations (.pptx), documents (.docx), spreadsheets (.xlsx), and interactive websites.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
