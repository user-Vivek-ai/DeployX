'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  RefreshCw
} from 'lucide-react';
import { Project } from '@/lib/types';
import { PROJECT_TEMPLATES, ProjectTemplate } from '@/lib/templates';
import { Navbar } from '@/components/Navbar';
import { ProjectCard } from '@/components/ProjectCard';
import { NewProjectModal } from '@/components/NewProjectModal';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'deployed' | 'ready' | 'draft'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickPrompt, setQuickPrompt] = useState('');

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
    fetchProjects();
  }, []);

  const handleDeleteProject = async (id: string) => {
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch {
      alert('Failed to delete project');
    }
  };

  const handleLaunchQuickPrompt = () => {
    if (!quickPrompt.trim()) return;
    setIsModalOpen(true);
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const deployedCount = projects.filter(p => p.status === 'deployed').length;
  const readyCount = projects.filter(p => p.status === 'ready').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Global Navigation */}
      <Navbar onOpenNewProject={() => setIsModalOpen(true)} />

      {/* Hero Announcement & Conversational Prompt Input */}
      <section className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200/80 pt-12 pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200/60 text-brand-700 text-xs font-semibold mb-5">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Natural-Language Software Engineering & Deployment</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-navy-900 tracking-tight leading-tight">
              Describe Any Web App. <br className="hidden sm:inline" />
              DeployX Synthesizes, Previews & Deploys.
            </h1>

            <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              From artisan restaurant websites with real-time table reservations to SaaS platforms with Stripe billing and two-factor OTP security.
            </p>

            {/* Quick Prompt Launcher Bar */}
            <div className="mt-8 max-w-2xl mx-auto bg-white p-2 sm:p-2.5 rounded-2xl shadow-lg border border-slate-200/90 flex flex-col sm:flex-row items-center gap-2">
              <div className="flex items-center space-x-2.5 px-3 flex-grow w-full">
                <Wand2 className="w-5 h-5 text-brand-600 flex-shrink-0" />
                <input
                  type="text"
                  value={quickPrompt}
                  onChange={(e) => setQuickPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLaunchQuickPrompt()}
                  placeholder="e.g. Build an artisan restaurant with table reservations and online payments..."
                  className="w-full text-xs sm:text-sm bg-transparent outline-none placeholder:text-slate-400 text-navy-900"
                />
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all flex items-center justify-center space-x-1.5 flex-shrink-0"
              >
                <span>Synthesize with AI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full space-y-10">
        {/* Metric Badges & Dashboard Search Header */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-bold text-navy-900">Your Engineering Projects</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage, edit in live workspace, preview virtual builds, and inspect deployment status.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative flex-grow sm:flex-grow-0">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects or tags..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:ring-1 focus:ring-brand-500 w-full sm:w-60"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center justify-between sm:justify-start space-x-1 bg-white border border-slate-200 p-1 rounded-xl text-xs font-semibold text-slate-600 overflow-x-auto">
                {(['all', 'deployed', 'ready', 'draft'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                      statusFilter === status
                        ? 'bg-slate-100 text-navy-900 font-bold'
                        : 'hover:text-navy-900'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <button
                onClick={fetchProjects}
                className="p-2 hover:bg-slate-200/60 rounded-xl text-slate-500 hover:text-navy-900 transition-colors"
                title="Refresh Projects"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Project Cards Grid */}
          <div className="mt-6">
            {isLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Loading DeployX project database...
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
                  <FolderGit2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-navy-900">No Projects Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  {searchQuery ? 'Try clearing your search query or status filter.' : 'Get started by creating your first project with natural language.'}
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition-all"
                >
                  Create New Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <section id="templates" className="pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                Kickstart in Seconds
              </span>
              <h2 className="text-xl font-bold text-navy-900 mt-0.5">
                Curated Starter Blueprints
              </h2>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
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
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-navy-900 group-hover:text-brand-600 transition-colors">
                      {template.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                      {template.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {template.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand-600">
                  <span>Synthesize Blueprint</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Core Journey & Architecture Banner */}
        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-lg text-navy-900 text-center mb-8">
            How DeployX Powers the Natural-Language Engineering Lifecycle
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 font-bold flex items-center justify-center mx-auto text-sm">
                1
              </div>
              <h4 className="font-bold text-xs text-navy-900">Conversational Intent</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Describe desired website or web application in natural language with high-level goals.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center mx-auto text-sm">
                2
              </div>
              <h4 className="font-bold text-xs text-navy-900">Intelligent Clarification</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                DeployX asks 2-3 concise follow-up questions for booking rules, OTP, or pricing models.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 font-bold flex items-center justify-center mx-auto text-sm">
                3
              </div>
              <h4 className="font-bold text-xs text-navy-900">Live Sandboxed Preview</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Interact with responsive preview, edit code directly, or customize styling with zero reload delay.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center mx-auto text-sm">
                4
              </div>
              <h4 className="font-bold text-xs text-navy-900">Verified Deployment</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Save version snapshots, roll back with 1-click, and deploy to local Edge sandbox simulation.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-navy-900">DeployX</span>
            <span>— Software Engineering & Autonomous Web Platform</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Secure Server-Side AI Adapters • Sandbox Execution Guard • Zero Plaintext Secrets
          </div>
        </div>
      </footer>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
