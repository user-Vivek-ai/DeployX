'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Plus,
  Search,
  Folder,
  Layers,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  FileText,
  FileCode,
  ArrowUp,
  Paperclip,
  Mic,
  SlidersHorizontal,
  Bot,
  User as UserIcon,
  RotateCw,
  ExternalLink,
  Code2,
  Eye,
  Rocket,
  Download,
  Trash2,
  LogOut,
  Loader2,
  Monitor,
  Smartphone,
  Check,
  X,
  Share2
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AuthPortal } from '@/components/auth/AuthPortal';
import { UnifiedAIChat } from '@/components/UnifiedAIChat';
import { Project, ProjectFile, ChatMessage } from '@/lib/types';
import { PreviewRuntime } from '@/lib/preview-runtime';

export default function ClaudeAppPage() {
  const router = useRouter();
  const { user, logout, isLoading: isAuthLoading } = useAuth();

  // State
  const [viewMode, setViewMode] = useState<'chat' | 'builder'>('chat');
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // New prompt input state
  const [homePrompt, setHomePrompt] = useState('');
  const [chatPrompt, setChatPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'chatgpt' | 'gemini'>('chatgpt');
  const [showModelMenu, setShowModelMenu] = useState(false);

  // Artifact Viewer State
  const [artifactTab, setArtifactTab] = useState<'preview' | 'code'>('preview');
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [previewKey, setPreviewKey] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploySuccessUrl, setDeploySuccessUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const homeTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Dynamic Time Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Fetch all projects
  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        if (data.projects) {
          setProjects(data.projects);
          return data.projects as Project[];
        }
      }
    } catch {}
    return [];
  };

  useEffect(() => {
    if (user) {
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const requestedId = urlParams ? urlParams.get('p') : null;

      fetchProjects().then(projs => {
        if (requestedId) {
          const match = projs.find(p => p.id === requestedId);
          if (match) {
            setCurrentProject(match);
          } else {
            try {
              const cached = localStorage.getItem(`deployx_proj_${requestedId}`);
              if (cached) setCurrentProject(JSON.parse(cached));
            } catch {}
          }
        }
      });
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentProject?.messages, isGenerating]);

  // Handle direct prompt submission (Zero questions asked!)
  const handleStartNewProject = async (promptText?: string) => {
    const text = (promptText || homePrompt).trim();
    if (!text || isGenerating) return;

    setIsGenerating(true);
    setHomePrompt('');

    try {
      const projectName = text.slice(0, 32).trim() || 'Modern Web Project';

      // Call /api/projects which creates the project AND synthesizes code in one shot
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          description: text,
          initialPrompt: text,
          tags: selectedModel === 'chatgpt' ? ['ChatGPT', 'Time Pass'] : ['Web App', 'Gemini AI'],
          aiProvider: selectedModel
        })
      });

      if (!res.ok) throw new Error('Generation failed');

      const data = await res.json();
      const proj: Project = data.project;

      // Cache locally
      try {
        localStorage.setItem(`deployx_proj_${proj.id}`, JSON.stringify(proj));
      } catch {}

      // Update state
      setProjects(prev => [proj, ...prev.filter(p => p.id !== proj.id)]);
      setCurrentProject(proj);
      setPreviewKey(k => k + 1);
    } catch (err: any) {
      alert(err.message || 'Error generating website. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle sending chat message to refine website or casual chat
  const handleSendChatMessage = async (e?: React.FormEvent, directText?: string) => {
    if (e) e.preventDefault();
    const text = (directText || chatPrompt).trim();
    if (!text || isGenerating || !currentProject) return;

    setChatPrompt('');
    setIsGenerating(true);

    try {
      const res = await fetch('/api/ai/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject.id,
          prompt: text,
          currentFiles: currentProject.files || []
        })
      });

      if (!res.ok) throw new Error('Refinement failed');

      const data = await res.json();
      if (data.project) {
        setCurrentProject(data.project);
        try {
          localStorage.setItem(`deployx_proj_${data.project.id}`, JSON.stringify(data.project));
        } catch {}
        setProjects(prev => prev.map(p => p.id === data.project.id ? data.project : p));
        setPreviewKey(k => k + 1);
      }
    } catch (err: any) {
      alert(err.message || 'Error updating website. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Delete project
  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      setProjects(prev => prev.filter(p => p.id !== id));
      if (currentProject?.id === id) {
        setCurrentProject(null);
      }
      try {
        localStorage.removeItem(`deployx_proj_${id}`);
      } catch {}
    } catch {}
  };

  // Deploy project
  const handleDeploy = async () => {
    if (!currentProject) return;
    setIsDeploying(true);
    try {
      const res = await fetch(`/api/projects/${currentProject.id}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment: 'production' })
      });
      const data = await res.json();
      if (data.project) {
        setCurrentProject(data.project);
        setDeploySuccessUrl(data.project.activeDeploymentUrl || `https://${currentProject.id}.deployx.preview`);
      }
    } catch {
      setDeploySuccessUrl(`https://${currentProject.id}.deployx.preview`);
    } finally {
      setIsDeploying(false);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = () => {
    const htmlFile = currentProject?.files.find(f => f.path === 'index.html');
    if (htmlFile) {
      navigator.clipboard.writeText(htmlFile.content);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // If session is checking:
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  // If not logged in:
  if (!user) {
    return <AuthPortal />;
  }

  // Unified Multi-Model AI Workspace (ChatGPT, Gemini, Claude)
  if (viewMode === 'chat') {
    return <UnifiedAIChat onSwitchToBuilder={() => setViewMode('builder')} />;
  }

  // Current HTML for Preview
  const currentHtml = currentProject?.files.find(f => f.path === 'index.html')?.content || '';
  const compiledSrcDoc = currentProject ? PreviewRuntime.compileToSrcDoc(currentProject.files) : '';

  // Filtered recent projects for sidebar
  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
    p.description.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  return (
    <div className="h-[100dvh] flex bg-[#1e1e1e] text-[#e3e3e3] font-sans overflow-hidden select-none">
      {/* ========================================================================= */}
      {/* CLAUDE-STYLE LEFT SIDEBAR */}
      {/* ========================================================================= */}
      <aside
        className={`bg-[#171717] border-r border-white/5 flex flex-col transition-all duration-200 z-30 flex-shrink-0 ${
          isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        }`}
      >
        {/* Top Sidebar Header */}
        <div className="p-3.5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Close sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white text-[11px] font-bold">
                D
              </span>
              <span>DeployX</span>
            </span>
          </div>

          <button
            onClick={() => {
              setCurrentProject(null);
              setHomePrompt('');
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Start new project"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button (Claude Style) */}
        <div className="p-3">
          <button
            onClick={() => {
              setCurrentProject(null);
              setHomePrompt('');
              setTimeout(() => homeTextareaRef.current?.focus(), 100);
            }}
            className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center justify-between transition-all"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-brand-400" />
              <span>New</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">⌘K</span>
          </button>
        </div>

        {/* Sidebar Nav Items (Claude exact icons) */}
        <div className="px-2 space-y-0.5">
          <button
            onClick={() => setIsSearchActive(!isSearchActive)}
            className="w-full px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2.5"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span>Search</span>
          </button>

          {isSearchActive && (
            <div className="p-1.5">
              <input
                autoFocus
                type="text"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder="Filter projects..."
                className="w-full px-2.5 py-1 rounded-md bg-[#222222] border border-white/10 text-xs text-white placeholder:text-slate-500 outline-none"
              />
            </div>
          )}

          <button
            onClick={() => {
              setCurrentProject(null);
            }}
            className="w-full px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2.5"
          >
            <Folder className="w-4 h-4 text-slate-400" />
            <span>Projects</span>
          </button>

          <button
            onClick={() => {
              if (currentProject) setArtifactTab('preview');
            }}
            className="w-full px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2.5"
          >
            <Layers className="w-4 h-4 text-slate-400" />
            <span>Artifacts</span>
          </button>
        </div>

        {/* Recents Section Header */}
        <div className="mt-4 px-3.5 pb-1 flex items-center justify-between text-[11px] font-semibold text-slate-500">
          <span>Recents</span>
          <ChevronDown className="w-3 h-3" />
        </div>

        {/* Recent Projects List (Claude Style with Document Icons) */}
        <div className="flex-grow overflow-y-auto px-2 space-y-0.5">
          {filteredProjects.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-slate-500">No projects yet</p>
          ) : (
            filteredProjects.map((p) => {
              const isSelected = currentProject?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setCurrentProject(p)}
                  className={`group w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-white/10 text-white font-semibold'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="truncate flex items-center gap-2">
                    <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-brand-400' : 'text-slate-500'}`} />
                    <span className="truncate">{p.name}</span>
                  </span>

                  <button
                    onClick={(e) => handleDeleteProject(p.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 rounded transition-opacity"
                    title="Delete project"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* User Profile Bar (Claude exact bottom format) */}
        <div className="p-3 border-t border-white/5 relative">
          <div
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-2.5 truncate">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400">Free plan</p>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* User Dropdown */}
          {showUserDropdown && (
            <div className="absolute bottom-16 left-3 right-3 bg-[#242424] border border-white/10 rounded-2xl shadow-2xl p-1.5 space-y-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-white/5">
                <p className="text-xs font-bold text-white">{user.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
              </div>
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
      {/* MAIN CANVAS */}
      {/* ========================================================================= */}
      <div className="flex-grow flex flex-col h-full overflow-hidden relative">
        {/* Top Header Bar */}
        <header className="h-12 px-4 border-b border-white/5 flex items-center justify-between bg-[#1e1e1e] flex-shrink-0 z-20">
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

            {currentProject && (
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400">DeployX /</span>
                <span className="font-bold text-white truncate max-w-xs">{currentProject.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  currentProject.aiProvider === 'chatgpt' || currentProject.tags?.includes('ChatGPT') || !currentProject.files || currentProject.files.length === 0
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-brand-500/15 text-brand-300 border-brand-500/30'
                }`}>
                  {currentProject.aiProvider === 'chatgpt' || currentProject.tags?.includes('ChatGPT') || !currentProject.files || currentProject.files.length === 0 ? '🟢 ChatGPT' : '✨ Gemini 1.5'}
                </span>
              </div>
            )}
          </div>

          {/* Right Header Status */}
          <div className="flex items-center space-x-3 text-xs">
            <button
              onClick={() => setViewMode('chat')}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-brand-600/20 transition-all"
              title="Switch to Unified Multi-Model AI Chat (ChatGPT, Gemini, Claude)"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-AI Hub</span>
            </button>

            <span className="hidden sm:inline text-slate-400 text-xs">
              Free plan · <span className="text-white hover:underline cursor-pointer">Upgrade</span>
            </span>

            {currentProject && currentProject.files && currentProject.files.length > 0 && (
              <button
                onClick={handleDeploy}
                disabled={isDeploying}
                className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-600/30 transition-all flex items-center gap-1.5"
              >
                {isDeploying ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Rocket className="w-3.5 h-3.5" />
                )}
                <span>Deploy</span>
              </button>
            )}
          </div>
        </header>

        {/* ========================================================================= */}
        {/* VIEW A: CLAUDE CENTERED HERO (When No Active Project / Home) */}
        {/* ========================================================================= */}
        {!currentProject && (
          <div className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="max-w-2xl w-full space-y-6 text-center">
              {/* Centered Serif Greeting (EXACT CLAUDE AESTHETIC) */}
              <div className="flex items-center justify-center space-y-0 gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-brand-600/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">
                  {getGreeting()}, <span className="italic">{user.name.split(' ')[0]}</span>
                </h1>
              </div>

              {/* Big Claude Rounded Input Card */}
              <div className="bg-[#242424] rounded-3xl border border-white/10 p-3 sm:p-4 shadow-2xl text-left space-y-3 transition-all focus-within:border-white/20 ring-1 ring-white/5">
                <textarea
                  ref={homeTextareaRef}
                  autoFocus
                  rows={4}
                  value={homePrompt}
                  onChange={(e) => setHomePrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleStartNewProject();
                    }
                  }}
                  disabled={isGenerating}
                  placeholder="How can DeployX help you build today?"
                  className="w-full bg-transparent px-3 py-2 text-sm sm:text-base text-white placeholder:text-slate-500 outline-none resize-none leading-relaxed"
                />

                {/* Bottom Toolbar inside card (Claude exact icons) */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 px-1">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                      title="Attach"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-slate-400 font-medium">Project ▾</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors hidden sm:inline"
                      title="Voice input"
                    >
                      <Mic className="w-4 h-4" />
                    </button>

                    {/* Interactive Model Selector Pill */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowModelMenu(!showModelMenu)}
                        className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
                      >
                        <span className={`w-2 h-2 rounded-full ${selectedModel === 'chatgpt' ? 'bg-emerald-400' : 'bg-brand-400'} animate-pulse`}></span>
                        <span>{selectedModel === 'chatgpt' ? 'ChatGPT (GPT-4o)' : 'Gemini 1.5 Flash'}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </button>

                      {showModelMenu && (
                        <div className="absolute bottom-10 right-0 w-64 bg-[#242424] border border-white/15 rounded-2xl shadow-2xl p-1.5 space-y-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Select AI Engine
                          </div>
                          <button
                            type="button"
                            onClick={() => { setSelectedModel('chatgpt'); setShowModelMenu(false); }}
                            className={`w-full p-2.5 rounded-xl text-left transition-colors flex items-start gap-2.5 ${
                              selectedModel === 'chatgpt' ? 'bg-emerald-500/15 border border-emerald-500/30' : 'hover:bg-white/5'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></span>
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span>ChatGPT (GPT-4o)</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold">Time Pass</span>
                              </div>
                              <p className="text-[10px] text-slate-400">Casual chatting, jokes, trivia, questions & time pass companion.</p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => { setSelectedModel('gemini'); setShowModelMenu(false); }}
                            className={`w-full p-2.5 rounded-xl text-left transition-colors flex items-start gap-2.5 ${
                              selectedModel === 'gemini' ? 'bg-brand-500/15 border border-brand-500/30' : 'hover:bg-white/5'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-brand-400 mt-1.5 flex-shrink-0"></span>
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span>Google Gemini 1.5 Flash</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-300 font-semibold">Builder</span>
                              </div>
                              <p className="text-[10px] text-slate-400">Autonomous website synthesis, HTML generation & coding.</p>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleStartNewProject()}
                      disabled={!homePrompt.trim() || isGenerating}
                      className="w-8 h-8 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-md active:scale-95"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Starter Chips */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {[
                  { label: '😄 Tell a joke', prompt: 'Tell me a funny programmer joke!' },
                  { label: '🧠 Trivia & Riddles', prompt: 'Ask me a clever riddle and let me guess the answer.' },
                  { label: '☕ Casual Chat', prompt: 'I want to chat for some time pass! What are some fun things we can talk about?' },
                  { label: '💡 Startup Ideas', prompt: 'Give me 3 high-potential and viral tech startup ideas.' },
                  { label: '🏋️ Fitness Gym Website', prompt: 'Build a modern fitness gym website with membership plans, trainer profiles, workout schedule, and a join now form.' },
                  { label: '🍽️ Artisan Restaurant', prompt: 'Build an upscale farm-to-table restaurant website with online table reservations and signature tasting menu.' },
                  { label: '🚀 SaaS Cloud Landing', prompt: 'Build a high-converting tech SaaS landing page with animated feature cards, interactive pricing tiers, and FAQ accordion.' }
                ].map((chip) => (
                  <button
                    key={chip.label}
                    disabled={isGenerating}
                    onClick={() => handleStartNewProject(chip.prompt)}
                    className="px-3.5 py-1.5 rounded-full text-xs bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 text-slate-300 hover:text-white transition-all active:scale-95 text-left disabled:opacity-50"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW B: CLAUDE ARTIFACTS SPLIT VIEW (Active Project) */}
        {/* ========================================================================= */}
        {currentProject && (
          <div className="flex-grow flex h-full overflow-hidden">
            {/* --------------------------------------------------------------------- */}
            {/* LEFT PANE: CLAUDE CONVERSATION */}
            {/* --------------------------------------------------------------------- */}
            <div className="w-full lg:w-[45%] h-full flex flex-col bg-[#1e1e1e] border-r border-white/5">
              {/* Message Feed */}
              <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-6">
                {currentProject.messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 text-xs leading-relaxed ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                          isUser
                            ? 'bg-[#333333] text-white border border-white/10'
                            : 'bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-sm'
                        }`}
                      >
                        {isUser ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>

                      <div
                        className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                          isUser
                            ? 'bg-[#2b2b2b] text-white rounded-tr-none border border-white/5'
                            : 'bg-[#242424] text-slate-200 rounded-tl-none border border-white/5 space-y-3'
                        }`}
                      >
                        <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>

                        {/* Claude Artifact Box - only show when this message produced or modified files */}
                        {!isUser && currentProject.files && currentProject.files.length > 0 && (msg.fileChanges && msg.fileChanges.length > 0 || currentProject.messages[1]?.id === msg.id) && (
                          <div
                            onClick={() => setArtifactTab('preview')}
                            className="p-3 rounded-xl bg-[#1a1a1a] border border-white/10 flex items-center justify-between cursor-pointer hover:border-brand-500/40 transition-all group"
                          >
                            <div className="flex items-center space-x-2.5">
                              <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
                                <FileCode className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-bold text-xs text-white group-hover:text-brand-300 transition-colors">
                                  index.html
                                </p>
                                <p className="text-[10px] text-slate-400">Interactive Web Application</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                              View in Artifacts ↗
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Loading State */}
                {isGenerating && (
                  <div className="flex gap-3 text-xs leading-relaxed animate-in fade-in duration-150">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="p-4 bg-[#242424] rounded-2xl rounded-tl-none border border-white/5 text-slate-300 space-y-1">
                      <div className="flex items-center space-x-2 text-brand-400 font-semibold text-xs">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>DeployX is updating your website code...</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Generating new elements, styling, and syncing live preview.
                      </p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Claude Signature Floating Bottom Input Bar */}
              <div className="p-4 bg-[#1e1e1e] border-t border-white/5 flex-shrink-0">
                <form onSubmit={handleSendChatMessage} className="bg-[#242424] border border-white/10 focus-within:border-brand-500/40 rounded-2xl p-2.5 transition-all space-y-2">
                  <textarea
                    rows={2}
                    value={chatPrompt}
                    onChange={(e) => setChatPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChatMessage();
                      }
                    }}
                    disabled={isGenerating}
                    placeholder="Ask DeployX to make changes (e.g. 'Make the hero darker', 'Add a booking form')..."
                    className="w-full bg-transparent px-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none resize-none leading-relaxed disabled:opacity-50"
                  />

                  <div className="flex items-center justify-between pt-1 border-t border-white/5 px-1">
                    <span className="text-[11px] text-slate-500">
                      Enter to send • Shift+Enter for new line
                    </span>

                    <button
                      type="submit"
                      disabled={!chatPrompt.trim() || isGenerating}
                      className="w-7 h-7 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-md active:scale-95"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* RIGHT PANE: CLAUDE ARTIFACT PANEL / CHATGPT COMPANION */}
            {/* --------------------------------------------------------------------- */}
            <div className="hidden lg:flex w-[55%] h-full flex-col bg-[#141414] overflow-hidden">
              {currentProject.files && currentProject.files.length > 0 ? (
                <>
                  {/* Artifact Toolbar */}
                  <div className="h-12 px-4 bg-[#1a1a1a] border-b border-white/5 flex items-center justify-between flex-shrink-0">
                    {/* Left: Artifact File Label & Preview / Code Tabs */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1.5 text-xs font-semibold text-white">
                        <FileCode className="w-4 h-4 text-brand-400" />
                        <span>index.html</span>
                      </div>

                      <div className="flex items-center bg-[#242424] p-0.5 rounded-xl border border-white/5 text-xs font-medium">
                        <button
                          onClick={() => setArtifactTab('preview')}
                          className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                            artifactTab === 'preview' ? 'bg-[#333333] text-white font-bold' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                        <button
                          onClick={() => setArtifactTab('code')}
                          className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                            artifactTab === 'code' ? 'bg-[#333333] text-white font-bold' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          <span>Code</span>
                        </button>
                      </div>
                    </div>

                    {/* Right: Viewport Controls & Actions */}
                    <div className="flex items-center space-x-2">
                      {/* Viewport switcher */}
                      <div className="flex items-center bg-[#242424] p-0.5 rounded-lg border border-white/5">
                        <button
                          onClick={() => setViewport('desktop')}
                          className={`p-1 rounded text-slate-400 hover:text-white ${viewport === 'desktop' ? 'bg-white/10 text-white' : ''}`}
                          title="Desktop view"
                        >
                          <Monitor className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setViewport('mobile')}
                          className={`p-1 rounded text-slate-400 hover:text-white ${viewport === 'mobile' ? 'bg-white/10 text-white' : ''}`}
                          title="Mobile view"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => setPreviewKey(k => k + 1)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        title="Refresh Preview"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={handleCopyCode}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                        title="Copy code"
                      >
                        {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Code2 className="w-3 h-3" />}
                        <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                      </button>

                      <a
                        href={`/api/projects/${currentProject.id}/export`}
                        download
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        title="Download HTML package"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Artifact Surface */}
                  <div className="flex-grow overflow-auto p-4 flex justify-center items-center bg-[#111111]">
                    {artifactTab === 'preview' ? (
                      <div
                        className={`h-full bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 border border-white/10 flex flex-col ${
                          viewport === 'mobile' ? 'w-[375px]' : 'w-full'
                        }`}
                      >
                        <iframe
                          key={previewKey}
                          srcDoc={compiledSrcDoc}
                          title="DeployX Live Preview"
                          sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                          className="w-full flex-grow border-0 min-h-[480px]"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-[#171717] rounded-2xl border border-white/10 p-4 font-mono text-xs overflow-auto text-slate-300 select-text leading-relaxed">
                        <pre>{currentHtml}</pre>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* CHATGPT CONVERSATIONAL COMPANION SURFACE (Time Pass Mode) */
                <div className="flex-grow flex flex-col h-full bg-[#141414]">
                  {/* Top Bar */}
                  <div className="h-12 px-4 bg-[#1a1a1a] border-b border-white/5 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-xs font-bold text-white">ChatGPT Companion</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        Time Pass Mode
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">No deployment needed</span>
                  </div>

                  {/* Hub Body */}
                  <div className="flex-grow flex flex-col items-center justify-center p-8 text-center space-y-6">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/20">
                      <Bot className="w-8 h-8" />
                    </div>

                    <div className="max-w-md space-y-2">
                      <h3 className="text-xl font-bold text-white tracking-tight">
                        ChatGPT Interactive Companion
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        You can chat freely with DeployX just like ChatGPT! Ask questions, explore trivia, tell jokes, get code snippets, or pass the time. Whenever you do want a website, just ask and I will synthesize it instantly.
                      </p>
                    </div>

                    {/* Quick interactive prompts */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg w-full text-left">
                      {[
                        { label: '😄 Tell a programmer joke', prompt: 'Tell me a funny programmer joke!' },
                        { label: '🧠 Riddle challenge', prompt: 'Give me a clever riddle to solve!' },
                        { label: '💡 3 Viral startup ideas', prompt: 'Brainstorm 3 viral and high-potential tech startup ideas.' },
                        { label: '🐍 Fun Python snippet', prompt: 'Show me an interesting and useful Python script.' },
                        { label: '🎮 Play 5-Question Trivia', prompt: 'Let us play a 5-question trivia game on science and technology!' },
                        { label: '🌐 Build a website instead', prompt: 'Build a modern personal portfolio website for me with dark theme and contact form.' }
                      ].map((item) => (
                        <button
                          key={item.label}
                          disabled={isGenerating}
                          onClick={() => handleSendChatMessage(undefined, item.prompt)}
                          className="p-3 rounded-2xl bg-[#1e1e1e] hover:bg-[#252525] border border-white/10 hover:border-emerald-500/30 text-left transition-all group disabled:opacity-50"
                        >
                          <p className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                            {item.label}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            {item.prompt}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Deploy Success Modal */}
        {deploySuccessUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#242424] rounded-3xl border border-white/15 p-6 max-w-md w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-2xl border border-emerald-500/30">
                🚀
              </div>
              <h3 className="font-bold text-lg text-white">Your Website is Live!</h3>
              <p className="text-xs text-slate-400">
                DeployX successfully published your production build to the virtual edge network.
              </p>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-emerald-400 truncate select-all">
                {deploySuccessUrl}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeploySuccessUrl(null)}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors"
                >
                  Close
                </button>
                <a
                  href={`/projects/${currentProject?.id}/preview`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Open Site</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
