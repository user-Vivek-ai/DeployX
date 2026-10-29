'use client';

import React, { useState } from 'react';
import {
  FileCode,
  FileText,
  Save,
  Copy,
  Check,
  Download,
  Plus,
  Trash2,
  FolderTree,
  Menu,
  X
} from 'lucide-react';
import { ProjectFile } from '@/lib/types';

interface CodeEditorProps {
  files: ProjectFile[];
  onSaveFile: (path: string, content: string) => Promise<void>;
  onCreateFile: (path: string, content: string) => Promise<void>;
  onDeleteFile: (path: string) => Promise<void>;
}

export function CodeEditor({
  files,
  onSaveFile,
  onCreateFile,
  onDeleteFile
}: CodeEditorProps) {
  const [selectedPath, setSelectedPath] = useState<string>(files[0]?.path || 'index.html');
  const [currentContent, setCurrentContent] = useState<string>(files[0]?.content || '');
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const selectedFile = files.find(f => f.path === selectedPath) || files[0];

  const handleSelectFile = (file: ProjectFile) => {
    if (isModified) {
      if (!confirm('You have unsaved changes in this file. Discard and switch?')) return;
    }
    setSelectedPath(file.path);
    setCurrentContent(file.content);
    setIsModified(false);
    setShowMobileSidebar(false);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentContent(e.target.value);
    setIsModified(true);
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    setIsSaving(true);
    try {
      await onSaveFile(selectedFile.path, currentContent);
      setIsModified(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateNew = async () => {
    if (!newFileName.trim()) return;
    await onCreateFile(newFileName.trim(), '/* New File */\n');
    setSelectedPath(newFileName.trim());
    setCurrentContent('/* New File */\n');
    setNewFileName('');
    setShowNewFileInput(false);
  };

  const lineCount = (currentContent.match(/\n/g) || []).length + 1;

  return (
    <div className="flex h-full bg-slate-900 text-slate-100 font-mono text-xs overflow-hidden relative">
      {/* File Tree Sidebar (Responsive: desktop sidebar or mobile slide-in drawer) */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-200 md:relative md:translate-x-0 md:w-56 flex-shrink-0 ${
          showMobileSidebar ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-3 border-b border-slate-800 flex items-center justify-between text-slate-400">
          <span className="font-sans font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <FolderTree className="w-3.5 h-3.5 text-brand-400" />
            Project Files
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowNewFileInput(!showNewFileInput)}
              title="Create New File"
              className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowMobileSidebar(false)}
              className="md:hidden p-1 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* New File Inline Input */}
        {showNewFileInput && (
          <div className="p-2 border-b border-slate-800 bg-slate-900">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateNew()}
              placeholder="filename.ext"
              className="w-full px-2 py-1 bg-slate-800 rounded text-[11px] text-white border border-slate-700 outline-none"
              autoFocus
            />
          </div>
        )}

        {/* File List */}
        <div className="flex-grow overflow-y-auto py-2 space-y-0.5">
          {files.map((file) => {
            const isSelected = file.path === selectedPath;
            return (
              <button
                key={file.path}
                onClick={() => handleSelectFile(file)}
                className={`w-full px-3 py-2 sm:py-1.5 flex items-center justify-between text-left transition-colors ${
                  isSelected
                    ? 'bg-brand-950/80 text-brand-300 border-l-2 border-brand-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <FileCode className={`w-3.5 h-3.5 ${isSelected ? 'text-brand-400' : 'text-slate-500'}`} />
                  <span className="truncate">{file.path}</span>
                </div>
                {isSelected && isModified && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Unsaved changes" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile backdrop for drawer */}
      {showMobileSidebar && (
        <div
          onClick={() => setShowMobileSidebar(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
        />
      )}

      {/* Editor Main Surface */}
      <div className="flex-grow flex flex-col bg-slate-900 min-w-0">
        {/* Editor Controls Bar */}
        <div className="h-10 sm:h-11 px-3 sm:px-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 flex-shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3 truncate">
            {/* Mobile File List Toggle Button */}
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="md:hidden p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1 font-sans text-xs"
            >
              <Menu className="w-3.5 h-3.5" />
              <span>Files</span>
            </button>

            <span className="text-white font-semibold truncate">{selectedPath}</span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline">{lineCount} lines</span>
            {isModified && (
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-sans text-[10px]">
                Modified
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
            <button
              onClick={handleCopy}
              className="p-1 sm:p-1.5 hover:text-white rounded hover:bg-slate-800 transition-colors flex items-center gap-1 font-sans text-[11px]"
              title="Copy code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleSave}
              disabled={!isModified || isSaving}
              className="px-2.5 sm:px-3 py-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-lg font-sans text-[11px] font-semibold flex items-center gap-1 shadow-sm transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>

        {/* Textarea Code Buffer */}
        <div className="flex-grow flex relative overflow-hidden">
          {/* Line Numbers (Hidden on very small mobile for maximum code editing space) */}
          <div className="hidden xs:flex w-10 sm:w-12 bg-slate-950/50 text-slate-600 py-3 text-right pr-2 sm:pr-3 select-none flex-col font-mono text-[11px] leading-relaxed border-r border-slate-800/60">
            {Array.from({ length: Math.min(lineCount, 500) }).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Text Editor */}
          <textarea
            value={currentContent}
            onChange={handleTextChange}
            spellCheck={false}
            className="flex-grow p-3 bg-transparent text-slate-200 resize-none outline-none font-mono text-xs sm:text-[11px] leading-relaxed selection:bg-brand-900/60"
          />
        </div>
      </div>
    </div>
  );
}
