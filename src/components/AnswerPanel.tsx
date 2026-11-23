import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  RotateCw,
  Trash2,
  Clock,
  FileText,
  AlertCircle,
  Code2,
} from 'lucide-react';
import { AIAnswer } from '../types';

interface AnswerPanelProps {
  answer: AIAnswer | null;
  isStreaming: boolean;
  onRegenerate: () => void;
  onClear: () => void;
  error?: string | null;
}

export const AnswerPanel: React.FC<AnswerPanelProps> = ({
  answer,
  isStreaming,
  onRegenerate,
  onClear,
  error,
}) => {
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('large');

  const handleCopy = () => {
    if (!answer?.content) return;
    navigator.clipboard.writeText(answer.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = answer?.content ? answer.content.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="glass-panel rounded-2xl flex flex-col h-full overflow-hidden border border-white/5">
      {/* Header */}
      <div className="p-3.5 border-b border-white/5 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            DeepSeek Live Answer
          </h2>
          {isStreaming && (
            <span className="flex items-center gap-1.5 text-[10px] text-sky-400 font-mono px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              Streaming tokens...
            </span>
          )}
        </div>

        {answer && (
          <div className="flex items-center gap-2">
            {/* Font size toggle */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 border border-white/5 text-[10px] text-slate-400">
              <button
                type="button"
                onClick={() => setFontSize('normal')}
                className={`px-1.5 py-0.5 rounded ${fontSize === 'normal' ? 'bg-sky-500 text-white font-bold' : 'hover:text-white'}`}
                title="Normal text"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize('large')}
                className={`px-1.5 py-0.5 rounded ${fontSize === 'large' ? 'bg-sky-500 text-white font-bold' : 'hover:text-white'}`}
                title="Large text"
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => setFontSize('xlarge')}
                className={`px-1.5 py-0.5 rounded ${fontSize === 'xlarge' ? 'bg-sky-500 text-white font-bold' : 'hover:text-white'}`}
                title="Extra Large text"
              >
                A++
              </button>
            </div>

            {/* Latency & Word Count */}
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                {answer.latencyMs}ms
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3 text-slate-500" />
                {wordCount} words
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 pl-2 border-l border-white/10">
              <button
                onClick={handleCopy}
                disabled={!answer.content}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-xs flex items-center gap-1"
                title="Copy answer (Ctrl+C)"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={onRegenerate}
                disabled={isStreaming}
                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors text-xs"
                title="Regenerate answer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isStreaming ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={onClear}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors text-xs"
                title="Clear answer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Answer View */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-200">AI Response Error</p>
              <p className="mt-1 leading-relaxed">{error}</p>
            </div>
          </div>
        ) : isStreaming && !answer?.content ? (
          <div className="space-y-3 py-6">
            <div className="h-4 bg-slate-800 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-slate-800 rounded animate-pulse w-full" />
            <div className="h-4 bg-slate-800 rounded animate-pulse w-5/6" />
            <div className="h-20 bg-slate-900 rounded-xl border border-white/5 animate-pulse mt-4" />
          </div>
        ) : answer?.content ? (
          <div
            className={`text-slate-100 whitespace-pre-wrap font-sans select-text leading-relaxed tracking-wide ${
              fontSize === 'xlarge'
                ? 'text-lg md:text-xl font-medium'
                : fontSize === 'large'
                ? 'text-base md:text-[17px]'
                : 'text-sm'
            }`}
          >
            {answer.content}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2 py-12">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Code2 className="w-5 h-5" />
            </div>
            <p className="font-semibold text-slate-300 text-xs">AI Interview Answer Workspace</p>
            <p className="text-[11px] text-slate-500 max-w-sm">
              When an interview question is detected, DeepSeek will automatically stream a concise, high-impact answer personalized to your profile and resume.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
