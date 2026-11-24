import React, { useState } from 'react';
import { X, Copy, Check, Radio, Sparkles, Video, HelpCircle } from 'lucide-react';

interface GoogleMeetSyncModalProps {
  open: boolean;
  onClose: () => void;
  serverOnline: boolean;
}

export const GoogleMeetSyncModal: React.FC<GoogleMeetSyncModalProps> = ({
  open,
  onClose,
  serverOnline,
}) => {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const scriptCode = `// 🎙️ Google Meet to Live AI Interview Assistant Auto-Sync
(function() {
  const ws = new WebSocket('ws://localhost:3001');
  let lastText = '';
  ws.onopen = () => console.log('✅ Connected to Live AI Interview Assistant!');
  const observer = new MutationObserver(() => {
    const elList = document.querySelectorAll('.bh44bd, [jsname="YSvyfd"], div[jscontroller="D1tHje"] span, .nMepK');
    if (elList.length) {
      const text = Array.from(elList).map(e => e.textContent.trim()).filter(Boolean).join(' ');
      if (text && text.length > 5 && text !== lastText) {
        lastText = text;
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'SPEECH_TRANSCRIPT', text, isFinal: true }));
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  console.log('🚀 Listening for Google Meet captions...');
})();`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0e172a] border border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">
              Google Meet Direct Subtitle Auto-Sync
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-1">
            <p className="font-semibold text-xs text-emerald-200">
              Zero-Microphone Audio Mode (Headphones Friendly)
            </p>
            <p className="text-[11px] leading-relaxed text-emerald-300/90">
              When wearing headphones or in a meeting, the microphone cannot hear the interviewer. This feature streams Google Meet's live captions directly into this assistant without listening to any microphone sound!
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-white text-xs">How to use (Takes 5 seconds):</h3>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-white/5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                  1
                </span>
                <div>
                  <p className="font-semibold text-slate-200">Turn on Captions in Google Meet</p>
                  <p className="text-slate-400 text-[11px]">
                    Press <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-white font-mono">c</kbd> on your keyboard inside Google Meet (or click the <strong>CC</strong> button).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-white/5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                  2
                </span>
                <div>
                  <p className="font-semibold text-slate-200">Copy the 1-Line Auto-Sync Script</p>
                  <p className="text-slate-400 text-[11px]">
                    Click the button below to copy the helper snippet.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-white/5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                  3
                </span>
                <div>
                  <p className="font-semibold text-slate-200">Paste in Google Meet Console</p>
                  <p className="text-slate-400 text-[11px]">
                    In Google Meet, press <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-white font-mono">F12</kbd> (or right-click $\rightarrow$ Inspect $\rightarrow$ Console), paste, and hit <strong>Enter</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Script box */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">
                meet-caption-sync.js
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Auto-Sync Script'}</span>
              </button>
            </div>

            <pre className="p-2.5 rounded-lg bg-slate-900 font-mono text-[10px] text-slate-300 overflow-x-auto max-h-36 leading-relaxed select-all">
              {scriptCode}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Backend WebSocket: <span className="text-emerald-400 font-mono">ws://localhost:3001</span>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
