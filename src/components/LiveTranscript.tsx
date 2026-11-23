import React, { useEffect, useRef, useState } from 'react';
import {
  MessageSquare,
  Trash2,
  ArrowDownCircle,
  Sparkles,
  AlertTriangle,
  ExternalLink,
  Check,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { TranscriptSegment } from '../types';

interface LiveTranscriptProps {
  segments: TranscriptSegment[];
  onClear: () => void;
  isListening: boolean;
  onAskAI?: (text: string) => void;
  speechError?: string | null;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const LiveTranscript: React.FC<LiveTranscriptProps> = ({
  segments,
  onClear,
  isListening,
  onAskAI,
  speechError,
  isExpanded = false,
  onToggleExpand,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Auto-scroll to bottom as new speech arrives
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [segments]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText('http://localhost:5173');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const finalSegments = segments.filter((s) => s.isFinal);
  const latestSegment = finalSegments.length > 0 ? finalSegments[finalSegments.length - 1] : null;

  return (
    <div className="glass-panel rounded-2xl flex flex-col h-full overflow-hidden border border-white/5 transition-all">
      {/* Header */}
      <div className="p-3 border-b border-white/5 flex items-center justify-between bg-slate-950/60 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Live Speech Transcript
          </h2>
          {isListening && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Streaming
            </span>
          )}
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            ({segments.length} segments)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Answer Latest Button */}
          {latestSegment && onAskAI && (
            <button
              onClick={() => onAskAI(latestSegment.text)}
              className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 flex items-center gap-1 transition-colors"
              title="Send latest transcribed sentence to DeepSeek"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Answer Latest</span>
            </button>
          )}

          {/* Short / Big Toggle Button */}
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border flex items-center gap-1 transition-all ${
                isExpanded
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-white/5 text-slate-300 hover:text-white border-white/10 hover:bg-white/10'
              }`}
              title={
                isExpanded
                  ? 'Make transcript Short (minimize to compact strip)'
                  : 'Make transcript Big (expand full history)'
              }
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="w-3 h-3 text-sky-400" />
                  <span>Short</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3 h-3 text-sky-400" />
                  <span>Big</span>
                </>
              )}
            </button>
          )}

          {/* Clear Button */}
          <button
            onClick={onClear}
            title="Clear transcript (Ctrl+K)"
            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors text-xs flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Speech Recognition Error Banner if Electron or permission blocked */}
      {speechError && (
        <div className="m-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2.5 flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <p className="font-semibold text-amber-300 text-[11px]">Speech Recognition Status</p>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              {speechError}
            </p>
            <div className="flex items-center gap-2 pt-0.5">
              <button
                onClick={handleCopyLink}
                className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-[10px] text-amber-300 flex items-center gap-1 font-mono transition-colors"
              >
                {copiedLink ? <Check className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
                <span>{copiedLink ? 'Copied localhost:5173' : 'Copy Chrome Web Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transcript Stream */}
      <div
        ref={containerRef}
        className="flex-1 p-3 overflow-y-auto space-y-2 text-xs leading-relaxed"
      >
        {segments.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-slate-500 gap-2 py-2">
            <ArrowDownCircle className="w-4 h-4 text-slate-600 animate-pulse flex-shrink-0" />
            <span className="text-[11px] text-slate-400">
              Awaiting audio... Start listening or speak; interviewer speech appears here live.
            </span>
          </div>
        ) : (
          segments.map((seg) => (
            <div
              key={seg.id}
              className={`p-2 rounded-xl transition-all group ${
                seg.isFinal
                  ? 'bg-slate-900/60 border border-white/5 text-slate-200'
                  : 'bg-sky-500/5 border border-sky-500/20 text-sky-300 italic'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                <span className="font-medium text-slate-400">
                  {seg.isFinal ? 'Interviewer Speech' : 'Transcribing...'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px]">
                    {new Date(seg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                  {seg.isFinal && onAskAI && (
                    <button
                      onClick={() => onAskAI(seg.text)}
                      className="opacity-80 group-hover:opacity-100 hover:text-indigo-400 text-[10px] flex items-center gap-0.5 text-slate-400 transition-opacity"
                      title="Answer this sentence"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      <span>Ask AI</span>
                    </button>
                  )}
                </div>
              </div>
              <p className="font-normal text-xs leading-relaxed">{seg.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
