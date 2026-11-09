'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  Layers,
  Rocket,
  ShieldCheck,
  CreditCard,
  Calendar,
  Wand2,
  ArrowRight,
  ExternalLink,
  Code2,
  FolderGit2,
  CheckCircle2,
  RefreshCw,
  Loader2,
  ArrowUp,
  Zap,
  Bot
} from 'lucide-react';
import { Project } from '@/lib/types';
import { PROJECT_TEMPLATES, ProjectTemplate } from '@/lib/templates';
import { Navbar } from '@/components/Navbar';
import { ProjectCard } from '@/components/ProjectCard';
import { NewProjectModal } from '@/components/NewProjectModal';
import { useAuth } from '@/lib/auth-context';
import { AuthPortal } from '@/components/auth/AuthPortal';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'deployed' | 'ready' | 'draft'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickPrompt, setQuickPrompt] = useState('');

  // 3D Cursor Glow tracking
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.projects) {
        setProjects(data.projects);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const handleDeleteProject = async (id: string) => {
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch {
      alert('Failed to delete project');
    }
  };

  const handleLaunchQuickPrompt = async (promptOverride?: string) => {
    const text = (promptOverride || quickPrompt).trim();
    if (!text) {
      setIsModalOpen(true);
      return;
    }

    setIsSynthesizing(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: text.slice(0, 32),
          description: text,
          initialPrompt: text,
          tags: ['AI Generated', 'Gemini 1.5']
        })
      });
      const data = await res.json();
      if (data.project) {
        try {
          localStorage.setItem(`deployx_proj_${data.project.id}`, JSON.stringify(data.project));
        } catch {}
        router.push(`/projects/${data.project.id}`);
      }
    } catch {
      setIsModalOpen(true);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // If still checking session from server: show clean dark loading
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center text-white font-sans">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center animate-pulse">
            <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
          </div>
          <span className="text-xs text-slate-400 font-mono">Authenticating DeployX Environment...</span>
        </div>
      </div>
    );
  }

  // If not logged in: immediately render the 3D ChatGPT-styled Signup / Login Portal!
  if (!user) {
    return <AuthPortal />;
  }

  // User is authenticated: Render ChatGPT-styled Light Black 3D Dashboard
  return (
    <div className="relative min-h-screen flex flex-col bg-[#0d0d0d] text-slate-100 overflow-x-hidden">
      {/* Interactive 3D Cursor Lighting Canvas */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(900px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.08), rgba(16, 185, 129, 0.03) 40%, transparent 70%)`
        }}
      />

      {/* Top Global Navigation (ChatGPT Light-Black Dark Theme) */}
      <Navbar onOpenNewProject={() => setIsModalOpen(true)} />

      {/* Hero Announcement & Conversational Prompt Input */}
      <section className="relative z-10 bg-gradient-to-b from-[#141414] to-[#0d0d0d] border-b border-white/5 pt-10 sm:pt-14 pb-12 sm:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* User Welcome Pill */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold mb-5 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Welcome back, <strong className="text-white">{user.name}</strong></span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Describe Any Web Application. <br className="hidden sm:inline" />
              DeployX Synthesizes, Previews & Deploys.
            </h1>

            <p className="mt-3.5 text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
              From artisan restaurant websites with real-time table reservations to SaaS platforms with Stripe billing and two-factor OTP security.
            </p>

            {/* Claude-Style Minimalist Floating Prompt Box */}
            <div className="mt-8 max-w-2xl mx-auto bg-[#171717] rounded-3xl p-3 sm:p-4 shadow-2xl border border-white/10 ring-1 ring-white/5 text-left space-y-3">
              <textarea
                rows={3}
                value={quickPrompt}
                onChange={(e) => setQuickPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleLaunchQuickPrompt();
                  }
                }}
                disabled={isSynthesizing}
                placeholder="How can DeployX help you build today? (e.g. Build an anime streaming landing page with dark neon aesthetic and video carousel...)"
                className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none resize-none leading-relaxed"
              />

              <div className="flex items-center justify-between pt-2 border-t border-white/5 px-1">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Google Gemini 1.5 Flash</span>
                </div>

                <button
                  onClick={() => handleLaunchQuickPrompt()}
                  disabled={!quickPrompt.trim() || isSynthesizing}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition-all flex items-center gap-2 active:scale-95"
                >
                  {isSynthesizing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Building Website...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate</span>
                      <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Inspiration Pills */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
              {[
                { label: '🏋️ Fitness Gym', prompt: 'Build a modern fitness gym website with membership plans, trainer profiles, and workout schedule.' },
                { label: '📸 Photography Portfolio', prompt: 'Build a dark minimalist photography portfolio with gallery grid and client contact.' },
                { label: '🍽️ Artisan Restaurant', prompt: 'Build an upscale farm-to-table restaurant website with online table reservations.' },
                { label: '🚀 SaaS Cloud Platform', prompt: 'Build a high-converting developer SaaS landing page with pricing plans and FAQ.' }
              ].map((chip) => (
                <button
                  key={chip.label}
                  disabled={isSynthesizing}
                  onClick={() => handleLaunchQuickPrompt(chip.prompt)}
                  className="px-3 py-1.5 rounded-full text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all active:scale-95 text-left"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Dashboard */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-grow w-full space-y-10">
        {/* Metric Badges & Dashboard Search Header */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Your Engineering Projects</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage, edit in live workspace, preview virtual builds, and inspect deployment status.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative flex-grow sm:flex-grow-0">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects or tags..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-white/10 text-xs bg-[#171717] text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-brand-500 w-full sm:w-60"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center justify-between sm:justify-start space-x-1 bg-[#171717] border border-white/10 p-1 rounded-xl text-xs font-semibold text-slate-400 overflow-x-auto">
                {(['all', 'deployed', 'ready', 'draft'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                      statusFilter === status
                        ? 'bg-[#262626] text-white font-bold'
                        : 'hover:text-white'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <button
                onClick={fetchProjects}
                className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors"
                title="Refresh Projects"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Project Cards Grid */}
          <div className="mt-6">
            {isLoading ? (
              <div className="p-12 text-center text-slate-500 text-xs font-mono">
                Loading DeployX project records...
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="bg-[#171717] rounded-3xl border border-white/10 p-10 sm:p-12 text-center max-w-lg mx-auto shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-brand-600/10 text-brand-400 flex items-center justify-center mx-auto mb-4 border border-brand-500/20">
                  <FolderGit2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-white">No Projects Found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  {searchQuery ? 'Try clearing your search query or status filter.' : 'Get started by creating your first project with natural language.'}
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition-all"
                >
                  Create New Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onDelete={handleDeleteProject}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Blueprint Starters Gallery */}
        <section id="templates" className="pt-6 border-t border-white/10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-400">
                Kickstart in Seconds
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                Curated Starter Blueprints
              </h2>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-xs font-semibold text-brand-400 hover:text-brand-300"
            >
              View all blueprints →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROJECT_TEMPLATES.slice(0, 3).map((template) => (
              <div
                key={template.id}
                onClick={() => {
                  setQuickPrompt(template.prompt);
                  setIsModalOpen(true);
                }}
                className="bg-[#171717] p-5 rounded-3xl border border-white/10 hover:border-brand-500/40 hover:shadow-xl cursor-pointer transition-all flex flex-col justify-between group hover:-translate-y-0.5 duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-white group-hover:text-brand-400 transition-colors">
                      {template.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/10 text-brand-300 border border-brand-500/20">
                      {template.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {template.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-brand-400">
                  <span>Synthesize Blueprint</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Core Journey & Architecture Banner */}
        <section className="bg-[#171717] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl">
          <h3 className="font-bold text-base sm:text-lg text-white text-center mb-6 sm:mb-8">
            How DeployX Powers the Autonomous Engineering Lifecycle
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 text-center">
            <div className="p-4 rounded-2xl bg-[#1f1f1f] border border-white/5 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-brand-600/20 text-brand-400 font-bold flex items-center justify-center mx-auto text-xs border border-brand-500/30">
                1
              </div>
              <h4 className="font-bold text-xs text-white">Conversational Intent</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Describe desired website or web app in plain English with high-level goals.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#1f1f1f] border border-white/5 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 font-bold flex items-center justify-center mx-auto text-xs border border-indigo-500/30">
                2
              </div>
              <h4 className="font-bold text-xs text-white">Intelligent Clarification</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                DeployX asks 2-3 concise clarifying questions for reservation rules, OTP, or pricing.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#1f1f1f] border border-white/5 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-violet-600/20 text-violet-400 font-bold flex items-center justify-center mx-auto text-xs border border-violet-500/30">
                3
              </div>
              <h4 className="font-bold text-xs text-white">Live Sandboxed Preview</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Interact with responsive preview, edit code directly, or customize styling with zero delay.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#1f1f1f] border border-white/5 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 font-bold flex items-center justify-center mx-auto text-xs border border-emerald-500/30">
                4
              </div>
              <h4 className="font-bold text-xs text-white">Verified Deployment</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Capture snapshots, roll back with 1-click, and deploy to local Edge sandbox simulation.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-[#141414] border-t border-white/10 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white">DeployX</span>
            <span>— Software Engineering & Autonomous Web Platform</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Secure Server-Side AI Adapters • Sandbox Execution Guard • Zero Plaintext Secrets
          </div>
        </div>
      </footer>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isModalOpen}
        initialPrompt={quickPrompt}
        onClose={() => {
          setIsModalOpen(false);
          setQuickPrompt('');
        }}
      />
    </div>
  );
}
