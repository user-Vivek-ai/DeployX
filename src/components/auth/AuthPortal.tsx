'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RotateCw,
  ShieldCheck,
  Check,
  X,
  Layers,
  Wand2
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function AuthPortal() {
  const { login, setUser } = useAuth();

  // Mode: 'signup' (default on first open as requested) vs 'login'
  const [mode, setMode] = useState<'signup' | 'login'>('signup');

  // Multi-step signup state: 1 = Name/Email, 2 = OTP, 3 = Password
  const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & UI States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [demoOtpHint, setDemoOtpHint] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(300);

  // 3D Cursor Movement State
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Track 3D cursor movement across the viewport
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      // Normalized coordinates from -1 to 1
      const normX = (clientX - innerWidth / 2) / (innerWidth / 2);
      const normY = (clientY - innerHeight / 2) / (innerHeight / 2);

      setMousePos({ x: clientX, y: clientY });
      setTilt({
        x: normY * -9, // subtle tilt X (degrees)
        y: normX * 9   // subtle tilt Y (degrees)
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Timer countdown for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (signupStep === 2 && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [signupStep, timerSeconds]);

  // Real-time password requirement checkers
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && passwordsMatch;

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim() || !email.trim()) {
      setErrorMsg('Please enter both your full name and email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to dispatch verification OTP.');
        return;
      }

      setDemoOtpHint(data.fallbackOtp || null);
      setTimerSeconds(data.expiresInSeconds || 300);
      setSuccessMsg(`✓ 6-Digit code dispatched to ${email}. Check your inbox.`);
      setSignupStep(2);
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMsg('Please enter a valid 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: otpCode.trim() })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Invalid or expired OTP code.');
        return;
      }

      setSuccessMsg('✓ Email successfully verified! Now create your password.');
      setSignupStep(3);
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Complete Signup with Password & Transition to Login
  const handleSetPasswordAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isPasswordValid) {
      setErrorMsg('Please ensure all password criteria are satisfied.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Registration failed.');
        return;
      }

      // Success! Move to Login page with pre-filled email as requested
      setSuccessMsg('✓ Account created successfully! Please log in with your email and password.');
      setMode('login');
      setPassword('');
      setConfirmPassword('');
      setSignupStep(1);
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Login: Email + Password matching
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
      const result = await login(email.trim(), password);
      if (!result.success) {
        setErrorMsg(result.error || 'Invalid email or password.');
      }
      // On success, AuthProvider updates user and automatically renders the app!
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
    <div className="relative min-h-screen w-full bg-[#0d0d0d] text-slate-100 flex items-center justify-center p-4 overflow-hidden select-none font-sans">
      {/* Interactive 3D Cursor Lighting Canvas & Radial Glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(900px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.15), rgba(16, 185, 129, 0.04) 40%, transparent 70%)`
        }}
      />

      {/* 3D Floating Geometry Wireframe Background Grid */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-20 transition-transform duration-300 ease-out"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          transform: `perspective(1000px) rotateX(${tilt.x * 0.4}deg) rotateY(${tilt.y * 0.4}deg) scale(1.05)`
        }}
      />

      {/* Floating 3D Ambient Orbs */}
      <div
        className="pointer-events-none absolute w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl -top-20 -left-20 animate-pulse-subtle"
        style={{
          transform: `translate3d(${tilt.y * 2}px, ${tilt.x * 2}px, 0)`
        }}
      />
      <div
        className="pointer-events-none absolute w-80 h-80 rounded-full bg-violet-600/10 blur-3xl -bottom-20 -right-20 animate-pulse-subtle"
        style={{
          transform: `translate3d(${tilt.y * -2}px, ${tilt.x * -2}px, 0)`
        }}
      />

      {/* 3D Card Container with Mouse-Tilt Perspective */}
      <div
        ref={cardRef}
        className="relative z-10 w-full max-w-md transition-transform duration-150 ease-out"
        style={{
          transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Main ChatGPT "Light Black" Card */}
        <div className="relative bg-[#171717]/95 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden p-6 sm:p-8">
          {/* Top Brand Logo */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 text-white flex items-center justify-center font-black text-2xl shadow-xl ring-1 ring-white/20 mb-3 group">
              <span className="tracking-tighter">D</span>
              <span className="text-amber-300 text-xs font-mono ml-0.5">X</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>DeployX</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-white/10 text-slate-300 border border-white/10">
                v1.0
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Autonomous Software Engineering & Web Deployment Platform
            </p>
          </div>

          {/* Mode Switcher Tabs (Signup vs Login) */}
          <div className="grid grid-cols-2 p-1 bg-[#212121] rounded-2xl border border-white/5 mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 rounded-xl transition-all ${
                mode === 'signup'
                  ? 'bg-[#2f2f2f] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up (New User)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-[#2f2f2f] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Log In (Existing)
            </button>
          </div>

          {/* Alert / Status Messages */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* SIGNUP FLOW (MULTI-STEP)                                       */}
          {/* ============================================================== */}
          {mode === 'signup' && (
            <div>
              {/* Step Progress Tracker */}
              <div className="flex items-center justify-between mb-5 px-1">
                <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-400">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${signupStep >= 1 ? 'bg-brand-600 text-white' : 'bg-[#262626] text-slate-500'}`}>1</span>
                  <span className={signupStep === 1 ? 'text-white' : ''}>Details</span>
                </div>
                <div className="w-6 h-[1px] bg-white/10" />
                <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-400">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${signupStep >= 2 ? 'bg-brand-600 text-white' : 'bg-[#262626] text-slate-500'}`}>2</span>
                  <span className={signupStep === 2 ? 'text-white' : ''}>OTP</span>
                </div>
                <div className="w-6 h-[1px] bg-white/10" />
                <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-400">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${signupStep >= 3 ? 'bg-brand-600 text-white' : 'bg-[#262626] text-slate-500'}`}>3</span>
                  <span className={signupStep === 3 ? 'text-white' : ''}>Password</span>
                </div>
              </div>

              {/* STAGE 1: Name & Email Input */}
              {signupStep === 1 && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Vivek Akula"
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#212121] border border-white/10 text-white placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#212121] border border-white/10 text-white placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !name.trim() || !email.trim()}
                    className="w-full mt-2 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-lg shadow-brand-600/20 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <span>{isLoading ? 'Sending Verification OTP...' : 'Verify Email with OTP'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}

              {/* STAGE 2: 6-Digit Email OTP Verification */}
              {signupStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="p-3 bg-[#212121] rounded-2xl border border-white/10 text-xs">
                    <span className="text-slate-400">Verifying address:</span>
                    <div className="font-semibold text-white mt-0.5">{email}</div>
                  </div>

                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-start space-x-3 text-xs">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-emerald-300">Verification Code Dispatched</p>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        We sent a 6-digit confirmation code to <strong className="text-white">{email}</strong>. Please check your inbox and spam folder.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Enter 6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      required
                      autoFocus
                      className="w-full py-3 text-center font-mono text-2xl tracking-[0.5em] rounded-xl bg-[#212121] border border-white/10 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Expires in: <strong className="text-white">{formatTimer(timerSeconds)}</strong></span>
                    <button
                      type="button"
                      disabled={timerSeconds > 240}
                      onClick={handleSendOtp}
                      className="text-brand-400 hover:text-brand-300 disabled:opacity-40 font-semibold"
                    >
                      Resend Code
                    </button>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSignupStep(1)}
                      className="w-1/3 py-2.5 bg-[#212121] hover:bg-[#2a2a2a] text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || otpCode.length !== 6}
                      className="w-2/3 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-lg shadow-brand-600/20 transition-all flex items-center justify-center space-x-1.5"
                    >
                      <span>{isLoading ? 'Verifying...' : 'Verify OTP'}</span>
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {demoOtpHint && (
                    <div className="text-center pt-1">
                      <p className="text-[10px] text-slate-500">
                        Mail key not set on Vercel?{' '}
                        <button
                          type="button"
                          onClick={() => setOtpCode(demoOtpHint)}
                          className="text-brand-400 hover:text-brand-300 underline"
                        >
                          Fill dev code ({demoOtpHint})
                        </button>
                      </p>
                    </div>
                  )}
                </form>
              )}

              {/* STAGE 3: Password Setting with Requirement Checklist */}
              {signupStep === 3 && (
                <form onSubmit={handleSetPasswordAndSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Create Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        required
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#212121] border border-white/10 text-white placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#212121] border border-white/10 text-white placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Password Requirement Real-Time Meters */}
                  <div className="p-3 bg-[#212121] rounded-2xl border border-white/10 space-y-1.5 text-[11px]">
                    <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                      Required Security Rules:
                    </span>
                    <div className="flex items-center space-x-2">
                      {hasUpper ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-600 inline-block" />}
                      <span className={hasUpper ? 'text-emerald-300 font-medium' : 'text-slate-400'}>At least 1 uppercase letter (A-Z)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {hasLower ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-600 inline-block" />}
                      <span className={hasLower ? 'text-emerald-300 font-medium' : 'text-slate-400'}>At least 1 lowercase letter (a-z)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-600 inline-block" />}
                      <span className={hasNumber ? 'text-emerald-300 font-medium' : 'text-slate-400'}>At least 1 number (0-9)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-600 inline-block" />}
                      <span className={hasMinLength ? 'text-emerald-300 font-medium' : 'text-slate-400'}>Minimum 8 characters</span>
                    </div>
                    {confirmPassword.length > 0 && (
                      <div className="flex items-center space-x-2">
                        {passwordsMatch ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-rose-400" />}
                        <span className={passwordsMatch ? 'text-emerald-300 font-medium' : 'text-rose-400'}>Passwords match</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !isPasswordValid}
                    className="w-full py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-lg shadow-brand-600/20 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <span>{isLoading ? 'Creating Account...' : 'Complete Registration & Continue'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* LOGIN FLOW (EMAIL & PASSWORD MATCHING)                        */}
          {/* ============================================================== */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#212121] border border-white/10 text-white placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      // Demo autofill for default developer account
                      setEmail('developer@deployx.dev');
                      setPassword('DeployX2026!');
                    }}
                    className="text-[11px] text-brand-400 hover:text-brand-300"
                  >
                    Demo credentials
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#212121] border border-white/10 text-white placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim() || !password}
                className="w-full mt-2 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-lg shadow-brand-600/20 transition-all flex items-center justify-center space-x-1.5"
              >
                <span>{isLoading ? 'Verifying Credentials...' : 'Log In to DeployX'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* Bottom Switcher */}
          <div className="mt-6 pt-4 border-t border-white/5 text-center text-xs text-slate-400">
            {mode === 'signup' ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="font-bold text-brand-400 hover:text-brand-300 hover:underline"
                >
                  Log in here
                </button>
              </p>
            ) : (
              <p>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setSignupStep(1);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="font-bold text-brand-400 hover:text-brand-300 hover:underline"
                >
                  Create one now
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
