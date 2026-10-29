'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Plus,
  Server,
  Download,
  ChevronDown,
  CreditCard,
  ShieldCheck,
  Smartphone,
  Laptop,
  Check,
  X
} from 'lucide-react';
import { SystemHealthStatus } from '@/lib/types';

interface NavbarProps {
  onOpenNewProject?: () => void;
}

export function Navbar({ onOpenNewProject }: NavbarProps) {
  const [health, setHealth] = useState<SystemHealthStatus | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(() => {});

    // Check if already running as installed PWA app
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }

    // Capture PWA install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstallGuide(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          {/* Logo & Platform Title */}
          <div className="flex items-center space-x-3 sm:space-x-6">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-2.5 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-md group-hover:scale-105 transition-transform">
                <span className="tracking-tighter">D</span>
                <span className="text-amber-300 text-[10px] sm:text-xs font-mono ml-0.5">X</span>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-navy-900 flex items-center gap-1 sm:gap-1.5">
                  DeployX
                  <span className="px-1.5 py-0.2 sm:py-0.5 rounded text-[9px] sm:text-[10px] font-semibold tracking-normal bg-brand-50 text-brand-700 border border-brand-200">
                    All-Device
                  </span>
                </span>
                <span className="hidden sm:inline text-[10px] text-slate-500 font-medium">Software Engineering Platform</span>
              </div>
            </Link>

            {/* Navigation links for tablet & desktop */}
            <nav className="hidden md:flex items-center space-x-1 text-xs sm:text-sm font-medium text-slate-600">
              <Link href="/" className="px-3 py-1.5 rounded-lg hover:text-navy-900 hover:bg-slate-100 transition-colors">
                Projects
              </Link>
              <Link href="#templates" className="px-3 py-1.5 rounded-lg hover:text-navy-900 hover:bg-slate-100 transition-colors">
                Blueprints
              </Link>
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* PWA Install Button (Works on PC, Laptop, Tab, Mobile) */}
            {!isStandalone && (
              <button
                onClick={handleInstallClick}
                className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-700 text-xs font-semibold shadow-sm transition-all"
                title="Install DeployX app on your device"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden xs:inline">Install App</span>
              </button>
            )}

            {/* System Status Pill */}
            <button
              onClick={() => setShowStatusModal(true)}
              className="hidden sm:flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <span className={`w-2 h-2 rounded-full ${health?.ai.isMock ? 'bg-amber-400' : 'bg-emerald-500'} animate-pulse`} />
              <span className="text-slate-700 text-[11px] sm:text-xs">
                {health ? (health.ai.isMock ? 'Demo Mode' : health.ai.activeProvider) : 'Connecting...'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* New Project Primary CTA */}
            {onOpenNewProject && (
              <button
                onClick={onOpenNewProject}
                className="flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm hover:shadow transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </button>
            )}

            {/* User Profile Avatar */}
            <div className="flex items-center space-x-2 pl-1 sm:pl-2 border-l border-slate-200">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-navy-900 text-white flex items-center justify-center text-[11px] sm:text-xs font-bold ring-2 ring-brand-100">
                VA
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* PWA Install Guide Modal (for iOS Safari, Android & Desktop browsers) */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-navy-900 text-base">Install DeployX App</h3>
              </div>
              <button
                onClick={() => setShowInstallGuide(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-slate-600">
              <p>DeployX runs natively as an app on PC, Mac, iPad, iPhone, and Android:</p>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-bold text-navy-900 flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-brand-600" />
                  <span>On Laptop & Desktop (Chrome / Edge / Brave):</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Click the <strong>Install</strong> icon in your browser address bar (top-right) or select <em>Settings ➔ Install DeployX</em>.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-bold text-navy-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-brand-600" />
                  <span>On iPhone & iPad (Safari):</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Tap the <strong>Share</strong> button at the bottom of Safari, then choose <strong>"Add to Home Screen"</strong>.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-bold text-navy-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>On Android (Chrome):</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Tap the three-dots menu (top-right) and choose <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInstallGuide(false)}
              className="mt-5 w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* System Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
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

            <div className="mt-4 space-y-3 text-xs">
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
                    ? 'DeployX Intelligent Synthesizer active for safe, instant zero-cost generation.'
                    : `Connected to ${health?.ai.activeProvider}.`}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    Payments Gateway
                  </span>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                    {health?.integrations.stripeConfigured ? 'Stripe Keys' : 'Test Mode Simulator'}
                  </span>
                </div>
                <p className="text-slate-500 mt-1">
                  Server-side webhook verification enabled. Zero card data stored.
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
                  Server-side SHA-256 HMAC code hashing and brute-force attempt limits active.
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
