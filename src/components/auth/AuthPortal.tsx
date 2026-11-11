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
  ShieldCheck,
  Check,
  RotateCw
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

  // 3D Cursor Movement State
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Track 3D cursor movement across the viewport
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      const normX = (clientX - innerWidth / 2) / (innerWidth / 2);
      const normY = (clientY - innerHeight / 2) / (innerHeight / 2);

      setMousePos({ x: clientX, y: clientY });
      setTilt({
        x: normY * -9,
        y: normX * 9
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
      // Automatic login
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

  // Login: Just Email + Password (as requested)
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
        setSuccessMsg('✓ Sign in successful! Loading workspace...');
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
    <div className="relative min-h-screen w-full bg-[#0d0d0d] text-slate-100 flex items-center justify-center p-3 sm:p-6 overflow-x-hidden select-none font-sans">
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
        style={{ transform: `translate(${mousePos.x * 0.02}px, ${mousePos.y * 0.02}px)` }}
      />
      <div
        className="pointer-events-none absolute w-96 h-96 rounded-full bg-brand-600/10 blur-3xl -bottom-20 -right-20 animate-pulse-subtle"
        style={{ transform: `translate(${mousePos.x * -0.02}px, ${mousePos.y * -0.02}px)` }}
      />

      {/* Main 3D Interactive Auth Container */}
      <div
        ref={cardRef}
        style={{
          transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: 'preserve-3d'
        }}
        className="relative z-10 w-full max-w-md bg-[#171717] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-xl transition-transform duration-200 ease-out my-4"
      >
        {/* Shimmer Border Overlay */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/10 to-transparent pointer-events-none -z-10" />

        <div style={{ transform: 'translateZ(30px)' }}>
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/25 mb-2.5 border border-white/10">
              <span className="text-xl font-black text-white tracking-tighter">Dx</span>
            </div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white">DeployX</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400 font-mono font-medium">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Autonomous Software Engineering &amp; Web Deployment Platform
            </p>
          </div>

          {/* Toggle Tab: Sign Up vs Log In */}
          <div className="grid grid-cols-2 p-1 bg-[#212121] rounded-2xl border border-white/5 mb-5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setSuccessMsg(null);
                setSignupStep(1);
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
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* SIGNUP FLOW (3-STEP: DETAILS -> OTP -> PASSWORD)               */}
          {/* ============================================================== */}
          {mode === 'signup' && (
            <div>
              {/* Step Progress Tracker */}
              <div className="flex items-center justify-between mb-5 px-1">
                <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-400">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${signupStep >= 1 ? 'bg-brand-600 text-white' : 'bg-[#262626] text-slate-500'}`}>1</span>
                  <span className={signupStep === 1 ? 'text-white' : ''}>Details</span>
                </div>
                <div className="w-8 h-[1px] bg-white/10" />
                <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-400">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${signupStep >= 2 ? 'bg-brand-600 text-white' : 'bg-[#262626] text-slate-500'}`}>2</span>
                  <span className={signupStep === 2 ? 'text-white' : ''}>OTP</span>
                </div>
                <div className="w-8 h-[1px] bg-white/10" />
                <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-400">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${signupStep >= 3 ? 'bg-brand-600 text-white' : 'bg-[#262626] text-slate-500'}`}>3</span>
                  <span className={signupStep === 3 ? 'text-white' : ''}>Password</span>
                </div>
              </div>

              {/* STAGE 1: Full Name & Email Address */}
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
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#212121] border border-white/10 text-white placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-brand-500 outline-none transition-all"
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
                        placeholder="yourname@gmail.com"
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#212121] border border-white/10 text-white placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-brand-500 outline-none transition-all"
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

              {/* STAGE 2: 6-Digit Email Verification Code */}
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
                    <span>
                      Expires in: <strong className="text-white">{formatTimer(timerSeconds)}</strong>
                    </span>
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || isLoading}
                      onClick={handleResendOtp}
                      className="text-brand-400 hover:text-brand-300 disabled:opacity-40 font-semibold transition-colors"
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
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
                      disabled={isLoading || otpCode.length !== 6 || timerSeconds <= 0}
                      className="w-2/3 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-lg shadow-brand-600/20 transition-all flex items-center justify-center space-x-1.5"
                    >
                      <span>{isLoading ? 'Verifying...' : 'Verify OTP'}</span>
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}

              {/* STAGE 3: Set Password */}
              {signupStep === 3 && (
                <form onSubmit={handleCompleteSignup} className="space-y-4">
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
                        placeholder="Create a strong password"
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
                        placeholder="Re-enter your password"
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#212121] border border-white/10 text-white placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Password Requirement Checklist */}
                  {password.length > 0 && (
                    <div className="p-2.5 bg-[#212121] rounded-xl border border-white/5 space-y-1 text-[11px]">
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <span className={`flex items-center space-x-1 ${hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                          <span>{hasMinLength ? '✓' : '•'} 8+ characters</span>
                        </span>
                        <span className={`flex items-center space-x-1 ${hasUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
                          <span>{hasUpper ? '✓' : '•'} 1 uppercase (A-Z)</span>
                        </span>
                        <span className={`flex items-center space-x-1 ${hasLower ? 'text-emerald-400' : 'text-slate-500'}`}>
                          <span>{hasLower ? '✓' : '•'} 1 lowercase (a-z)</span>
                        </span>
                        <span className={`flex items-center space-x-1 ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                          <span>{hasNumber ? '✓' : '•'} 1 number (0-9)</span>
                        </span>
                      </div>
                      {confirmPassword.length > 0 && (
                        <div className={`pt-1 text-[10px] font-semibold ${passwordsMatch ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || !isPasswordValid}
                    className="w-full mt-2 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-lg shadow-brand-600/20 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <span>{isLoading ? 'Creating Account...' : 'Create Account & Log In'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* LOGIN FLOW (JUST EMAIL & PASSWORD, EXACTLY AS REQUESTED)       */}
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
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
                <span>{isLoading ? 'Signing In...' : 'Log In to DeployX'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* Footer note */}
          <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-center text-[11px] text-slate-500">
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
                    className="text-brand-400 hover:text-brand-300 font-semibold"
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
                    className="text-brand-400 hover:text-brand-300 font-semibold"
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
