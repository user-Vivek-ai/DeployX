'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Wand2,
  Terminal,
  ShieldAlert,
  Info
} from 'lucide-react';
import { ChatMessage, FileChange } from '@/lib/types';

interface ChatBuilderProps {
  projectId: string;
  messages: ChatMessage[];
  onSendMessage: (prompt: string) => Promise<void>;
  isLoading: boolean;
  activeProviderName?: string;
  isSimulated?: boolean;
}

export function ChatBuilder({
  projectId,
  messages,
  onSendMessage,
  isLoading,
  activeProviderName = 'Demo AI Engine (Simulation)',
  isSimulated = true
}: ChatBuilderProps) {
  const [inputPrompt, setInputPrompt] = useState('');
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isLoading) return;
    const promptToSend = inputPrompt.trim();
    setInputPrompt('');
    await onSendMessage(promptToSend);
  };

  const handleChipClick = (suggestion: string) => {
    onSendMessage(suggestion);
  };

  const toggleReasoning = (msgId: string) => {
    setExpandedReasoning(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Top Header */}
      <div className="h-12 px-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-brand-600" />
          <span className="font-bold text-xs text-navy-900">DeployX Conversational Builder</span>
        </div>

        {/* Provider Indicator Badge */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>{isSimulated ? 'Simulation Mode (No API keys charged)' : activeProviderName}</span>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-grow overflow-y-auto p-4 space-y-5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
              <Bot className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-700">Ready to Build</h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Instruct DeployX to modify layouts, connect Stripe checkout, tweak colors, or add custom sections.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isReasoningOpen = expandedReasoning[msg.id] ?? false;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs leading-relaxed ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                    isUser
                      ? 'bg-navy-900 text-white'
                      : 'bg-brand-600 text-white shadow-sm'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Body */}
                <div
                  className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-3 sm:p-4 shadow-sm border ${
                    isUser
                      ? 'bg-navy-900 text-white border-navy-800 rounded-tr-none'
                      : 'bg-white text-slate-800 border-slate-200 rounded-tl-none'
                  }`}
                >
                  {/* Assistant reasoning expander */}
                  {!isUser && msg.reasoning && (
                    <div className="mb-3 pb-2.5 border-b border-slate-100">
                      <button
                        onClick={() => toggleReasoning(msg.id)}
                        className="flex items-center justify-between w-full text-[11px] font-semibold text-brand-700 hover:text-brand-800 bg-brand-50/60 px-2.5 py-1.5 rounded-lg border border-brand-100/80 transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-brand-600" />
                          <span>AI Engineering Synthesis Plan</span>
                        </span>
                        {isReasoningOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isReasoningOpen && (
                        <div className="mt-2 p-3 bg-slate-50 rounded-xl text-slate-600 text-[11px] leading-relaxed whitespace-pre-line border border-slate-200">
                          {msg.reasoning}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Main content */}
                  <div className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>

                  {/* File changes summary */}
                  {!isUser && msg.fileChanges && msg.fileChanges.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Files Modified ({msg.fileChanges.length})
                      </span>
                      <div className="space-y-1">
                        {msg.fileChanges.map((change, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100 text-[11px]"
                          >
                            <span className="font-mono text-slate-700 flex items-center gap-1.5">
                              <FileCode className="w-3 h-3 text-slate-400" />
                              {change.path}
                            </span>
                            <span
                              className={`text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded ${
                                change.changeType === 'created'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-brand-100 text-brand-800'
                              }`}
                            >
                              {change.changeType}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Follow-up suggestions */}
                  {!isUser && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                        Suggested Next Steps:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestedActions.map((action, i) => (
                          <button
                            key={i}
                            onClick={() => handleChipClick(action)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 text-slate-600 text-[11px] font-medium border border-slate-200 transition-colors text-left"
                          >
                            + {action}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Loading Progress State */}
        {isLoading && (
          <div className="flex gap-3 text-xs leading-relaxed">
            <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl rounded-tl-none border border-slate-200 max-w-[85%]">
              <div className="flex items-center space-x-2 text-brand-700 font-semibold text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>DeployX is synthesizing changes & updating virtual files...</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Validating security boundaries, updating DOM elements, and regenerating sandbox preview.
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-2.5 sm:p-3.5 bg-slate-50/70 border-t border-slate-200 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isLoading}
            placeholder="Describe changes, e.g. 'Add customer reviews' or 'Change color to emerald'..."
            className="flex-grow px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-semibold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center space-x-1 flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span className="hidden xs:inline">Send</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
