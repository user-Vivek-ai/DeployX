'use client';

import React, { useState } from 'react';
import {
  History,
  RotateCcw,
  Plus,
  Clock,
  User,
  CheckCircle2,
  FileCode,
  ArrowRight,
  GitCommit,
  AlertCircle
} from 'lucide-react';
import { VersionSnapshot } from '@/lib/types';
import { formatTimeAgo } from '@/lib/utils';

interface VersionHistoryProps {
  projectId: string;
  versions: VersionSnapshot[];
  onRestoreVersion: (versionId: string) => Promise<void>;
  onSaveSnapshot: (message: string) => Promise<void>;
  isRestoring: boolean;
}

export function VersionHistory({
  projectId,
  versions,
  onRestoreVersion,
  onSaveSnapshot,
  isRestoring
}: VersionHistoryProps) {
  const [newSnapshotMsg, setNewSnapshotMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<VersionSnapshot | null>(versions[0] || null);

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSnapshotMsg.trim() || isSaving) return;
    setIsSaving(true);
    try {
      await onSaveSnapshot(newSnapshotMsg.trim());
      setNewSnapshotMsg('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestore = async (version: VersionSnapshot) => {
    if (confirm(`Revert project files to Version #${version.versionNumber} ("${version.message}")? A backup snapshot of current work will be preserved.`)) {
      await onRestoreVersion(version.id);
    }
  };

  return (
    <div className="flex h-full bg-slate-50/60 overflow-hidden text-xs">
      {/* Version Timeline Sidebar */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center space-x-2 text-navy-900 font-bold mb-3">
            <History className="w-4 h-4 text-brand-600" />
            <span>Version History & Rollbacks</span>
          </div>

          <form onSubmit={handleCreateSnapshot} className="flex gap-1.5">
            <input
              type="text"
              value={newSnapshotMsg}
              onChange={(e) => setNewSnapshotMsg(e.target.value)}
              placeholder="Save custom checkpoint..."
              className="flex-grow px-3 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={!newSnapshotMsg.trim() || isSaving}
              className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-lg font-semibold flex items-center gap-1 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </form>
        </div>

        {/* Version List */}
        <div className="flex-grow overflow-y-auto p-3 space-y-2">
          {versions.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No snapshots recorded yet.</p>
            </div>
          ) : (
            versions.map((ver, idx) => {
              const isSelected = selectedVersion?.id === ver.id;
              const isLatest = idx === 0;

              return (
                <div
                  key={ver.id}
                  onClick={() => setSelectedVersion(ver)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-brand-50/60 border-brand-300 ring-1 ring-brand-400'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-navy-900 flex items-center gap-1.5">
                      <GitCommit className="w-3.5 h-3.5 text-brand-600" />
                      Version #{ver.versionNumber}
                    </span>
                    {isLatest && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Current
                      </span>
                    )}
                  </div>

                  <p className="text-slate-600 font-medium line-clamp-2 mt-1">
                    {ver.message}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(ver.timestamp)}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {ver.author || 'DeployX'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Version Details / Inspector */}
      <div className="flex-grow p-6 overflow-y-auto">
        {selectedVersion ? (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                  Snapshot Inspector
                </span>
                <h3 className="font-bold text-lg text-navy-900 mt-0.5">
                  Version #{selectedVersion.versionNumber}
                </h3>
                <p className="text-slate-500 mt-1">{selectedVersion.message}</p>
              </div>

              <button
                onClick={() => handleRestore(selectedVersion)}
                disabled={isRestoring}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl font-semibold shadow-sm flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isRestoring ? 'Restoring...' : 'Revert to this Version'}</span>
              </button>
            </div>

            {/* Preserved Files in Snapshot */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Preserved Files in this Version ({selectedVersion.files?.length || 0})
              </span>

              <div className="space-y-1.5">
                {selectedVersion.files?.map((file) => (
                  <div
                    key={file.path}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between font-mono text-[11px]"
                  >
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-slate-400" />
                      {file.path}
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {file.content?.length || 0} bytes
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Guarantee Notice */}
            <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-indigo-900 text-xs flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold">Zero-Risk Rollbacks:</span> DeployX automatically captures a safety snapshot of your active project before restoring earlier code. You can revert back at any time.
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400">
            Select a version from the timeline to inspect
          </div>
        )}
      </div>
    </div>
  );
}
