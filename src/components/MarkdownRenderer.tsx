'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { DocumentCard } from '@/components/DocumentCard';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // First, check for :::document or :::website blocks
  const parts: React.ReactNode[] = [];
  const lines = content.split('\n');

  let inSpecialBlock = false;
  let specialBlockType = '';
  let specialBuffer: string[] = [];

  let inCodeBlock = false;
  let codeLanguage = '';
  let codeBuffer: string[] = [];
  let textBuffer: string[] = [];

  const flushTextBuffer = () => {
    if (textBuffer.length === 0) return;
    const textContent = textBuffer.join('\n');
    textBuffer = [];

    const paragraphs = textContent.split(/\n\n+/);
    paragraphs.forEach((para, pIdx) => {
      if (!para.trim()) return;

      if (para.startsWith('### ')) {
        parts.push(
          <h3 key={`h3-${parts.length}-${pIdx}`} className="text-base font-bold text-white mt-3 mb-1.5">
            {renderInlineMarkdown(para.replace(/^###\s+/, ''))}
          </h3>
        );
        return;
      }
      if (para.startsWith('## ')) {
        parts.push(
          <h2 key={`h2-${parts.length}-${pIdx}`} className="text-lg font-bold text-white mt-4 mb-2 border-b border-white/10 pb-1">
            {renderInlineMarkdown(para.replace(/^##\s+/, ''))}
          </h2>
        );
        return;
      }
      if (para.startsWith('# ')) {
        parts.push(
          <h1 key={`h1-${parts.length}-${pIdx}`} className="text-xl font-extrabold text-white mt-4 mb-2">
            {renderInlineMarkdown(para.replace(/^#\s+/, ''))}
          </h1>
        );
        return;
      }

      const linesInPara = para.split('\n');
      const isList = linesInPara.every(l => /^\s*([-*]|\d+\.)\s+/.test(l));

      if (isList) {
        parts.push(
          <ul key={`ul-${parts.length}-${pIdx}`} className="space-y-1.5 my-2 pl-4 list-disc marker:text-brand-400">
            {linesInPara.map((line, lIdx) => (
              <li key={lIdx} className="text-slate-200 text-xs sm:text-[13px] leading-relaxed">
                {renderInlineMarkdown(line.replace(/^\s*([-*]|\d+\.)\s+/, ''))}
              </li>
            ))}
          </ul>
        );
        return;
      }

      if (para.startsWith('> ')) {
        parts.push(
          <blockquote key={`bq-${parts.length}-${pIdx}`} className="border-l-4 border-brand-500 pl-3 my-2 text-slate-300 italic text-xs sm:text-[13px]">
            {renderInlineMarkdown(para.replace(/^>\s+/, ''))}
          </blockquote>
        );
        return;
      }

      parts.push(
        <p key={`p-${parts.length}-${pIdx}`} className="text-slate-200 text-xs sm:text-[13px] leading-relaxed my-1.5 whitespace-pre-wrap">
          {renderInlineMarkdown(para)}
        </p>
      );
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect special artifact blocks: :::document or :::website
    if (line.trim().startsWith(':::document') || line.trim().startsWith(':::website')) {
      flushTextBuffer();
      inSpecialBlock = true;
      specialBlockType = line.trim().startsWith(':::document') ? 'document' : 'website';
      specialBuffer = [];
      continue;
    }

    if (inSpecialBlock) {
      if (line.trim() === ':::') {
        inSpecialBlock = false;
        try {
          const rawJson = specialBuffer.join('\n');
          const parsed = JSON.parse(rawJson);
          const docType = specialBlockType === 'website' ? 'website' : (parsed.type || 'pptx');
          parts.push(
            <DocumentCard
              key={`doc-${parts.length}`}
              type={docType}
              data={parsed}
            />
          );
        } catch (e) {
          console.warn('Could not parse document artifact JSON:', e);
        }
        specialBuffer = [];
      } else {
        specialBuffer.push(line);
      }
      continue;
    }

    // Normal code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        const codeText = codeBuffer.join('\n');
        parts.push(
          <CodeBlock
            key={`code-${parts.length}`}
            code={codeText}
            language={codeLanguage || 'code'}
          />
        );
        codeBuffer = [];
        codeLanguage = '';
        inCodeBlock = false;
      } else {
        flushTextBuffer();
        codeLanguage = line.replace(/^```/, '').trim();
        inCodeBlock = true;
      }
    } else if (inCodeBlock) {
      codeBuffer.push(line);
    } else {
      textBuffer.push(line);
    }
  }

  if (inCodeBlock && codeBuffer.length > 0) {
    parts.push(
      <CodeBlock
        key={`code-${parts.length}`}
        code={codeBuffer.join('\n')}
        language={codeLanguage || 'code'}
      />
    );
  } else {
    flushTextBuffer();
  }

  return <div className="space-y-2 break-words">{parts}</div>;
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden bg-[#141414] border border-white/10 shadow-lg text-xs font-mono">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#1e1e1e] border-b border-white/5 text-[11px] text-slate-400">
        <span className="font-semibold uppercase tracking-wider text-slate-300">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3 overflow-x-auto text-slate-200 leading-relaxed font-mono">
        <pre className="whitespace-pre">{code}</pre>
      </div>
    </div>
  );
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*|\[.*?\]\(.*?\))/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={match.index} className="font-semibold text-white">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={match.index} className="px-1.5 py-0.5 rounded bg-white/10 text-brand-300 font-mono text-[11px] border border-white/5">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(<em key={match.index} className="italic text-slate-300">{token.slice(1, -1)}</em>);
    } else if (token.startsWith('[') && token.includes('](') && token.endsWith(')')) {
      const linkText = token.substring(1, token.indexOf(']('));
      const linkUrl = token.substring(token.indexOf('](') + 2, token.length - 1);
      parts.push(
        <a key={match.index} href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">
          {linkText}
        </a>
      );
    } else {
      parts.push(token);
    }

    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }

  return parts;
}
