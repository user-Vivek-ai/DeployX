'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  Eye,
  FileCode,
  Palette,
  History,
  Rocket,
  Settings,
  Download,
  Share2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  MessageSquare,
  Columns2,
  Maximize2,
  Smartphone,
  Laptop
} from 'lucide-react';
import { Project, ProjectFile, VisualConfig } from '@/lib/types';
import { ChatBuilder } from '@/components/workspace/ChatBuilder';
import { LivePreview } from '@/components/workspace/LivePreview';
import { CodeEditor } from '@/components/workspace/CodeEditor';
import { VisualCustomizer } from '@/components/workspace/VisualCustomizer';
import { VersionHistory } from '@/components/workspace/VersionHistory';
import { DeploymentDrawer } from '@/components/workspace/DeploymentDrawer';
import { IntegrationSettings } from '@/components/workspace/IntegrationSettings';

export default function ProjectWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'workspace' | 'code' | 'visual' | 'versions' | 'deploy' | 'settings'>('workspace');
  const [isLoading, setIsLoading] = useState(true);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isApplyingVisual, setIsApplyingVisual] = useState(false);

  // Responsive device view controls
  const [mobileTab, setMobileTab] = useState<'chat' | 'preview' | 'code' | 'visual' | 'deploy' | 'settings'>('chat');
  const [desktopSplit, setDesktopSplit] = useState<'split' | 'fullPreview' | 'fullChat'>('split');

  // Load project
  const loadProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error('Project not found');
      const data = await res.json();
      setProject(data.project);
    } catch {
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  // Keyboard shortcuts listener for PC / Laptops
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        setActiveTab('deploy');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle conversational instruction
  const handleSendMessage = async (prompt: string) => {
    if (!project) return;
    setIsChatLoading(true);
    try {
      const res = await fetch('/api/ai/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, prompt })
      });
      const data = await res.json();
      if (data.success && data.project) {
        setProject(data.project);
        // On mobile, switch to preview automatically after generating so user sees the change!
        if (window.innerWidth < 1024) {
          setMobileTab('preview');
        }
      }
    } catch {
      alert('Failed to apply modification. Please try again.');
    } finally {
      setIsChatLoading(false);
    }
  };

  // Handle manual code save
  const handleSaveFile = async (path: string, content: string) => {
    if (!project) return;
    const updatedFiles = project.files.map(f => f.path === path ? { ...f, content } : f);
    if (!updatedFiles.some(f => f.path === path)) {
      updatedFiles.push({ path, content, language: path.split('.').pop() || 'txt' });
    }

    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: updatedFiles })
    });
    const data = await res.json();
    if (data.project) setProject(data.project);
  };

  const handleCreateFile = async (path: string, content: string) => {
    await handleSaveFile(path, content);
  };

  const handleDeleteFile = async (path: string) => {
    if (!project) return;
    const updatedFiles = project.files.filter(f => f.path !== path);
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: updatedFiles })
    });
    const data = await res.json();
    if (data.project) setProject(data.project);
  };

  // Handle visual style edits
  const handleApplyVisual = async (newConfig: VisualConfig) => {
    if (!project) return;
    setIsApplyingVisual(true);
    try {
      let stylesCss = project.files.find(f => f.path === 'styles.css')?.content || '';
      let indexHtml = project.files.find(f => f.path === 'index.html')?.content || '';

      if (stylesCss && newConfig.primaryColor) {
        stylesCss = stylesCss.replace(/--primary-color:\s*#[a-fA-F0-9]{6};/g, `--primary-color: ${newConfig.primaryColor};`);
      }

      if (indexHtml && newConfig.heroHeadline) {
        indexHtml = indexHtml.replace(/<h1 class="hero-title">[\s\S]*?<\/h1>/, `<h1 class="hero-title">${newConfig.heroHeadline}</h1>`);
      }

      const updatedFiles = project.files.map(f => {
        if (f.path === 'styles.css') return { ...f, content: stylesCss };
        if (f.path === 'index.html') return { ...f, content: indexHtml };
        return f;
      });

      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visualConfig: newConfig,
          files: updatedFiles
        })
      });
      const data = await res.json();
      if (data.project) setProject(data.project);
    } finally {
      setIsApplyingVisual(false);
    }
  };

  // Handle Version Restore
  const handleRestoreVersion = async (versionId: string) => {
    if (!project) return;
    setIsRestoring(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/versions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId })
      });
      const data = await res.json();
      if (data.project) {
        setProject(data.project);
        setActiveTab('workspace');
        setMobileTab('preview');
      }
    } finally {
      setIsRestoring(false);
    }
  };

  // Handle Snapshot Creation
  const handleSaveSnapshot = async (message: string) => {
    if (!project) return;
    const res = await fetch(`/api/projects/${project.id}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, author: 'User' })
    });
    const data = await res.json();
    if (data.snapshot) {
      loadProject();
    }
  };

  // Handle Deploy Trigger
  const handleDeploy = async (environment: 'production' | 'staging' | 'preview') => {
    if (!project) return;
    setIsDeploying(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment })
      });
      const data = await res.json();
      if (data.project) {
        setProject(data.project);
      }
    } finally {
      setIsDeploying(false);
    }
  };

  if (isLoading || !project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <span className="text-xs font-semibold text-slate-600">Mounting DeployX Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-white overflow-hidden select-none">
      {/* Workspace Master Header (Optimized for PC, Laptop, Tablet, and Mobile) */}
      <header className="h-13 sm:h-14 px-3 sm:px-4 bg-white border-b border-slate-200 flex items-center justify-between flex-shrink-0 z-30">
        <div className="flex items-center space-x-2 sm:space-x-3 truncate">
          <Link
            href="/"
            className="p-1.5 rounded-lg text-slate-500 hover:text-navy-900 hover:bg-slate-100 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center space-x-2 truncate">
            <h1 className="font-bold text-xs sm:text-sm text-navy-900 truncate max-w-[140px] sm:max-w-xs md:max-w-md">
              {project.name}
            </h1>
            <span
              className={`hidden xs:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                project.status === 'deployed'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-brand-100 text-brand-800'
              }`}
            >
              {project.status}
            </span>
          </div>
        </div>

        {/* Center Tabs (Visible on Tablet Landscape, Laptops & Desktops) */}
        <nav className="hidden lg:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'workspace' ? 'bg-white text-navy-900 shadow-sm' : 'hover:text-navy-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-brand-600" />
            <span>Workspace</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'code' ? 'bg-white text-navy-900 shadow-sm' : 'hover:text-navy-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-indigo-600" />
            <span>Code & Files</span>
          </button>
          <button
            onClick={() => setActiveTab('visual')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'visual' ? 'bg-white text-navy-900 shadow-sm' : 'hover:text-navy-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-violet-600" />
            <span>Visual Studio</span>
          </button>
          <button
            onClick={() => setActiveTab('versions')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'versions' ? 'bg-white text-navy-900 shadow-sm' : 'hover:text-navy-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-amber-600" />
            <span>Versions ({project.versions?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('deploy')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'deploy' ? 'bg-white text-navy-900 shadow-sm' : 'hover:text-navy-900'
            }`}
          >
            <Rocket className="w-3.5 h-3.5 text-emerald-600" />
            <span>Deploy</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'settings' ? 'bg-white text-navy-900 shadow-sm' : 'hover:text-navy-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>Integrations</span>
          </button>
        </nav>

        {/* Right Header Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Desktop Split-Screen Preset Toggles */}
          {activeTab === 'workspace' && (
            <div className="hidden xl:flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg text-slate-500">
              <button
                onClick={() => setDesktopSplit('fullChat')}
                title="Full Chat View"
                className={`p-1 rounded ${desktopSplit === 'fullChat' ? 'bg-white text-navy-900 shadow-sm' : 'hover:text-navy-900'}`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDesktopSplit('split')}
                title="Split Side-by-Side (Default)"
                className={`p-1 rounded ${desktopSplit === 'split' ? 'bg-white text-navy-900 shadow-sm' : 'hover:text-navy-900'}`}
              >
                <Columns2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDesktopSplit('fullPreview')}
                title="Full Preview View"
                className={`p-1 rounded ${desktopSplit === 'fullPreview' ? 'bg-white text-navy-900 shadow-sm' : 'hover:text-navy-900'}`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <a
            href={`/api/projects/${project.id}/export`}
            download
            className="p-1.5 text-slate-600 hover:text-navy-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Download ZIP package"
          >
            <Download className="w-4 h-4" />
          </a>

          <button
            onClick={() => {
              setActiveTab('deploy');
              setMobileTab('deploy');
            }}
            className="px-3 sm:px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Deploy</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Surface */}
      <main className="flex-grow overflow-hidden relative flex flex-col">
        {/* DESKTOP / LAPTOP / TABLET-LANDSCAPE VIEW (> 1024px) */}
        <div className="hidden lg:flex flex-grow h-full overflow-hidden">
          {activeTab === 'workspace' && (
            <div className="h-full w-full flex">
              {/* Left: Chat Builder */}
              {(desktopSplit === 'split' || desktopSplit === 'fullChat') && (
                <div
                  className={`h-full flex flex-col transition-all duration-200 ${
                    desktopSplit === 'fullChat' ? 'w-full' : 'w-[42%]'
                  }`}
                >
                  <ChatBuilder
                    projectId={project.id}
                    messages={project.messages || []}
                    onSendMessage={handleSendMessage}
                    isLoading={isChatLoading}
                  />
                </div>
              )}

              {/* Right: Live Sandboxed Preview */}
              {(desktopSplit === 'split' || desktopSplit === 'fullPreview') && (
                <div
                  className={`h-full flex flex-col transition-all duration-200 ${
                    desktopSplit === 'fullPreview' ? 'w-full' : 'w-[58%]'
                  }`}
                >
                  <LivePreview
                    projectId={project.id}
                    files={project.files}
                    onRepairRequest={(errorMsg) => handleSendMessage(errorMsg)}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'code' && (
            <CodeEditor
              files={project.files}
              onSaveFile={handleSaveFile}
              onCreateFile={handleCreateFile}
              onDeleteFile={handleDeleteFile}
            />
          )}

          {activeTab === 'visual' && (
            <VisualCustomizer
              initialConfig={project.visualConfig}
              onApplyChanges={handleApplyVisual}
              isApplying={isApplyingVisual}
            />
          )}

          {activeTab === 'versions' && (
            <VersionHistory
              projectId={project.id}
              versions={project.versions || []}
              onRestoreVersion={handleRestoreVersion}
              onSaveSnapshot={handleSaveSnapshot}
              isRestoring={isRestoring}
            />
          )}

          {activeTab === 'deploy' && (
            <DeploymentDrawer
              projectId={project.id}
              deployments={project.deployments || []}
              onTriggerDeploy={handleDeploy}
              isDeploying={isDeploying}
              activeDeploymentUrl={project.activeDeploymentUrl}
            />
          )}

          {activeTab === 'settings' && (
            <IntegrationSettings
              project={project}
              onUpdateProject={async (updates) => {
                const res = await fetch(`/api/projects/${project.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updates)
                });
                const data = await res.json();
                if (data.project) setProject(data.project);
              }}
            />
          )}
        </div>

        {/* MOBILE & TABLET-PORTRAIT VIEW (< 1024px) */}
        <div className="lg:hidden flex flex-col flex-grow h-[calc(100dvh-3.5rem-3.75rem)] overflow-hidden">
          {mobileTab === 'chat' && (
            <ChatBuilder
              projectId={project.id}
              messages={project.messages || []}
              onSendMessage={handleSendMessage}
              isLoading={isChatLoading}
            />
          )}

          {mobileTab === 'preview' && (
            <LivePreview
              projectId={project.id}
              files={project.files}
              onRepairRequest={(errorMsg) => {
                setMobileTab('chat');
                handleSendMessage(errorMsg);
              }}
            />
          )}

          {mobileTab === 'code' && (
            <CodeEditor
              files={project.files}
              onSaveFile={handleSaveFile}
              onCreateFile={handleCreateFile}
              onDeleteFile={handleDeleteFile}
            />
          )}

          {mobileTab === 'visual' && (
            <VisualCustomizer
              initialConfig={project.visualConfig}
              onApplyChanges={handleApplyVisual}
              isApplying={isApplyingVisual}
            />
          )}

          {mobileTab === 'deploy' && (
            <DeploymentDrawer
              projectId={project.id}
              deployments={project.deployments || []}
              onTriggerDeploy={handleDeploy}
              isDeploying={isDeploying}
              activeDeploymentUrl={project.activeDeploymentUrl}
            />
          )}

          {mobileTab === 'settings' && (
            <IntegrationSettings
              project={project}
              onUpdateProject={async (updates) => {
                const res = await fetch(`/api/projects/${project.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updates)
                });
                const data = await res.json();
                if (data.project) setProject(data.project);
              }}
            />
          )}
        </div>

        {/* NATIVE MOBILE BOTTOM APP BAR (< 1024px) */}
        <div className="lg:hidden h-14 bg-white border-t border-slate-200 flex items-center justify-around px-1 z-30 flex-shrink-0">
          <button
            onClick={() => setMobileTab('chat')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              mobileTab === 'chat' ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Chat</span>
          </button>

          <button
            onClick={() => setMobileTab('preview')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              mobileTab === 'preview' ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Eye className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Preview</span>
          </button>

          <button
            onClick={() => setMobileTab('code')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              mobileTab === 'code' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Code</span>
          </button>

          <button
            onClick={() => setMobileTab('visual')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              mobileTab === 'visual' ? 'text-violet-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Palette className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Visual</span>
          </button>

          <button
            onClick={() => setMobileTab('deploy')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              mobileTab === 'deploy' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Rocket className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Deploy</span>
          </button>

          <button
            onClick={() => setMobileTab('settings')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              mobileTab === 'settings' ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Setup</span>
          </button>
        </div>
      </main>
    </div>
  );
}
