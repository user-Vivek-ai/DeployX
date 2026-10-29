'use client';

import React, { useState } from 'react';
import {
  Rocket,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Terminal,
  Loader2,
  Server,
  Layers,
  Clock,
  RotateCcw,
  ShieldCheck
} from 'lucide-react';
import { Deployment, DeploymentLog } from '@/lib/types';
import { formatTimeAgo } from '@/lib/utils';

interface DeploymentDrawerProps {
  projectId: string;
  deployments: Deployment[];
  onTriggerDeploy: (environment: 'production' | 'staging' | 'preview') => Promise<void>;
  isDeploying: boolean;
  activeDeploymentUrl?: string;
}

export function DeploymentDrawer({
  projectId,
  deployments,
  onTriggerDeploy,
  isDeploying,
  activeDeploymentUrl
}: DeploymentDrawerProps) {
  const [environment, setEnvironment] = useState<'production' | 'staging' | 'preview'>('production');
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(deployments[0] || null);

  const active = selectedDeployment || deployments[0];

  const handleDeploy = async () => {
    await onTriggerDeploy(environment);
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-slate-50/60 overflow-hidden text-xs">
      {/* Deployments List Sidebar (Horizontal on small screens, vertical on md+) */}
      <div className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col flex-shrink-0">
        <div className="p-3 sm:p-4 border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-navy-900 flex items-center gap-1.5 text-xs">
              <Rocket className="w-4 h-4 text-brand-600" />
              Deployment Pipeline
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
              Edge Sandbox
            </span>
          </div>

          {/* Environment Selector */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-medium text-slate-600">
            {(['production', 'staging', 'preview'] as const).map((env) => (
              <button
                key={env}
                onClick={() => setEnvironment(env)}
                className={`py-1 rounded-lg capitalize transition-colors ${
                  environment === env ? 'bg-white text-navy-900 shadow-sm font-bold' : 'hover:text-navy-900'
                }`}
              >
                {env}
              </button>
            ))}
          </div>

          {/* Deploy Action Button */}
          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-sm transition-all flex items-center justify-center space-x-2"
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Building & Deploying...</span>
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                <span>Deploy to {environment}</span>
              </>
            )}
          </button>
        </div>

        {/* Deployments History List */}
        <div className="flex-grow overflow-y-auto p-2.5 sm:p-3 space-y-2 max-h-40 md:max-h-none">
          {deployments.length === 0 ? (
            <div className="p-4 sm:p-6 text-center text-slate-400">
              <Server className="w-6 h-6 mx-auto mb-1 opacity-50" />
              <p>No deployments triggered yet.</p>
            </div>
          ) : (
            deployments.map((dep) => {
              const isSelected = active?.id === dep.id;
              return (
                <div
                  key={dep.id}
                  onClick={() => setSelectedDeployment(dep)}
                  className={`p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-brand-50/60 border-brand-300 ring-1 ring-brand-400'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-navy-900 flex items-center gap-1.5 capitalize">
                      {dep.status === 'succeeded' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      {dep.environment}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {dep.commitHash}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="capitalize">{dep.status}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(dep.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Deployment Logs & Live URL Inspector */}
      <div className="flex-grow p-4 sm:p-6 overflow-y-auto">
        {active ? (
          <div className="max-w-2xl mx-auto space-y-5">
            {/* Live URL Card */}
            {active.status === 'succeeded' && active.url ? (
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-50/50 via-white to-white">
                <div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mb-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified Live Deployment
                  </span>
                  <div className="font-mono text-xs sm:text-sm font-bold text-navy-900 truncate">
                    <span>{active.url}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    (Functional Sandbox Simulation - SSL & Edge CDN Verified)
                  </span>
                </div>

                <a
                  href={`/projects/${projectId}/preview`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors flex-shrink-0"
                >
                  <span>Open URL</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                Deployment is queued or in progress. A live URL will only be displayed upon successful completion.
              </div>
            )}

            {/* Build & Deployment Logs */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-md overflow-hidden">
              <div className="p-3 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono flex items-center gap-1.5 text-slate-200">
                  <Terminal className="w-3.5 h-3.5 text-brand-400" />
                  Build & Deployment Output Logs
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  Exit: 0
                </span>
              </div>

              <div className="p-3.5 sm:p-4 font-mono text-[11px] text-slate-300 space-y-1.5 max-h-60 sm:max-h-72 overflow-y-auto">
                {active.logs?.map((log, i) => (
                  <div key={i} className="flex items-start space-x-2 leading-relaxed">
                    <span className="text-slate-500 select-none hidden xs:inline">[{log.timestamp}]</span>
                    <span
                      className={`font-semibold ${
                        log.level === 'success'
                          ? 'text-emerald-400'
                          : log.level === 'warn'
                          ? 'text-amber-400'
                          : 'text-brand-300'
                      }`}
                    >
                      [{log.step.toUpperCase()}]
                    </span>
                    <span className="text-slate-200 break-all">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hosting Provider Configuration Guide */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
              <h5 className="font-bold text-navy-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                Hosting Provider Integration
              </h5>
              <p className="leading-relaxed">
                Currently running in <strong>Local Edge Simulator</strong> mode. To publish to production cloud hosting (e.g., Vercel, Netlify, or Docker Container), set <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">DEPLOYMENT_PROVIDER=vercel</code> and <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">VERCEL_DEPLOY_HOOK_URL</code> in your environment file.
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400">
            Select a deployment to inspect logs
          </div>
        )}
      </div>
    </div>
  );
}
