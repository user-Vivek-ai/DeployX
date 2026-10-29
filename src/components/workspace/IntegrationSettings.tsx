'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Trash2,
  Send,
  Key,
  Database,
  RefreshCw,
  ExternalLink,
  Lock,
  Plus
} from 'lucide-react';
import { Project, Booking, BookingConfig, OTPConfig, PaymentConfig } from '@/lib/types';

interface IntegrationSettingsProps {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => Promise<void>;
}

export function IntegrationSettings({ project, onUpdateProject }: IntegrationSettingsProps) {
  const [activeTab, setActiveTab] = useState<'bookings' | 'otp' | 'payments' | 'privacy'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  // OTP Tester state
  const [otpTarget, setOtpTarget] = useState('+1 (555) 019-2834');
  const [otpInput, setOtpInput] = useState('');
  const [otpSentHint, setOtpSentHint] = useState<string | null>(null);
  const [otpTestStatus, setOtpTestStatus] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Privacy removal state
  const [gdprEmail, setGdprEmail] = useState('');
  const [gdprMessage, setGdprMessage] = useState<string | null>(null);

  // Fetch Bookings
  const fetchBookings = async () => {
    setIsLoadingBookings(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/bookings`);
      const data = await res.json();
      if (data.bookings) setBookings(data.bookings);
    } catch {
    } finally {
      setIsLoadingBookings(false);
    }
  };

  // Fetch Payments
  const fetchPayments = async () => {
    setIsLoadingPayments(true);
    try {
      const res = await fetch(`/api/payments/list?projectId=${project.id}`);
      const data = await res.json();
      if (data.payments) setPayments(data.payments);
    } catch {
    } finally {
      setIsLoadingPayments(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchPayments();
  }, [project.id]);

  const handleUpdateBookingStatus = async (bookingId: string, status: Booking['status']) => {
    await fetch(`/api/projects/${project.id}/bookings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, status })
    });
    fetchBookings();
  };

  const handleTestSendOtp = async () => {
    setIsSendingOtp(true);
    setOtpTestStatus(null);
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: otpTarget, type: 'sms' })
      });
      const data = await res.json();
      if (data.success) {
        setOtpSentHint(data.demoHint || null);
        setOtpTestStatus(`✓ Code dispatched via ${data.providerUsed}. Expires in ${data.expiresInSeconds}s.`);
      } else {
        setOtpTestStatus(`Error: ${data.error}`);
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleTestVerifyOtp = async () => {
    setIsVerifyingOtp(true);
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: otpTarget, code: otpInput })
      });
      const data = await res.json();
      if (data.success) {
        setOtpTestStatus('✓ Verification Successful! Identity confirmed by server.');
      } else {
        setOtpTestStatus(`Verification Failed: ${data.error}`);
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleGdprDelete = async () => {
    if (!gdprEmail.trim()) return;
    const res = await fetch(`/api/projects/${project.id}/bookings?email=${encodeURIComponent(gdprEmail)}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    setGdprMessage(data.message || 'Records removed');
    setGdprEmail('');
    fetchBookings();
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-slate-50/60 overflow-hidden text-xs">
      {/* Subnav (Responsive: Horizontal on mobile, vertical sidebar on tablet/desktop) */}
      <div className="w-full md:w-60 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-2.5 sm:p-4 flex md:flex-col gap-1.5 flex-shrink-0 overflow-x-auto">
        <span className="hidden md:block font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
          Integrations
        </span>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-3 py-2 sm:py-2.5 rounded-xl font-semibold flex items-center justify-between whitespace-nowrap transition-colors ${
            activeTab === 'bookings'
              ? 'bg-brand-50 text-brand-700 border border-brand-200'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-600" />
            <span>Bookings</span>
          </span>
          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[10px] ml-2">
            {bookings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('otp')}
          className={`px-3 py-2 sm:py-2.5 rounded-xl font-semibold flex items-center justify-between whitespace-nowrap transition-colors ${
            activeTab === 'otp'
              ? 'bg-brand-50 text-brand-700 border border-brand-200'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>OTP 2FA</span>
          </span>
          <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded text-[10px] ml-2">
            Demo
          </span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-3 py-2 sm:py-2.5 rounded-xl font-semibold flex items-center justify-between whitespace-nowrap transition-colors ${
            activeTab === 'payments'
              ? 'bg-brand-50 text-brand-700 border border-brand-200'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Stripe</span>
          </span>
          <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded text-[10px] ml-2">
            Test
          </span>
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`px-3 py-2 sm:py-2.5 rounded-xl font-semibold flex items-center justify-between whitespace-nowrap transition-colors ${
            activeTab === 'privacy'
              ? 'bg-brand-50 text-brand-700 border border-brand-200'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-600" />
            <span>GDPR</span>
          </span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-grow p-4 sm:p-6 overflow-y-auto">
        {/* 1. BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-navy-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand-600" />
                  Table Reservations & Bookings
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Manage incoming customer reservations made from the live website.
                </p>
              </div>

              <button
                onClick={fetchBookings}
                className="p-2 hover:bg-slate-200/60 rounded-xl text-slate-500 hover:text-navy-900 transition-colors"
                title="Refresh Bookings"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingBookings ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Bookings Admin Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-3 px-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-700 text-xs">
                  Received Reservations ({bookings.length})
                </span>
                <span className="text-[11px] text-slate-400">Anti-duplicate active</span>
              </div>

              {bookings.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <p>No bookings received yet. Submit a booking from the Live Preview to test!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3 sm:px-4 font-semibold">Guest</th>
                        <th className="py-2.5 px-3 sm:px-4 font-semibold">Service</th>
                        <th className="py-2.5 px-3 sm:px-4 font-semibold">Date & Time</th>
                        <th className="py-2.5 px-3 sm:px-4 font-semibold">Status</th>
                        <th className="py-2.5 px-3 sm:px-4 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3 sm:px-4">
                            <div className="font-semibold text-navy-900">{b.customerName}</div>
                            <div className="text-[11px] text-slate-500">{b.customerEmail}</div>
                          </td>
                          <td className="py-2.5 px-3 sm:px-4 font-medium text-slate-700">{b.serviceName}</td>
                          <td className="py-2.5 px-3 sm:px-4">
                            <div className="font-medium text-slate-800">{b.date}</div>
                            <div className="text-[11px] text-slate-500">{b.timeSlot}</div>
                          </td>
                          <td className="py-2.5 px-3 sm:px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                b.status === 'confirmed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : b.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 sm:px-4 text-right">
                            <select
                              value={b.status}
                              onChange={(e) => handleUpdateBookingStatus(b.id, e.target.value as any)}
                              className="px-2 py-1 rounded-lg border border-slate-200 text-[11px] bg-white font-medium text-slate-700 outline-none"
                            >
                              <option value="confirmed">Confirm</option>
                              <option value="pending">Pending</option>
                              <option value="completed">Complete</option>
                              <option value="cancelled">Cancel</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. TWO-FACTOR OTP TAB */}
        {activeTab === 'otp' && (
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="pb-3 sm:pb-4 border-b border-slate-200">
              <h3 className="font-bold text-sm sm:text-base text-navy-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                Two-Factor OTP Security Engine
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Server-side verification with SHA-256 HMAC hashing and rate limits.
              </p>
            </div>

            {/* Provider Configuration Notice */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Active Provider</span>
                <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-xs font-bold">
                  Demo OTP Sandbox
                </span>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">
                Running in safe sandbox mode. Dispatches simulated 6-digit codes without charges.
              </p>
            </div>

            {/* Interactive OTP Test Sandbox */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-400 block">
                Interactive OTP Sandbox Tester
              </span>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={otpTarget}
                  onChange={(e) => setOtpTarget(e.target.value)}
                  placeholder="+1 (555) 000-0000 or email"
                  className="flex-grow px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleTestSendOtp}
                  disabled={isSendingOtp}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
                >
                  {isSendingOtp ? 'Sending...' : 'Send OTP'}
                </button>
              </div>

              {otpSentHint && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs">
                  <strong>Demo Verification Code:</strong>{' '}
                  <span className="font-mono text-sm font-bold tracking-wider">{otpSentHint}</span>
                  <button
                    onClick={() => setOtpInput(otpSentHint)}
                    className="ml-3 text-indigo-700 font-semibold underline text-xs"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  className="flex-grow px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono tracking-widest outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleTestVerifyOtp}
                  disabled={!otpInput.trim() || isVerifyingOtp}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
                >
                  {isVerifyingOtp ? 'Verifying...' : 'Verify Code'}
                </button>
              </div>

              {otpTestStatus && (
                <div className="p-3 bg-slate-100 rounded-xl text-xs font-medium text-slate-800">
                  {otpTestStatus}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="pb-3 sm:pb-4 border-b border-slate-200">
              <h3 className="font-bold text-sm sm:text-base text-navy-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Stripe Payments Integration
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Process deposits and orders with server-side webhook verification.
              </p>
            </div>

            {/* Test Mode Card */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold">Stripe Test Mode Simulator Active</span>
                <span className="bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded text-[10px]">
                  Zero Charges
                </span>
              </div>
              <p className="leading-relaxed">
                Test orders use test token card: <code className="font-mono bg-white/80 px-1 py-0.5 rounded text-emerald-950 font-bold">4242 4242 4242 4242</code>.
              </p>
            </div>

            {/* Transaction Audit Log */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-3 px-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-700 text-xs">
                  Transaction Audit Log ({payments.length})
                </span>
                <span className="text-[11px] text-slate-400">Server verified</span>
              </div>

              {payments.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  No payment transactions recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <div key={p.id} className="p-3 sm:p-4 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-navy-900">{p.description}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{p.id} • {p.customerEmail}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-navy-900">${p.amount.toFixed(2)} {p.currency}</div>
                        <span className="inline-block mt-0.5 px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. PRIVACY & GDPR TAB */}
        {activeTab === 'privacy' && (
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="pb-3 sm:pb-4 border-b border-slate-200">
              <h3 className="font-bold text-sm sm:text-base text-navy-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-rose-600" />
                Customer Data Privacy & Erasure
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Privacy-conscious handling of personal data and instant GDPR right-to-be-forgotten customer removal.
              </p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Erase Customer Records by Email
              </span>
              <p className="text-slate-600 text-xs leading-relaxed">
                Permanently purge all booking records and verification history associated with an individual customer email across this project.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={gdprEmail}
                  onChange={(e) => setGdprEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="flex-grow px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-rose-500"
                />
                <button
                  onClick={handleGdprDelete}
                  disabled={!gdprEmail.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purge Data</span>
                </button>
              </div>

              {gdprMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
                  {gdprMessage}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
