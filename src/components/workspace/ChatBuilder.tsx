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
  Loader2,
  ExternalLink,
  Code2,
  Zap,
  ArrowUp
} from 'lucide-react';
import { ChatMessage } from '@/lib/types';

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
  activeProviderName = 'Google Gemini 1.5 Flash',
  isSimulated = false
}: ChatBuilderProps) {
  const [inputPrompt, setInputPrompt] = useState('');
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || isLoading) return;
    const promptToSend = inputPrompt.trim();
    setInputPrompt('');
    await onSendMessage(promptToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleReasoning = (msgId: string) => {
    setExpandedReasoning(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  return (
    <div className="flex flex-col h-full bg-[#111111] text-slate-100 border-r border-white/5 font-sans">
      {/* Top Header */}
      <div className="h-12 px-4 bg-[#171717] border-b border-white/5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-xs text-white">DeployX Chat</span>
        </div>

        {/* AI Provider Status */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{isSimulated ? 'DeployX Engine' : activeProviderName}</span>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-grow overflow-y-auto p-4 sm:p-5 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-4 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600/20 to-indigo-600/20 text-brand-400 border border-brand-500/30 flex items-center justify-center shadow-lg">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">DeployX Conversational Builder</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
                Describe any website or request modifications in plain English. No forms or questionnaires.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-sm pt-2">
              {[
                'Make the background dark purple',
                'Add customer testimonials',
                'Add pricing plans table',
                'Change accent color to emerald'
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => onSendMessage(suggestion)}
                  className="px-3 py-1.5 rounded-xl text-xs bg-[#1c1c1c] hover:bg-[#252525] border border-white/5 hover:border-white/15 text-slate-300 transition-all text-left"
                >
                  + {suggestion}
                </button>
              ))}
            </div>
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
                      ? 'bg-[#2b2b2b] text-white border border-white/10'
                      : 'bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-sm'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Message Body */}
                <div
                  className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-3.5 sm:p-4 shadow-sm ${
                    isUser
                      ? 'bg-[#262626] text-white border border-white/10 rounded-tr-none'
                      : 'bg-[#1c1c1c] text-slate-200 border border-white/5 rounded-tl-none space-y-3'
                  }`}
                >
                  {/* Reasoning toggle (Claude-style thinking expander) */}
                  {!isUser && msg.reasoning && (
                    <div className="pb-2 border-b border-white/5">
                      <button
                        onClick={() => toggleReasoning(msg.id)}
                        className="flex items-center justify-between w-full text-[11px] font-semibold text-brand-300 hover:text-brand-200 bg-brand-950/40 px-2.5 py-1.5 rounded-lg border border-brand-500/20 transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-brand-400" />
                          <span>AI Engineering Plan</span>
                        </span>
                        {isReasoningOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isReasoningOpen && (
                        <div className="mt-2 p-2.5 bg-[#141414] rounded-xl text-slate-400 text-[11px] leading-relaxed whitespace-pre-line border border-white/5">
                          {msg.reasoning}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Main content */}
                  <div className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap text-slate-200">
                    {msg.content}
                  </div>

                  {/* Claude-Style Artifact Card */}
                  {!isUser && (
                    <div className="p-3 rounded-xl bg-[#141414] border border-white/10 flex items-center justify-between group hover:border-brand-500/30 transition-all">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
                          <FileCode className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-white">index.html</p>
                          <p className="text-[10px] text-slate-400">Interactive Single-Page Website</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                        Live in Artifacts ↗
                      </span>
                    </div>
                  )}

                  {/* Suggested follow-ups */}
                  {!isUser && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {msg.suggestedActions.slice(0, 3).map((action, i) => (
                        <button
                          key={i}
                          onClick={() => onSendMessage(action)}
                          className="px-2.5 py-1 rounded-lg bg-[#252525] hover:bg-[#2e2e2e] text-slate-300 text-[11px] font-medium border border-white/5 transition-colors text-left"
                        >
                          + {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Loading Progress State */}
        {isLoading && (
          <div className="flex gap-3 text-xs leading-relaxed animate-in fade-in duration-150">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="p-4 bg-[#1c1c1c] rounded-2xl rounded-tl-none border border-white/10 max-w-[85%] space-y-1.5">
              <div className="flex items-center space-x-2 text-brand-300 font-semibold text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                <span>DeployX is writing code and updating your website...</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Updating virtual DOM, styling, and refreshing live artifact preview.
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Claude-Style Floating Input Bar */}
      <div className="p-3 sm:p-4 bg-[#141414] border-t border-white/5 flex-shrink-0">
        <form onSubmit={handleSubmit} className="relative bg-[#1f1f1f] border border-white/10 focus-within:border-brand-500/50 rounded-2xl p-2 transition-all">
          <textarea
            ref={inputRef}
            rows={2}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask DeployX to modify layout, change colors, add sections, or wire up buttons... (Enter to send)"
            className="w-full bg-transparent px-3 py-1.5 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none resize-none leading-relaxed disabled:opacity-50"
          />
          <div className="flex items-center justify-between pt-1 px-2 border-t border-white/5">
            <span className="text-[11px] text-slate-500">
              Enter to send • Shift+Enter for new line
            </span>
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isLoading}
              className="w-7 h-7 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-md active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
