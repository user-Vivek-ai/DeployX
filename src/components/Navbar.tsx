'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Plus,
  Terminal,
  ShieldCheck,
  CreditCard,
  Layers,
  ChevronDown,
  Info,
  Server
} from 'lucide-react';
import { SystemHealthStatus } from '@/lib/types';

interface NavbarProps {
  onOpenNewProject?: () => void;
}

export function Navbar({ onOpenNewProject }: NavbarProps) {
  const [health, setHealth] = useState<SystemHealthStatus | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(() => {});
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 text-white flex items-center justify-center font-black text-xl shadow-md group-hover:scale-105 transition-transform">
                <span className="tracking-tighter">D</span>
                <span className="text-amber-300 text-xs font-mono ml-0.5">X</span>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-navy-900 flex items-center gap-1.5">
                  DeployX
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-normal bg-brand-50 text-brand-700 border border-brand-200">
                    v1.0
                  </span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Software Engineering Platform</span>
              </div>
            </Link>

            {/* Main Nav Links */}
            <nav className="hidden md:flex items-center space-x-1 text-sm font-medium text-slate-600">
              <Link href="/" className="px-3 py-1.5 rounded-lg hover:text-navy-900 hover:bg-slate-100 transition-colors">
                Projects
              </Link>
              <Link href="#templates" className="px-3 py-1.5 rounded-lg hover:text-navy-900 hover:bg-slate-100 transition-colors">
                Templates
              </Link>
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-3">
            {/* System Status Pill */}
            <button
              onClick={() => setShowStatusModal(true)}
              className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <span className={`w-2 h-2 rounded-full ${health?.ai.isMock ? 'bg-amber-400' : 'bg-emerald-500'} animate-pulse`} />
              <span className="text-slate-700">
                {health ? (health.ai.isMock ? 'Demo Engine' : health.ai.activeProvider) : 'Connecting...'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* New Project Primary CTA */}
            {onOpenNewProject && (
              <button
                onClick={onOpenNewProject}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm hover:shadow transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </button>
            )}

            {/* User Profile Avatar */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-navy-900 text-white flex items-center justify-center text-xs font-bold ring-2 ring-brand-100">
                VA
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* System Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Server className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-navy-900 text-base">DeployX Platform Status</h3>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                    AI Provider Adapter
                  </span>
                  <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                    {health?.ai.isMock ? 'Demo / Simulation Mode' : 'Live Provider Active'}
                  </span>
                </div>
                <p className="text-slate-500 mt-1">
                  {health?.ai.isMock
                    ? 'No external model keys configured. Using DeployX Intelligent Synthesizer for safe, zero-cost development.'
                    : `Connected to ${health?.ai.activeProvider}. Keys loaded securely from server environment.`}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    Payments Gateway
                  </span>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                    {health?.integrations.stripeConfigured ? 'Live Stripe Keys' : 'Stripe Test Mode Simulator'}
                  </span>
                </div>
                <p className="text-slate-500 mt-1">
                  Transactions use test tokens (<code className="font-mono text-slate-700">4242 4242...</code>). Server-side webhook verification enabled.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    Two-Factor OTP Security
                  </span>
                  <span className="font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded text-[11px]">
                    {health?.integrations.otpConfigured ? 'Twilio Verify' : 'Demo OTP Sandbox'}
                  </span>
                </div>
                <p className="text-slate-500 mt-1">
                  Server-side SHA-256 code hashing, 5-minute expiry, and brute-force attempt limits active.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <button
                onClick={() => setShowStatusModal(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Close Status Overview
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
