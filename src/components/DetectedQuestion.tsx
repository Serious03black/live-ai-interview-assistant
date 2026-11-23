import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  HelpCircle,
  Sparkles,
  Send,
  Mic,
  MicOff,
  Lightbulb,
  FileText,
  Radio,
  Keyboard,
} from 'lucide-react';
import { DetectedQuestion, QuestionCategory, CandidateProfile } from '../types';

interface DetectedQuestionProps {
  question: DetectedQuestion | null;
  onAskAI: (question: DetectedQuestion) => void;
  onManualSubmit?: (text: string) => void;
  isGenerating: boolean;
  profile?: CandidateProfile;
  onOpenProfile?: () => void;
  latestHeardText?: string;
}

const SAMPLE_QUESTIONS = [
  'Tell me about yourself and your background',
  'What is the difference between React and Angular?',
  'Explain how the JavaScript Event Loop works',
  'How do you design scalable microservices?',
  'What are your strengths and weaknesses?',
];

export const DetectedQuestionPanel: React.FC<DetectedQuestionProps> = ({
  question,
  onAskAI,
  onManualSubmit,
  isGenerating,
  profile,
  onOpenProfile,
  latestHeardText,
}) => {
  const [inputText, setInputText] = useState('');
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef<any>(null);

  const inputTextRef = useRef(inputText);
  inputTextRef.current = inputText;

  const isDictatingRef = useRef(isDictating);
  isDictatingRef.current = isDictating;

  const latestHeardTextRef = useRef(latestHeardText);
  latestHeardTextRef.current = latestHeardText;

  // Toggle voice dictation into the question box
  const toggleDictation = useCallback(() => {
    if (isDictatingRef.current) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsDictating(false);
      return;
    }

    const win = window as any;
    const SpeechClass = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechClass) {
      alert(
        'Speech recognition is not available in this window. For full speech-to-text, open http://localhost:5173 in Google Chrome!'
      );
      return;
    }

    try {
      const rec = new SpeechClass();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (e: any) => {
        let transcript = '';
        for (let i = 0; i < e.results.length; ++i) {
          transcript += (e.results[i][0]?.transcript || '') + ' ';
        }
        if (transcript.trim()) {
          setInputText(transcript.trim());
        }
      };

      rec.onerror = (e: any) => {
        console.warn('Dictation error:', e);
        setIsDictating(false);
      };

      rec.onend = () => {
        setIsDictating(false);
      };

      rec.start();
      recognitionRef.current = rec;
      setIsDictating(true);
    } catch (err) {
      console.warn('Failed to start dictation:', err);
      setIsDictating(false);
    }
  }, []);

  // Submit current question
  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const textToSubmit = inputTextRef.current.trim();
      if (!textToSubmit) {
        // If text field is empty but a detected question exists, ask for that
        if (question && !isGenerating) {
          onAskAI(question);
        }
        return;
      }
      if (!onManualSubmit) return;

      if (isDictatingRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        setIsDictating(false);
      }
      onManualSubmit(textToSubmit);
      setInputText('');
    },
    [question, isGenerating, onAskAI, onManualSubmit]
  );

  // Feed latest heard speech into input box
  const handleFeedLatest = useCallback(() => {
    if (latestHeardTextRef.current) {
      setInputText(latestHeardTextRef.current.trim());
    }
  }, []);

  // Keyboard shortcuts listener:
  // Ctrl+D -> Detect/Dictate Voice into Box
  // Ctrl+F -> Feed Latest Heard Speech into Box
  // Ctrl+Enter -> Ask DeepSeek
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (!isCmdOrCtrl) return;

      // Ctrl + D -> Toggle Voice Dictation into question box
      if (e.code === 'KeyD') {
        e.preventDefault();
        toggleDictation();
        return;
      }

      // Ctrl + F -> Feed latest heard words into question box
      if (e.code === 'KeyF') {
        e.preventDefault();
        handleFeedLatest();
        return;
      }

      // Ctrl + Enter -> Ask DeepSeek
      if (e.code === 'Enter' || e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleDictation, handleFeedLatest, handleSubmit]);

  // Clean up dictation on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const getCategoryBadge = (category: QuestionCategory) => {
    switch (category) {
      case 'CODING':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PROJECT':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'HR':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'TECHNICAL':
      default:
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    }
  };

  const hasResume = !!profile?.resumeText && profile.resumeText.trim().length > 0;

  return (
    <div className="glass-panel rounded-2xl p-4 border border-white/5 space-y-3">
      {/* Header & Category / Resume Grounding Tag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Detected Interview Question
          </h2>
        </div>

        {/* Profile & Resume Grounding Status Badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenProfile}
            title="Click to view or edit candidate resume & profile"
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 transition-all ${
              hasResume
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>
              {hasResume
                ? `Resume Grounded (${profile?.name || 'Candidate'})`
                : 'No Resume (Click to add)'}
            </span>
          </button>

          {question && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getCategoryBadge(
                question.category
              )}`}
            >
              {question.category}
            </span>
          )}
        </div>
      </div>

      {/* Live Hearing Banner - Shows exactly what is heard right now */}
      {latestHeardText && (
        <div className="px-3 py-2 rounded-xl bg-slate-950/60 border border-sky-500/20 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse flex-shrink-0" />
            <span className="text-[11px] text-slate-400 font-medium flex-shrink-0">
              Hearing Live:
            </span>
            <span className="text-[11px] text-sky-200 truncate italic font-mono">
              "{latestHeardText}"
            </span>
          </div>

          <button
            type="button"
            onClick={handleFeedLatest}
            title="Feed heard words into question box (Ctrl + F)"
            className="px-2 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-[10px] text-sky-300 font-semibold flex items-center gap-1 flex-shrink-0 transition-colors"
          >
            <span>Feed to Box</span>
            <kbd className="text-[9px] font-mono bg-sky-950/60 px-1 rounded border border-sky-400/20 text-sky-300">
              Ctrl+F
            </kbd>
          </button>
        </div>
      )}

      {/* Detected Question Box */}
      {question ? (
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/20 space-y-3">
          <p className="text-sm font-semibold text-white leading-relaxed">
            "{question.text}"
          </p>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-500 font-mono">
              Detected at {new Date(question.timestamp).toLocaleTimeString()}
            </span>

            <button
              onClick={() => onAskAI(question)}
              disabled={isGenerating}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Generating...' : 'Get DeepSeek Answer (from Resume)'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5 text-slate-400 text-xs space-y-1.5">
          <p className="text-slate-300 font-medium">Awaiting question from audio stream...</p>
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Lightbulb className="w-3 h-3 text-amber-400" /> Click to test:
            </span>
            {SAMPLE_QUESTIONS.slice(0, 3).map((sq) => (
              <button
                key={sq}
                type="button"
                onClick={() => onManualSubmit?.(sq)}
                className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-2 py-0.5 rounded border border-white/10 transition-colors"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Voice Dictation & Manual Question Input Bar */}
      <form onSubmit={handleSubmit} className="space-y-1.5 pt-1">
        <div className="flex items-center gap-2">
          {/* Voice Dictation Button - Speaks directly into box without typing */}
          <button
            type="button"
            onClick={toggleDictation}
            title={
              isDictating
                ? 'Click to stop dictating (Ctrl + D)'
                : 'Speak into question box (Ctrl + D)'
            }
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md ${
              isDictating
                ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-sky-400 border border-sky-500/30 shadow-sky-500/10'
            }`}
          >
            {isDictating ? (
              <>
                <MicOff className="w-3.5 h-3.5 text-white animate-bounce" />
                <span className="text-[11px]">Listening...</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[11px] hidden sm:inline">Voice Dictate</span>
              </>
            )}
            <kbd className="text-[9px] font-mono bg-black/30 px-1 rounded border border-white/10 text-slate-300">
              Ctrl+D
            </kbd>
          </button>

          {/* Input Field */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isDictating
                ? 'Listening... Speak your question now'
                : 'Type question, press Ctrl+D to speak, or Ctrl+F to paste heard speech...'
            }
            className={`flex-1 px-3 py-2 text-xs bg-slate-900/90 border rounded-xl text-white placeholder-slate-500 focus:outline-none transition-all ${
              isDictating
                ? 'border-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                : 'border-white/10 focus:border-indigo-500'
            }`}
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isGenerating}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white flex items-center gap-1.5 disabled:opacity-40 transition-colors shadow-md shadow-indigo-500/20 flex-shrink-0"
            title="Submit question to DeepSeek (Ctrl + Enter)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask DeepSeek</span>
            <kbd className="text-[9px] font-mono bg-white/20 px-1 rounded border border-white/20 text-white hidden sm:inline">
              Ctrl+↵
            </kbd>
          </button>
        </div>

        {/* Hotkey Guide Indicator */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="bg-slate-800 text-slate-400 px-1 py-0.5 rounded border border-white/5 font-mono">
                Ctrl+D
              </kbd>{' '}
              Voice Dictate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-slate-800 text-slate-400 px-1 py-0.5 rounded border border-white/5 font-mono">
                Ctrl+F
              </kbd>{' '}
              Feed Heard Words
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-slate-800 text-slate-400 px-1 py-0.5 rounded border border-white/5 font-mono">
                Ctrl+↵
              </kbd>{' '}
              Ask DeepSeek
            </span>
          </div>

          <span className="hidden sm:inline text-slate-600">
            Press Enter in box to ask
          </span>
        </div>
      </form>
    </div>
  );
};
