'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Layers,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  Loader2,
  Wand2,
  ChevronRight,
  X
} from 'lucide-react';
import { PROJECT_TEMPLATES, ProjectTemplate } from '@/lib/templates';
import { ClarificationQuestion } from '@/lib/types';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewProjectModal({ isOpen, onClose }: NewProjectModalProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [projectName, setProjectName] = useState('');
  const [activeTab, setActiveTab] = useState<string>('All');
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [questions, setQuestions] = useState<ClarificationQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'prompt' | 'clarify'>('prompt');

  if (!isOpen) return null;

  const categories = ['All', 'Hospitality', 'SaaS', 'E-Commerce', 'Portfolio', 'Developer'];
  const filteredTemplates = activeTab === 'All'
    ? PROJECT_TEMPLATES
    : PROJECT_TEMPLATES.filter(t => t.category === activeTab);

  const handleSelectTemplate = (template: ProjectTemplate) => {
    setProjectName(template.name);
    setPrompt(template.prompt);
  };

  const handleNextStep = async () => {
    if (!prompt.trim()) return;

    setIsLoadingQuestions(true);
    try {
      const res = await fetch('/api/ai/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        const defaults: Record<string, string> = {};
        data.questions.forEach((q: ClarificationQuestion) => {
          defaults[q.id] = q.options[0];
        });
        setSelectedAnswers(defaults);
        setStep('clarify');
      } else {
        handleFinalCreate({});
      }
    } catch {
      handleFinalCreate({});
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleFinalCreate = async (answersOverride?: Record<string, string>) => {
    setIsCreating(true);
    try {
      const name = projectName.trim() || prompt.slice(0, 32) || 'New DeployX Project';

      const createRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: prompt,
          initialPrompt: prompt,
          tags: ['Web App', 'AI Generated']
        })
      });
      const createData = await createRes.json();
      const project = createData.project;

      await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          prompt,
          clarifications: answersOverride || selectedAnswers
        })
      });

      onClose();
      router.push(`/projects/${project.id}`);
    } catch {
      alert('Error creating project. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[92dvh] sm:max-h-[90vh] flex flex-col animate-in fade-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 sm:px-8 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-navy-900 text-sm sm:text-base md:text-lg">
                {step === 'prompt' ? 'Create Project on DeployX' : 'Refine Essential Details'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                {step === 'prompt' ? 'Describe your vision or choose a starter blueprint' : 'DeployX identified clarifying questions before building'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-grow p-5 sm:p-8 space-y-5">
          {/* Step 1: Prompt & Templates */}
          {step === 'prompt' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Project Title (Optional)
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Aura Artisan Table & Hearth"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 outline-none placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Natural-Language Description
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  placeholder="e.g. Build an artisan restaurant with table reservations, $25 deposit checkout via Stripe test mode, and SMS OTP verification..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 outline-none placeholder:text-slate-400 leading-relaxed"
                />
              </div>

              {/* Starter Templates */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2.5">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Or select a starter blueprint
                  </span>
                  <div className="flex flex-wrap gap-1 text-[11px] font-medium text-slate-500">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        className={`px-2 py-0.5 rounded-md transition-colors ${
                          activeTab === cat ? 'bg-brand-50 text-brand-700 font-semibold' : 'hover:bg-slate-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-52 overflow-y-auto pr-1">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className="p-3 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/20 cursor-pointer transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-navy-900">{template.name}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                            {template.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {template.description}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-brand-600 font-semibold">
                        <span className="truncate">{template.features.join(' • ')}</span>
                        <ChevronRight className="w-3 h-3 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Concise Clarifications */}
          {step === 'clarify' && (
            <div className="space-y-4">
              <div className="p-3 bg-brand-50/70 rounded-xl border border-brand-100 text-xs text-brand-900 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold">DeployX Intelligence Clarifier:</span> Confirm preferences to tune the initial build:
                </div>
              </div>

              <div className="space-y-3.5">
                {questions.map((q) => (
                  <div key={q.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <h4 className="font-bold text-xs text-navy-900 mb-1">{q.question}</h4>
                    {q.context && <p className="text-[11px] text-slate-500 mb-2">{q.context}</p>}

                    <div className="grid grid-cols-1 gap-1.5">
                      {q.options.map((opt) => {
                        const isSelected = selectedAnswers[q.id] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setSelectedAnswers({ ...selectedAnswers, [q.id]: opt })}
                            className={`px-3 py-2 rounded-xl text-left text-xs font-medium border transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-white border-brand-500 text-brand-700 shadow-sm ring-1 ring-brand-500'
                                : 'bg-white/70 border-slate-200 text-slate-700 hover:bg-white'
                            }`}
                          >
                            <span>{opt}</span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0 ml-2" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Action Bar */}
        <div className="p-4 sm:px-8 border-t border-slate-100 bg-white flex items-center justify-between flex-shrink-0">
          {step === 'prompt' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!prompt.trim() || isLoadingQuestions}
                onClick={handleNextStep}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
              >
                {isLoadingQuestions ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Next: Build</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('prompt')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={isCreating}
                onClick={() => handleFinalCreate()}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing Files...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Generate Project</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
