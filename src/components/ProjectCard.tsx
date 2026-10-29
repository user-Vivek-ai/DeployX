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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group overflow-hidden">
      <div className="p-6">
        {/* Top Badges */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                project.status === 'deployed'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : project.status === 'ready'
                  ? 'bg-brand-50 text-brand-700 border border-brand-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {project.status === 'deployed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
              <span className="capitalize">{project.status}</span>
            </span>

            {project.versions?.length > 0 && (
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                v{project.versions.length}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1 text-slate-400">
            <button
              onClick={handleExport}
              title="Download Project ZIP"
              className="p-1.5 rounded-lg hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              title="Delete Project"
              className="p-1.5 rounded-lg hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title & Description */}
        <Link href={`/projects/${project.id}`} className="block group">
          <h3 className="font-bold text-lg text-navy-900 group-hover:text-brand-600 transition-colors leading-snug">
            {project.name}
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed">
            {project.description || project.initialPrompt}
          </p>
        </Link>

        {/* Tags */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.tags?.map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-3">
          <span className="flex items-center gap-1">
            <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
            {project.files?.length || 0} files
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {formatTimeAgo(project.updatedAt)}
          </span>
        </div>

        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center space-x-1 font-semibold text-brand-600 hover:text-brand-700 transition-colors"
        >
          <span>Open Workspace</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
