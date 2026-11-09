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
  X,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { SystemHealthStatus } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

interface NavbarProps {
  onOpenNewProject?: () => void;
}

export function Navbar({ onOpenNewProject }: NavbarProps) {
  const { user, logout } = useAuth();
  const [health, setHealth] = useState<SystemHealthStatus | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(() => {});

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      setShowInstallGuide(true);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'DX';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#171717]/95 backdrop-blur-md border-b border-white/10 text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          {/* Logo & Platform Title */}
          <div className="flex items-center space-x-3 sm:space-x-6">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-2.5 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-md group-hover:scale-105 transition-transform ring-1 ring-white/10">
                <span className="tracking-tighter">D</span>
                <span className="text-amber-300 text-[10px] sm:text-xs font-mono ml-0.5">X</span>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-1 sm:gap-1.5">
                  DeployX
                  <span className="px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] font-mono font-medium bg-white/10 text-slate-300 border border-white/10">
                    Pro
                  </span>
                </span>
                <span className="hidden sm:inline text-[10px] text-slate-400 font-medium">Software Engineering Platform</span>
              </div>
            </Link>

            {/* Navigation links for tablet & desktop */}
            <nav className="hidden md:flex items-center space-x-1 text-xs sm:text-sm font-medium text-slate-300">
              <Link href="/" className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-colors">
                Workspace
              </Link>
              <Link href="#templates" className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-colors">
                Blueprints
              </Link>
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* PWA Install Button */}
            {!isStandalone && (
              <button
                onClick={handleInstallClick}
                className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-white/10 bg-[#212121] hover:bg-[#2a2a2a] text-slate-200 text-xs font-semibold shadow-sm transition-all"
                title="Install DeployX app on your device"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden xs:inline">Install App</span>
              </button>
            )}

            {/* System Status Pill */}
            <button
              onClick={() => setShowStatusModal(true)}
              className="hidden sm:flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 bg-[#212121] hover:bg-[#2a2a2a] transition-colors"
            >
              <span className={`w-2 h-2 rounded-full ${health?.ai.isMock ? 'bg-amber-400' : 'bg-emerald-500'} animate-pulse`} />
              <span className="text-slate-300 text-[11px] sm:text-xs">
                {health ? (health.ai.isMock ? 'Demo Engine' : health.ai.activeProvider) : 'Ready'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* New Project Primary CTA */}
            {onOpenNewProject && (
              <button
                onClick={onOpenNewProject}
                className="flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/20 hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </button>
            )}

            {/* User Profile Dropdown */}
            {user && (
              <div className="relative pl-1 sm:pl-2 border-l border-white/10">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-1.5 p-1 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-[11px] sm:text-xs font-bold ring-2 ring-white/10">
                    {getInitials(user.name)}
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#1e1e1e] border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 text-xs">
                    <div className="p-2.5 border-b border-white/10 mb-1">
                      <div className="font-bold text-white truncate">{user.name}</div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</div>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full px-2.5 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 font-medium transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out of DeployX</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* PWA Install Guide Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1e1e1e] rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-white/10 text-white animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-brand-400" />
                <h3 className="font-bold text-white text-base">Install DeployX App</h3>
              </div>
              <button
                onClick={() => setShowInstallGuide(false)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-slate-300">
              <p>DeployX runs natively as an app on PC, Mac, iPad, iPhone, and Android:</p>

              <div className="p-3 bg-[#262626] rounded-2xl border border-white/5 space-y-1.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-brand-400" />
                  <span>On Laptop & PC (Chrome / Edge / Brave):</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Click the <strong>Install</strong> icon in your browser address bar (top-right).
                </p>
              </div>

              <div className="p-3 bg-[#262626] rounded-2xl border border-white/5 space-y-1.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-brand-400" />
                  <span>On iPhone & iPad (Safari):</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Tap <strong>Share</strong> ➔ <strong>"Add to Home Screen"</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInstallGuide(false)}
              className="mt-5 w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs shadow-md transition-all"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}

      {/* System Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1e1e1e] rounded-3xl shadow-2xl max-w-md w-full p-6 border border-white/10 text-white animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <Server className="w-5 h-5 text-brand-400" />
                <h3 className="font-bold text-white text-base">DeployX Platform Status</h3>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-[#262626] rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                    AI Provider
                  </span>
                  <span className="font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded text-[11px]">
                    {health?.ai.isMock ? 'Demo Simulation' : health?.ai.activeProvider}
                  </span>
                </div>
                <p className="text-slate-400 mt-1">
                  DeployX Intelligent Synthesizer active for safe, instant zero-cost generation.
                </p>
              </div>

              <div className="p-3 bg-[#262626] rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    Payments Gateway
                  </span>
                  <span className="font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px]">
                    Stripe Test Mode
                  </span>
                </div>
                <p className="text-slate-400 mt-1">
                  Server-side webhook verification enabled. Zero card data stored.
                </p>
              </div>

              <div className="p-3 bg-[#262626] rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    OTP Verification
                  </span>
                  <span className="font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded text-[11px]">
                    Sandbox Active
                  </span>
                </div>
                <p className="text-slate-400 mt-1">
                  Server-side SHA-256 HMAC code hashing and brute-force attempt limits active.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <button
                onClick={() => setShowStatusModal(false)}
                className="w-full py-2.5 bg-[#262626] hover:bg-[#333333] text-slate-200 font-semibold rounded-xl text-xs transition-colors border border-white/5"
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
