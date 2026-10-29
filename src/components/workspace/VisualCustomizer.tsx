'use client';

import React, { useState } from 'react';
import {
  Palette,
  Type,
  Layout,
  Check,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Save,
  RotateCcw
} from 'lucide-react';
import { VisualConfig } from '@/lib/types';

interface VisualCustomizerProps {
  initialConfig: VisualConfig;
  onApplyChanges: (config: VisualConfig) => Promise<void>;
  isApplying: boolean;
}

export function VisualCustomizer({
  initialConfig,
  onApplyChanges,
  isApplying
}: VisualCustomizerProps) {
  const [config, setConfig] = useState<VisualConfig>(initialConfig);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const colorPresets = [
    { name: 'Indigo', hex: '#6366f1' },
    { name: 'Violet', hex: '#8b5cf6' },
    { name: 'Royal Blue', hex: '#2563eb' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Warm Amber', hex: '#d97706' },
    { name: 'Rose', hex: '#f43f5e' },
    { name: 'Slate Dark', hex: '#334155' }
  ];

  const fontOptions = [
    'Plus Jakarta Sans',
    'Inter',
    'Roboto',
    'Playfair Display',
    'JetBrains Mono'
  ];

  const handleApply = async () => {
    await onApplyChanges(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleReset = () => {
    setConfig(initialConfig);
  };

  return (
    <div className="h-full bg-slate-50/50 p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-navy-900 text-base flex items-center gap-2">
              <Palette className="w-5 h-5 text-brand-600" />
              DeployX Visual Studio & Style Controls
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Instantly customize layout, branding, typography, and module toggles without touching code.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleReset}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
              title="Reset to original"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleApply}
              disabled={isApplying}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isApplying ? 'Applying...' : 'Apply to Preview'}</span>
            </button>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Style updates applied to index.html and styles.css! Preview refreshed.</span>
          </div>
        )}

        {/* 1. Brand & Typography */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Type className="w-4 h-4 text-brand-500" />
            Brand Identity & Copy
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Name</label>
              <input
                type="text"
                value={config.brandName}
                onChange={(e) => setConfig({ ...config, brandName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Font Family</label>
              <select
                value={config.fontFamily}
                onChange={(e) => setConfig({ ...config, fontFamily: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
              >
                {fontOptions.map((font) => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Hero Headline</label>
            <input
              type="text"
              value={config.heroHeadline}
              onChange={(e) => setConfig({ ...config, heroHeadline: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Call-To-Action (CTA) Button Text</label>
            <input
              type="text"
              value={config.ctaText}
              onChange={(e) => setConfig({ ...config, ctaText: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
        </div>

        {/* 2. Color Palette */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-brand-500" />
            Primary Theme Accent
          </span>

          <div className="flex flex-wrap gap-2.5 pt-1">
            {colorPresets.map((preset) => {
              const isSelected = config.primaryColor.toLowerCase() === preset.hex.toLowerCase();
              return (
                <button
                  key={preset.hex}
                  onClick={() => setConfig({ ...config, primaryColor: preset.hex })}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    isSelected
                      ? 'border-slate-800 bg-slate-50 text-slate-900 shadow-sm ring-1 ring-slate-800'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.hex }} />
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 flex items-center space-x-2">
            <span className="text-xs text-slate-500">Custom Hex:</span>
            <input
              type="color"
              value={config.primaryColor}
              onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
              className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer"
            />
            <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              {config.primaryColor}
            </span>
          </div>
        </div>

        {/* 3. Feature Integrations Toggles */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layout className="w-4 h-4 text-brand-500" />
            Interactive Modules
          </span>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <h5 className="font-semibold text-xs text-navy-900">Table Bookings & Slots Picker</h5>
                <p className="text-[11px] text-slate-500">Enable interactive date/slot booking form</p>
              </div>
              <button
                onClick={() => setConfig({ ...config, enableBookingsBanner: !config.enableBookingsBanner })}
                className="text-brand-600"
              >
                {config.enableBookingsBanner ? (
                  <ToggleRight className="w-7 h-7 text-brand-600" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-300" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <h5 className="font-semibold text-xs text-navy-900">Stripe Payment Checkout Modal</h5>
                <p className="text-[11px] text-slate-500">Enable test card checkout ($25 deposit)</p>
              </div>
              <button
                onClick={() => setConfig({ ...config, enablePaymentCheckout: !config.enablePaymentCheckout })}
                className="text-brand-600"
              >
                {config.enablePaymentCheckout ? (
                  <ToggleRight className="w-7 h-7 text-brand-600" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-300" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <h5 className="font-semibold text-xs text-navy-900">Two-Factor OTP Verification</h5>
                <p className="text-[11px] text-slate-500">Require 6-digit phone/email verification</p>
              </div>
              <button
                onClick={() => setConfig({ ...config, enableOtpVerification: !config.enableOtpVerification })}
                className="text-brand-600"
              >
                {config.enableOtpVerification ? (
                  <ToggleRight className="w-7 h-7 text-brand-600" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-300" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
