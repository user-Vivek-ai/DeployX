'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PreviewRuntime } from '@/lib/preview-runtime';
import { Project } from '@/lib/types';

export default function StandalonePreviewPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then(res => res.json())
      .then(data => {
        if (data.project) setProject(data.project);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-sans text-xs">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Mounting DeployX Live Environment...</span>
        </div>
      </div>
    );
  }

  const srcDoc = PreviewRuntime.compileToSrcDoc(project.files);

  return (
    <iframe
      srcDoc={srcDoc}
      title={`${project.name} - DeployX Live Preview`}
      sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
      className="w-screen h-screen border-0"
    />
  );
}
