'use client';

import React, { useState } from 'react';
import {
  FileText,
  Presentation,
  Table,
  Globe,
  Download,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Code2,
  ExternalLink
} from 'lucide-react';
import {
  generatePptx,
  generateDocx,
  generateXlsx,
  generateWebsiteZip,
  PresentationData,
  WordDocumentData,
  SpreadsheetData,
  WebsiteData
} from '@/lib/generators/document-builder';

interface DocumentCardProps {
  type: 'pptx' | 'docx' | 'xlsx' | 'website';
  data: any;
}

export function DocumentCard({ type, data }: DocumentCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [previewTab, setPreviewTab] = useState<'preview' | 'code'>('preview');

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      let blob: Blob;
      let filename = 'document';

      if (type === 'pptx') {
        const presData: PresentationData = data;
        filename = `${(presData.title || 'presentation').replace(/[^a-z0-9_-]/gi, '_')}.pptx`;
        blob = await generatePptx(presData);
      } else if (type === 'docx') {
        const docData: WordDocumentData = data;
        filename = `${(docData.title || 'document').replace(/[^a-z0-9_-]/gi, '_')}.docx`;
        blob = await generateDocx(docData);
      } else if (type === 'xlsx') {
        const sheetData: SpreadsheetData = data;
        filename = `${(sheetData.title || 'spreadsheet').replace(/[^a-z0-9_-]/gi, '_')}.xlsx`;
        blob = await generateXlsx(sheetData);
      } else if (type === 'website') {
        const webData: WebsiteData = data;
        filename = `${(webData.title || 'website_project').replace(/[^a-z0-9_-]/gi, '_')}.zip`;
        blob = await generateWebsiteZip(webData);
      } else {
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const getCardTheme = () => {
    switch (type) {
      case 'pptx':
        return {
          icon: <Presentation className="w-5 h-5 text-amber-500" />,
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
          badge: `${data.slides?.length || 0} Slides PPTX`,
          btnColor: 'bg-amber-600 hover:bg-amber-500 text-white',
          label: 'PowerPoint Presentation'
        };
      case 'docx':
        return {
          icon: <FileText className="w-5 h-5 text-blue-500" />,
          bg: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
          badge: `${data.sections?.length || 0} Sections DOCX`,
          btnColor: 'bg-blue-600 hover:bg-blue-500 text-white',
          label: 'Word Document'
        };
      case 'xlsx':
        return {
          icon: <Table className="w-5 h-5 text-emerald-500" />,
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
          badge: `${data.sheets?.[0]?.rows?.length || 0} Rows XLSX`,
          btnColor: 'bg-emerald-600 hover:bg-emerald-500 text-white',
          label: 'Excel Spreadsheet'
        };
      case 'website':
        return {
          icon: <Globe className="w-5 h-5 text-indigo-500" />,
          bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500',
          badge: 'Interactive Web App',
          btnColor: 'bg-indigo-600 hover:bg-indigo-500 text-white',
          label: 'Website Project'
        };
    }
  };

  const theme = getCardTheme();

  return (
    <>
      <div className="my-3 p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all shadow-md group">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${theme.bg}`}>
              {theme.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-xs sm:text-sm text-white">{data.title || 'Generated Artifact'}</h4>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${theme.bg}`}>
                  {theme.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {theme.label} ready for download and editing.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={() => setShowPreviewModal(true)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Preview content"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all active:scale-95 disabled:opacity-50 ${theme.btnColor}`}
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>{type === 'website' ? 'Download ZIP' : `Download .${type}`}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Full Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-[#1f1f1e] border border-white/15 rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-[#191918]">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${theme.bg}`}>
                  {theme.icon}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{data.title}</h3>
                  <p className="text-[11px] text-slate-400">{theme.label} Preview</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow ${theme.btnColor}`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-grow overflow-y-auto p-4 sm:p-6 bg-[#161615]">
              {type === 'pptx' && data.slides && (
                <div className="h-full flex flex-col">
                  {/* Slide View Canvas */}
                  <div className="flex-grow flex items-center justify-center">
                    <div className="w-full max-w-2xl aspect-[16/9] rounded-2xl bg-[#242424] border border-white/10 p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden">
                      <div className="space-y-4">
                        <div className="w-12 h-1 bg-amber-500 rounded-full" />
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                          {data.slides[activeSlideIdx]?.title}
                        </h2>
                        {data.slides[activeSlideIdx]?.subtitle && (
                          <p className="text-xs sm:text-sm text-amber-400 font-medium">
                            {data.slides[activeSlideIdx]?.subtitle}
                          </p>
                        )}
                        {data.slides[activeSlideIdx]?.bullets && (
                          <ul className="space-y-2 pt-2">
                            {data.slides[activeSlideIdx].bullets.map((b: string, bIdx: number) => (
                              <li key={bIdx} className="text-xs sm:text-sm text-slate-300 flex items-start gap-2">
                                <span className="text-amber-400 font-bold">•</span>
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {data.slides[activeSlideIdx]?.content && (
                          <p className="text-xs text-slate-400 pt-2 leading-relaxed">
                            {data.slides[activeSlideIdx].content}
                          </p>
                        )}
                      </div>

                      <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
                        <span>DeployX AI Presentation</span>
                        <span>Slide {activeSlideIdx + 1} of {data.slides.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Slide Carousel Controls */}
                  <div className="flex items-center justify-center space-x-4 pt-4">
                    <button
                      onClick={() => setActiveSlideIdx(prev => Math.max(0, prev - 1))}
                      disabled={activeSlideIdx === 0}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-semibold text-slate-300">
                      {activeSlideIdx + 1} / {data.slides.length}
                    </span>
                    <button
                      onClick={() => setActiveSlideIdx(prev => Math.min(data.slides.length - 1, prev + 1))}
                      disabled={activeSlideIdx === data.slides.length - 1}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {type === 'docx' && data.sections && (
                <div className="max-w-2xl mx-auto bg-[#222221] p-8 rounded-2xl border border-white/10 shadow-lg space-y-6 text-slate-200">
                  <div className="border-b border-white/10 pb-4">
                    <h1 className="text-2xl font-bold text-white">{data.title}</h1>
                    {data.subtitle && <p className="text-sm text-slate-400 mt-1">{data.subtitle}</p>}
                  </div>
                  {data.sections.map((sec: any, idx: number) => (
                    <div key={idx} className="space-y-3">
                      {sec.heading && (
                        <h3 className="text-base font-bold text-white border-b border-white/5 pb-1">
                          {sec.heading}
                        </h3>
                      )}
                      {(sec.paragraphs || []).map((p: string, pIdx: number) => (
                        <p key={pIdx} className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          {p}
                        </p>
                      ))}
                      {(sec.bullets || []).map((b: string, bIdx: number) => (
                        <li key={bIdx} className="text-xs sm:text-sm text-slate-300 pl-2">
                          {b}
                        </li>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {type === 'xlsx' && data.sheets && (
                <div className="max-w-3xl mx-auto overflow-x-auto rounded-2xl border border-white/10 bg-[#202020] shadow-lg">
                  <table className="w-full text-xs text-left text-slate-300">
                    <thead className="bg-[#2a2a2a] text-white font-bold border-b border-white/10">
                      <tr>
                        {(data.sheets[0]?.headers || []).map((h: string, hIdx: number) => (
                          <th key={hIdx} className="p-3 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(data.sheets[0]?.rows || []).map((row: any[], rIdx: number) => (
                        <tr key={rIdx} className="hover:bg-white/5">
                          {row.map((cell: any, cIdx: number) => (
                            <td key={cIdx} className="p-3 font-mono">{String(cell)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {type === 'website' && (
                <div className="h-full flex flex-col space-y-3">
                  <div className="flex items-center space-x-2 border-b border-white/10 pb-2">
                    <button
                      onClick={() => setPreviewTab('preview')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                        previewTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Live Preview</span>
                    </button>
                    <button
                      onClick={() => setPreviewTab('code')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                        previewTab === 'code' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Source Code</span>
                    </button>
                  </div>

                  <div className="flex-grow rounded-2xl overflow-hidden border border-white/10 bg-white">
                    {previewTab === 'preview' ? (
                      <iframe
                        srcDoc={data.html || '<html><body>No preview</body></html>'}
                        title="Website Live Sandbox"
                        sandbox="allow-scripts allow-forms allow-modals"
                        className="w-full h-full border-0"
                      />
                    ) : (
                      <div className="h-full p-4 bg-[#141414] overflow-y-auto text-xs font-mono text-slate-300">
                        <pre className="whitespace-pre">{data.html}</pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
