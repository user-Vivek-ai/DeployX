'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCw,
  ExternalLink,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  Copy
} from 'lucide-react';
import { ProjectFile } from '@/lib/types';
import { PreviewRuntime } from '@/lib/preview-runtime';

interface LivePreviewProps {
  projectId: string;
  files: ProjectFile[];
  onRepairRequest?: (errorMessage: string) => void;
  onBookingReceived?: (bookingData: any) => void;
  onPaymentReceived?: (paymentData: any) => void;
}

export function LivePreview({
  projectId,
  files,
  onRepairRequest,
  onBookingReceived,
  onPaymentReceived
}: LivePreviewProps) {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [key, setKey] = useState(0);
  const [runtimeError, setRuntimeError] = useState<{ message: string; filename: string; lineno: number } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const srcDoc = PreviewRuntime.compileToSrcDoc(files);

  // Listen for iframe messages
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return;

      if (e.data.type === 'DEPLOYX_RUNTIME_ERROR') {
        setRuntimeError(e.data.payload);
      } else if (e.data.type === 'DEPLOYX_NEW_BOOKING') {
        if (onBookingReceived) onBookingReceived(e.data.payload);
      } else if (e.data.type === 'DEPLOYX_PAYMENT_SUCCESS') {
        if (onPaymentReceived) onPaymentReceived(e.data.payload);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onBookingReceived, onPaymentReceived]);

  const handleRefresh = () => {
    setRuntimeError(null);
    setKey((prev) => prev + 1);
  };

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile': return 'max-w-[375px]';
      case 'tablet': return 'max-w-[768px]';
      case 'desktop': return 'w-full';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100/70 border-l border-slate-200">
      {/* Top Preview Controls Bar */}
      <div className="h-12 px-4 bg-white border-b border-slate-200 flex items-center justify-between flex-shrink-0">
        {/* Device Switcher */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewport('desktop')}
            title="Desktop View (100%)"
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewport === 'desktop' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500 hover:text-navy-900'
            }`}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewport('tablet')}
            title="Tablet View (768px)"
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewport === 'tablet' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500 hover:text-navy-900'
            }`}
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewport('mobile')}
            title="Mobile View (375px)"
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewport === 'mobile' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500 hover:text-navy-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        {/* Status Indicator */}
        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-500 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Interactive Sandboxed Virtual DOM</span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            title="Reload Preview"
            className="p-1.5 text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <a
            href={`/projects/${projectId}/preview`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in Full Window"
            className="p-1.5 text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Runtime Error Banner if present */}
      {runtimeError && (
        <div className="bg-rose-50 border-b border-rose-200 p-3 px-4 flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>
              <strong>Runtime Warning:</strong> {runtimeError.message} (Line {runtimeError.lineno})
            </span>
          </div>
          {onRepairRequest && (
            <button
              onClick={() => onRepairRequest(`Fix runtime error: ${runtimeError.message} in ${runtimeError.filename}`)}
              className="flex items-center space-x-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-[11px] shadow-sm transition-colors"
            >
              <Wrench className="w-3 h-3" />
              <span>Ask DeployX to Repair</span>
            </button>
          )}
        </div>
      )}

      {/* Responsive Viewport Container */}
      <div className="flex-grow overflow-auto p-4 flex justify-center items-start">
        <div
          className={`h-full bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden transition-all duration-300 flex flex-col ${getViewportWidth()}`}
        >
          <iframe
            key={key}
            ref={iframeRef}
            srcDoc={srcDoc}
            title="DeployX Live Preview"
            sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
            className="w-full flex-grow border-0 min-h-[500px]"
          />
        </div>
      </div>
    </div>
  );
}
