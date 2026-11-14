'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function AuthPortal() {
  const { login, setUser } = useAuth();

  // Mode: 'signup' vs 'login'
  const [mode, setMode] = useState<'signup' | 'login'>('signup');

  // Multi-step signup: 1 = Details, 2 = OTP Verification, 3 = Password
  const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Status & Timers
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(300); // 5-minute expiration
  const [resendCooldown, setResendCooldown] = useState(0); // 60-second cooldown

  // 3D Tilt & Cursor Physics State
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Smooth 3D Cursor Movement Tracker
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      const normX = (clientX - innerWidth / 2) / (innerWidth / 2);
      const normY = (clientY - innerHeight / 2) / (innerHeight / 2);

      setMousePos({ x: clientX, y: clientY });
      setTilt({
        x: normY * -12,
        y: normX * 12
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 5-Minute OTP Expiry Countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (signupStep === 2 && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [signupStep, timerSeconds]);

  // 60-Second Resend Cooldown Countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Real-time password requirement checkers
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && passwordsMatch;

  // Step 1: Submit Details & Dispatch Real Email OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanName || !cleanEmail) {
      setErrorMsg('Please enter both your name and email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to dispatch verification code.');
        return;
      }

      setSignupStep(2);
      setTimerSeconds(data.expiresInSeconds || 300);
      setResendCooldown(data.resendCooldownSeconds || 60);
      setSuccessMsg(`✓ 6-Digit verification code dispatched to ${cleanEmail}. Check your inbox and spam folder.`);
    } catch {
      setErrorMsg('Network error. Please verify your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP Action (Enforces 60-second cooldown)
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          isResend: true
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to resend verification code.');
        if (data.cooldownRemaining) {
          setResendCooldown(data.cooldownRemaining);
        }
        return;
      }

      setTimerSeconds(data.expiresInSeconds || 300);
      setResendCooldown(data.resendCooldownSeconds || 60);
      setOtpCode('');
      setSuccessMsg(`✓ New 6-digit verification code sent to ${email.trim()}. Check your inbox.`);
    } catch {
      setErrorMsg('Network error while requesting code resend.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify 6-Digit OTP & Advance to Password Step
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanCode = otpCode.trim().replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit verification code.');
      return;
    }

    if (timerSeconds <= 0) {
      setErrorMsg('Verification code has expired. Please click "Resend Code".');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: cleanCode
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Invalid verification code. Please check and try again.');
        return;
      }

      if (data.needsPassword) {
        setSuccessMsg('✓ Email verified successfully! Now create your password.');
        setSignupStep(3);
      } else {
        setSuccessMsg('✓ Account created successfully! Logging you in...');
        if (data.user) {
          setUser(data.user);
        }
        setTimeout(() => {
          window.location.reload();
        }, 700);
      }
    } catch {
      setErrorMsg('Network error during verification.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Complete Signup with Password
  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isPasswordValid) {
      setErrorMsg('Please ensure your password meets all requirements and matches.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to complete registration.');
        return;
      }

      setSuccessMsg('✓ Account created successfully! Logging in...');
      const loginRes = await login(email.trim().toLowerCase(), password);
      if (loginRes.success) {
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        setMode('login');
      }
    } catch {
      setErrorMsg('Network error during registration completion.');
    } finally {
      setIsLoading(false);
    }
  };

  // Login: Just Email + Password
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email.trim().toLowerCase(), password);
      if (!result.success) {
        setErrorMsg(result.error || 'Invalid email or password.');
      } else {
        setSuccessMsg('✓ Sign in successful! Entering workspace...');
      }
    } catch {
      setErrorMsg('Network error during sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative min-h-screen w-full bg-[#05070d] text-slate-100 flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none font-sans">
      {/* ========================================================================= */}
      {/* 1. DYNAMIC NEON 3D BACKGROUND MATRIX & CURSOR LIGHTING                    */}
      {/* ========================================================================= */}

      {/* Dynamic Cursor Neon Lighting Sphere */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `
            radial-gradient(700px circle at ${mousePos.x}px ${mousePos.y}px, rgba(0, 240, 255, 0.18), transparent 60%),
            radial-gradient(900px circle at ${mousePos.x * 0.8}px ${mousePos.y * 0.8}px, rgba(168, 85, 247, 0.14), transparent 70%)
          `
        }}
      />

      {/* Cybernetic 3D Perspective Grid with dynamic tilt */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-25 transition-transform duration-300 ease-out"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 240, 255, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(168, 85, 247, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '56px 56px',
          transform: `perspective(900px) rotateX(${tilt.x * 0.5 + 15}deg) rotateY(${tilt.y * 0.5}deg) scale(1.15)`
        }}
      />

      {/* Floating Neon Orbital Glow Orbs */}
      <div
        className="pointer-events-none absolute w-[500px] h-[500px] rounded-full blur-[120px] -top-32 -left-32 animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(0, 240, 255, 0.25) 0%, rgba(99, 102, 241, 0.15) 50%, transparent 80%)',
          transform: `translate(${mousePos.x * 0.03}px, ${mousePos.y * 0.03}px)`
        }}
      />
      <div
        className="pointer-events-none absolute w-[520px] h-[520px] rounded-full blur-[130px] -bottom-32 -right-32 animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(217, 70, 239, 0.25) 0%, rgba(168, 85, 247, 0.15) 50%, transparent 80%)',
          transform: `translate(${mousePos.x * -0.03}px, ${mousePos.y * -0.03}px)`
        }}
      />
      <div
        className="pointer-events-none absolute w-[360px] h-[360px] rounded-full blur-[100px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          background: 'radial-gradient(circle, rgba(0, 255, 157, 0.12) 0%, transparent 70%)',
        }}
      />

      {/* Floating 3D Geometric Cyber Wireframe Particles */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute top-1/4 left-10 w-2 h-2 rounded-full bg-[#00f0ff] shadow-[0_0_12px_#00f0ff] animate-ping"
          style={{ animationDuration: '3s' }}
        />
        <div
          className="absolute top-3/4 right-16 w-2.5 h-2.5 rounded-full bg-[#d946ef] shadow-[0_0_15px_#d946ef] animate-pulse"
          style={{ animationDuration: '4s' }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-[#00ff9d] shadow-[0_0_10px_#00ff9d] animate-ping"
          style={{ animationDuration: '5s' }}
        />
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN 3D HOLOGRAPHIC NEON CARD                                          */}
      {/* ========================================================================= */}
      <div
        ref={cardRef}
        style={{
          transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.01, 1.01, 1.01)`,
          transformStyle: 'preserve-3d',
          boxShadow: `
            0 0 35px rgba(0, 240, 255, 0.22),
            0 0 70px rgba(168, 85, 247, 0.18),
            0 25px 60px rgba(0, 0, 0, 0.9),
            inset 0 1px 1px rgba(255, 255, 255, 0.2)
          `
        }}
        className="relative z-10 w-full max-w-md bg-[#0a0f1d]/85 border border-[#00f0ff]/30 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl transition-transform duration-200 ease-out my-4 overflow-hidden"
      >
        {/* Animated Neon Gradient Border Beam Effect */}
        <div
          className="absolute -inset-[2px] rounded-3xl opacity-40 pointer-events-none -z-10 blur-sm"
          style={{
            background: 'linear-gradient(135deg, #00f0ff 0%, #a855f7 50%, #00ff9d 100%)'
          }}
        />

        {/* Inner Glass Highlight */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none" />

        <div style={{ transform: 'translateZ(35px)' }} className="relative z-20">
          {/* Logo & High-Tech Neon Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-3 group">
              {/* Outer Neon Glow Ring */}
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#00f0ff] via-[#a855f7] to-[#00ff9d] opacity-75 blur-md group-hover:opacity-100 transition-opacity animate-pulse" />
              <div className="relative w-14 h-14 rounded-2xl bg-[#080d1a] border border-[#00f0ff]/50 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)]">
                <span className="text-2xl font-black bg-gradient-to-tr from-[#00f0ff] via-[#e0e7ff] to-[#a855f7] bg-clip-text text-transparent tracking-tighter">
                  Dx
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-[0_0_12px_rgba(0,240,255,0.5)]">
                DeployX
              </h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#00f0ff]/15 border border-[#00f0ff]/40 text-[#00f0ff] font-mono font-bold tracking-wider shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                AI HUB
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1.5 font-medium tracking-wide">
              Autonomous Intelligence &amp; Cloud Deployment
            </p>
          </div>

          {/* Futuristic Neon Mode Toggle: Sign Up vs Log In */}
          <div className="grid grid-cols-2 p-1 bg-[#060a14]/90 rounded-2xl border border-[#00f0ff]/20 mb-5 text-xs font-bold shadow-inner">
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setSuccessMsg(null);
                setSignupStep(1);
              }}
              className={`py-2.5 rounded-xl transition-all duration-300 ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-[#00f0ff]/25 to-[#a855f7]/30 text-white border border-[#00f0ff]/50 shadow-[0_0_15px_rgba(0,240,255,0.35)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up (New)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2.5 rounded-xl transition-all duration-300 ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-[#00f0ff]/25 to-[#a855f7]/30 text-white border border-[#00f0ff]/50 shadow-[0_0_15px_rgba(0,240,255,0.35)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Log In (Existing)
            </button>
          </div>

          {/* Neon Alert / Status Messages */}
          {errorMsg && (
            <div className="mb-4 p-3.5 bg-rose-500/15 border border-rose-500/40 text-rose-200 rounded-2xl text-xs flex items-start gap-2.5 shadow-[0_0_15px_rgba(244,63,94,0.2)] animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 rounded-2xl text-xs flex items-start gap-2.5 shadow-[0_0_15px_rgba(16,185,129,0.25)] animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* SIGNUP FLOW (3-STEP: DETAILS -> OTP -> PASSWORD)               */}
          {/* ============================================================== */}
          {mode === 'signup' && (
            <div>
              {/* Neon Step Progress Tracker */}
              <div className="flex items-center justify-between mb-5 px-1">
                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-300">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all ${
                    signupStep >= 1
                      ? 'bg-[#00f0ff] text-black shadow-[0_0_10px_#00f0ff]'
                      : 'bg-[#151c2e] text-slate-500'
                  }`}>
                    1
                  </span>
                  <span className={signupStep === 1 ? 'text-[#00f0ff]' : ''}>Details</span>
                </div>
                <div className="w-8 h-[2px] bg-gradient-to-r from-[#00f0ff]/40 to-[#a855f7]/40" />
                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-300">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all ${
                    signupStep >= 2
                      ? 'bg-[#a855f7] text-white shadow-[0_0_10px_#a855f7]'
                      : 'bg-[#151c2e] text-slate-500'
                  }`}>
                    2
                  </span>
                  <span className={signupStep === 2 ? 'text-[#a855f7]' : ''}>OTP</span>
                </div>
                <div className="w-8 h-[2px] bg-gradient-to-r from-[#a855f7]/40 to-[#00ff9d]/40" />
                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-300">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all ${
                    signupStep >= 3
                      ? 'bg-[#00ff9d] text-black shadow-[0_0_10px_#00ff9d]'
                      : 'bg-[#151c2e] text-slate-500'
                  }`}>
                    3
                  </span>
                  <span className={signupStep === 3 ? 'text-[#00ff9d]' : ''}>Password</span>
                </div>
              </div>

              {/* STAGE 1: Full Name & Email Address */}
              {signupStep === 1 && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#00f0ff]" />
                      <span>Full Name</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Vivek Akula"
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-[#070b16] border border-[#00f0ff]/25 text-white placeholder:text-slate-500 text-xs focus:border-[#00f0ff] focus:ring-2 focus:ring-[#00f0ff]/40 outline-none transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#00f0ff]" />
                      <span>Email Address</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="yourname@gmail.com"
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-[#070b16] border border-[#00f0ff]/25 text-white placeholder:text-slate-500 text-xs focus:border-[#00f0ff] focus:ring-2 focus:ring-[#00f0ff]/40 outline-none transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !name.trim() || !email.trim()}
                    className="w-full mt-2 py-3 bg-gradient-to-r from-[#00f0ff] via-[#6366f1] to-[#a855f7] hover:brightness-110 disabled:opacity-40 text-black font-extrabold rounded-xl text-xs shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center justify-center space-x-1.5 active:scale-[0.98]"
                  >
                    <span>{isLoading ? 'Dispatching Verification OTP...' : 'Send Verification OTP'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}

              {/* STAGE 2: 6-Digit Email Verification Code */}
              {signupStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="p-3 bg-[#080d1c] rounded-2xl border border-[#00f0ff]/20 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[11px]">Verifying account:</span>
                      <div className="font-bold text-[#00f0ff]">{email}</div>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-[#00ff9d]" />
                  </div>

                  <div className="p-3.5 bg-[#00ff9d]/10 border border-[#00ff9d]/30 rounded-2xl flex items-start space-x-3 text-xs shadow-[0_0_15px_rgba(0,255,157,0.15)]">
                    <div className="w-6 h-6 rounded-lg bg-[#00ff9d]/20 text-[#00ff9d] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-bold text-[#00ff9d]">Verification Code Dispatched</p>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        We dispatched a 6-digit confirmation code to <strong className="text-white">{email}</strong>. Check your inbox &amp; spam folder.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Enter 6-Digit Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      required
                      autoFocus
                      className="w-full py-3.5 text-center font-mono text-2xl tracking-[0.5em] rounded-xl bg-[#070b16] border border-[#00f0ff]/40 text-[#00f0ff] placeholder:text-slate-600 focus:ring-2 focus:ring-[#00f0ff] outline-none shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Expires in: <strong className="text-[#00f0ff] font-mono">{formatTimer(timerSeconds)}</strong>
                    </span>
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || isLoading}
                      onClick={handleResendOtp}
                      className="text-[#a855f7] hover:text-[#d946ef] disabled:opacity-40 font-bold transition-colors"
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                    </button>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSignupStep(1)}
                      className="w-1/3 py-2.5 bg-[#151c2e] hover:bg-[#1f2942] text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || otpCode.length !== 6 || timerSeconds <= 0}
                      className="w-2/3 py-2.5 bg-gradient-to-r from-[#00f0ff] to-[#00ff9d] hover:brightness-110 disabled:opacity-40 text-black font-extrabold rounded-xl text-xs shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center justify-center space-x-1.5 active:scale-[0.98]"
                    >
                      <span>{isLoading ? 'Verifying...' : 'Verify OTP'}</span>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>
                </form>
              )}

              {/* STAGE 3: Set Password */}
              {signupStep === 3 && (
                <form onSubmit={handleCompleteSignup} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#00f0ff]" />
                      <span>Create Strong Password</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create strong password"
                        required
                        className="w-full px-4 pr-10 py-2.5 rounded-xl bg-[#070b16] border border-[#00f0ff]/25 text-white placeholder:text-slate-500 text-xs focus:border-[#00f0ff] focus:ring-2 focus:ring-[#00f0ff]/40 outline-none transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#a855f7]" />
                      <span>Confirm Password</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-[#070b16] border border-[#a855f7]/30 text-white placeholder:text-slate-500 text-xs focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/40 outline-none transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                    />
                  </div>

                  {/* Password Requirement Checklist with Neon Checkmarks */}
                  {password.length > 0 && (
                    <div className="p-3 bg-[#080d1c] rounded-xl border border-white/10 space-y-1.5 text-[11px]">
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <span className={`flex items-center space-x-1 ${hasMinLength ? 'text-[#00ff9d]' : 'text-slate-500'}`}>
                          <span>{hasMinLength ? '✓' : '•'} 8+ characters</span>
                        </span>
                        <span className={`flex items-center space-x-1 ${hasUpper ? 'text-[#00ff9d]' : 'text-slate-500'}`}>
                          <span>{hasUpper ? '✓' : '•'} 1 uppercase (A-Z)</span>
                        </span>
                        <span className={`flex items-center space-x-1 ${hasLower ? 'text-[#00ff9d]' : 'text-slate-500'}`}>
                          <span>{hasLower ? '✓' : '•'} 1 lowercase (a-z)</span>
                        </span>
                        <span className={`flex items-center space-x-1 ${hasNumber ? 'text-[#00ff9d]' : 'text-slate-500'}`}>
                          <span>{hasNumber ? '✓' : '•'} 1 number (0-9)</span>
                        </span>
                      </div>
                      {confirmPassword.length > 0 && (
                        <div className={`pt-1 text-[10px] font-bold ${passwordsMatch ? 'text-[#00ff9d]' : 'text-rose-400'}`}>
                          {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || !isPasswordValid}
                    className="w-full mt-2 py-3 bg-gradient-to-r from-[#00f0ff] via-[#a855f7] to-[#00ff9d] hover:brightness-110 disabled:opacity-40 text-black font-extrabold rounded-xl text-xs shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center justify-center space-x-1.5 active:scale-[0.98]"
                  >
                    <span>{isLoading ? 'Creating Account...' : 'Complete & Enter Workspace'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* LOGIN FLOW (JUST EMAIL & PASSWORD)                             */}
          {/* ============================================================== */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#00f0ff]" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[#070b16] border border-[#00f0ff]/25 text-white placeholder:text-slate-500 text-xs focus:border-[#00f0ff] focus:ring-2 focus:ring-[#00f0ff]/40 outline-none transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#a855f7]" />
                  <span>Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    required
                    className="w-full px-4 pr-10 py-2.5 rounded-xl bg-[#070b16] border border-[#a855f7]/30 text-white placeholder:text-slate-500 text-xs focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/40 outline-none transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim() || !password}
                className="w-full mt-2 py-3 bg-gradient-to-r from-[#00f0ff] via-[#6366f1] to-[#a855f7] hover:brightness-110 disabled:opacity-40 text-black font-extrabold rounded-xl text-xs shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center justify-center space-x-1.5 active:scale-[0.98]"
              >
                <span>{isLoading ? 'Signing In...' : 'Log In to DeployX'}</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </form>
          )}

          {/* Footer toggle note */}
          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-center text-[11px] text-slate-400">
            <span>
              {mode === 'signup' ? (
                <>
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[#00f0ff] hover:text-white font-bold ml-1 transition-colors underline-offset-2 hover:underline"
                  >
                    Log in here
                  </button>
                </>
              ) : (
                <>
                  Need an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                      setSignupStep(1);
                    }}
                    className="text-[#00f0ff] hover:text-white font-bold ml-1 transition-colors underline-offset-2 hover:underline"
                  >
                    Create one now
                  </button>
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
