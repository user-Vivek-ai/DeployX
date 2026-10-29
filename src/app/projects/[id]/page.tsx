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
  AlertCircle
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
  const [mobileView, setMobileView] = useState<'chat' | 'preview'>('preview');

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
      // Also update CSS variable in styles.css and headline in index.html
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
        setActiveTab('workspace'); // Switch back to live preview to see restored version
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
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Workspace Master Header */}
      <header className="h-14 px-4 bg-white border-b border-slate-200 flex items-center justify-between flex-shrink-0 z-30">
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="p-1.5 rounded-lg text-slate-500 hover:text-navy-900 hover:bg-slate-100 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center space-x-2.5">
            <h1 className="font-bold text-sm text-navy-900 truncate max-w-xs sm:max-w-md">
              {project.name}
            </h1>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                project.status === 'deployed'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-brand-100 text-brand-800'
              }`}
            >
              {project.status}
            </span>
          </div>
        </div>

        {/* Center Tabs */}
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
        <div className="flex items-center space-x-2">
          {/* Mobile view switch */}
          {activeTab === 'workspace' && (
            <div className="lg:hidden flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setMobileView('chat')}
                className={`px-2.5 py-1 rounded-md ${mobileView === 'chat' ? 'bg-white shadow-sm text-navy-900' : 'text-slate-500'}`}
              >
                Chat
              </button>
              <button
                onClick={() => setMobileView('preview')}
                className={`px-2.5 py-1 rounded-md ${mobileView === 'preview' ? 'bg-white shadow-sm text-navy-900' : 'text-slate-500'}`}
              >
                Preview
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
            onClick={() => setActiveTab('deploy')}
            className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Deploy</span>
          </button>
        </div>
      </header>

      {/* Workspace Body */}
      <main className="flex-grow overflow-hidden relative">
        {/* 1. WORKSPACE: SPLIT CHAT & PREVIEW */}
        {activeTab === 'workspace' && (
          <div className="h-full flex flex-col lg:flex-row">
            {/* Left: Chat Builder */}
            <div
              className={`w-full lg:w-[42%] h-full flex flex-col ${
                mobileView === 'chat' ? 'block' : 'hidden lg:flex'
              }`}
            >
              <ChatBuilder
                projectId={project.id}
                messages={project.messages || []}
                onSendMessage={handleSendMessage}
                isLoading={isChatLoading}
              />
            </div>

            {/* Right: Live Sandboxed Preview */}
            <div
              className={`w-full lg:w-[58%] h-full flex flex-col ${
                mobileView === 'preview' ? 'block' : 'hidden lg:flex'
              }`}
            >
              <LivePreview
                projectId={project.id}
                files={project.files}
                onRepairRequest={(errorMsg) => handleSendMessage(errorMsg)}
              />
            </div>
          </div>
        )}

        {/* 2. CODE & FILES EDITOR */}
        {activeTab === 'code' && (
          <CodeEditor
            files={project.files}
            onSaveFile={handleSaveFile}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
          />
        )}

        {/* 3. VISUAL CUSTOMIZER */}
        {activeTab === 'visual' && (
          <VisualCustomizer
            initialConfig={project.visualConfig}
            onApplyChanges={handleApplyVisual}
            isApplying={isApplyingVisual}
          />
        )}

        {/* 4. VERSION HISTORY */}
        {activeTab === 'versions' && (
          <VersionHistory
            projectId={project.id}
            versions={project.versions || []}
            onRestoreVersion={handleRestoreVersion}
            onSaveSnapshot={handleSaveSnapshot}
            isRestoring={isRestoring}
          />
        )}

        {/* 5. DEPLOYMENT PIPELINE */}
        {activeTab === 'deploy' && (
          <DeploymentDrawer
            projectId={project.id}
            deployments={project.deployments || []}
            onTriggerDeploy={handleDeploy}
            isDeploying={isDeploying}
            activeDeploymentUrl={project.activeDeploymentUrl}
          />
        )}

        {/* 6. INTEGRATIONS & SETTINGS */}
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
      </main>
    </div>
  );
}
