'use client';

import React from 'react';
import Link from 'next/link';
import {
  Globe,
  Download,
  Trash2,
  Clock,
  Layers,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  FolderGit2
} from 'lucide-react';
import { Project } from '@/lib/types';
import { formatTimeAgo } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const isDeployed = project.status === 'deployed' && project.activeDeploymentUrl;

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/api/projects/${project.id}/export`, '_blank');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      onDelete(project.id);
    }
  };

  return (
    <div className="bg-[#1a1a1a] rounded-3xl border border-white/10 shadow-lg hover:shadow-2xl hover:border-white/20 transition-all flex flex-col justify-between group overflow-hidden hover:-translate-y-1 duration-200">
      <div className="p-5 sm:p-6">
        {/* Top Badges */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                project.status === 'deployed'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : project.status === 'ready'
                  ? 'bg-brand-500/10 text-brand-300 border border-brand-500/20'
                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
              }`}
            >
              {project.status === 'deployed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
              <span className="capitalize">{project.status}</span>
            </span>

            {project.versions?.length > 0 && (
              <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                v{project.versions.length}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1 text-slate-400">
            <button
              onClick={handleExport}
              title="Download Project ZIP"
              className="p-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              title="Delete Project"
              className="p-1.5 rounded-lg hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title & Description */}
        <Link href={`/projects/${project.id}`} className="block group">
          <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-brand-400 transition-colors leading-snug">
            {project.name}
          </h3>
          <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {project.description || project.initialPrompt}
          </p>
        </Link>

        {/* Tags */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.tags?.map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md bg-[#242424] text-slate-300 text-[11px] font-medium border border-white/5"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-5 sm:px-6 py-3 bg-[#141414] border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-3">
          <span className="flex items-center gap-1">
            <FolderGit2 className="w-3.5 h-3.5 text-slate-500" />
            {project.files?.length || 0} files
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            {formatTimeAgo(project.updatedAt)}
          </span>
        </div>

        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center space-x-1 font-semibold text-brand-400 hover:text-brand-300 transition-colors"
        >
          <span>Open Workspace</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
