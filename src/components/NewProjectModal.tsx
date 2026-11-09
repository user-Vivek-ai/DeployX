'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  Loader2,
  Wand2,
  X,
  Bot,
  Zap
} from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

const QUICK_INSPIRATIONS = [
  { label: '🏋️ Fitness Gym', prompt: 'Build a modern fitness gym website with membership plans, trainer profiles, workout schedule, and a join now form.' },
  { label: '📸 Photography Portfolio', prompt: 'Build an artistic dark-themed portfolio for a photographer featuring a gallery grid, client testimonials, and booking inquiry.' },
  { label: '☕ Artisan Coffee Roaster', prompt: 'Build a warm cozy coffee shop website with a bean subscription tier, seasonal menu, and store locator.' },
  { label: '🚀 SaaS Analytics Landing', prompt: 'Build a high-converting tech SaaS landing page with animated feature cards, interactive pricing tiers, and FAQ accordion.' }
];

export function NewProjectModal({ isOpen, onClose, initialPrompt = '' }: NewProjectModalProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [projectName, setProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [creationStep, setCreationStep] = useState<string>('');

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  if (!isOpen) return null;

  const handleDirectGenerate = async () => {
    if (!prompt.trim() || isCreating) return;

    setIsCreating(true);
    setCreationStep('Initializing project workspace...');

    try {
      // 1. Auto-generate project name if not specified
      const name = projectName.trim() || prompt.slice(0, 36).trim() || 'New Gemini Project';

      // 2. Create the project record
      const createRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: prompt,
          initialPrompt: prompt,
          tags: ['AI Generated', 'Gemini 1.5']
        })
      });

      if (!createRes.ok) {
        throw new Error('Failed to create project workspace');
      }

      const createData = await createRes.json();
      const project = createData.project;

      // 3. Immediately synthesize code with Gemini
      setCreationStep('Gemini 1.5 Flash is writing HTML, CSS & JavaScript...');

      const generateRes = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          prompt
        })
      });

      if (!generateRes.ok) {
        console.warn('Initial generation returned status:', generateRes.status);
      }

      setCreationStep('Launching live preview workspace...');

      // 4. Redirect straight to the builder workspace
      onClose();
      router.push(`/projects/${project.id}`);
    } catch (err: any) {
      alert(err.message || 'Error creating project. Please try again.');
      setIsCreating(false);
      setCreationStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-[#171717] rounded-3xl shadow-2xl max-w-xl w-full border border-white/10 overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-[#1f1f1f]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-brand-600/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                <span>Create Website with Gemini AI</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  Direct AI
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Describe any website. Gemini writes the code, previews it, and lets you chat to edit.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isCreating}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {/* Main Prompt Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>What website do you want to build?</span>
              <span className="text-[11px] text-brand-400 normal-case font-medium flex items-center gap-1">
                <Zap className="w-3 h-3" /> Natural language prompt
              </span>
            </label>
            <textarea
              autoFocus
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isCreating}
              rows={4}
              placeholder="e.g. Build a portfolio for a 3D motion designer with a dark theme, video reel showcase, services list, and client contact form..."
              className="w-full px-4 py-3 rounded-2xl bg-[#0d0d0d] border border-white/10 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none placeholder:text-slate-500 text-white leading-relaxed resize-none transition-all"
            />
          </div>

          {/* Quick Idea Chips */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-400 mb-2">
              Or tap an idea to start:
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_INSPIRATIONS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  disabled={isCreating}
                  onClick={() => {
                    setPrompt(item.prompt);
                    setProjectName(item.label.replace(/^[^\s]+\s*/, ''));
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs bg-[#212121] hover:bg-[#2a2a2a] border border-white/5 hover:border-white/15 text-slate-300 transition-all active:scale-95 text-left disabled:opacity-50"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Project Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Project Name (Optional)
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              disabled={isCreating}
              placeholder="e.g. Lumina Studios Portfolio"
              className="w-full px-4 py-2.5 rounded-xl bg-[#0d0d0d] border border-white/10 text-xs text-white placeholder:text-slate-500 outline-none focus:border-brand-500 transition-all"
            />
          </div>

          {/* Creation Progress Banner */}
          {isCreating && (
            <div className="p-4 rounded-2xl bg-brand-950/40 border border-brand-500/30 text-white flex items-center space-x-3 animate-in fade-in duration-200">
              <Loader2 className="w-5 h-5 text-brand-400 animate-spin flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-brand-300">Generating with Gemini AI</p>
                <p className="text-[11px] text-slate-300 mt-0.5">{creationStep}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-white/5 bg-[#141414] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!prompt.trim() || isCreating}
            onClick={handleDirectGenerate}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-brand-600/30 hover:shadow-brand-600/50 transition-all flex items-center space-x-2 active:scale-95"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Build Website with Gemini</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
