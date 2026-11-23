import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AudioVisualizer } from './components/AudioVisualizer';
import { LiveTranscript } from './components/LiveTranscript';
import { DetectedQuestionPanel } from './components/DetectedQuestion';
import { AnswerPanel } from './components/AnswerPanel';
import { SettingsModal } from './components/SettingsModal';
import { ProfileModal } from './components/ProfileModal';
import {
  AppSettings,
  CandidateProfile,
  DetectedQuestion,
  AIAnswer,
  SessionHistoryItem,
  TranscriptSegment,
} from './types';
import {
  loadSettings,
  saveSettings,
  loadProfile,
  saveProfile,
  loadHistory,
  saveHistory,
} from './utils/storage';
import { speechRecognitionService } from './services/speechRecognition';
import { createDetectedQuestion } from './services/questionDetector';
import { aiService } from './services/aiService';

export const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [profile, setProfile] = useState<CandidateProfile>(loadProfile);
  const [history, setHistory] = useState<SessionHistoryItem[]>(loadHistory);

  const [isListening, setIsListening] = useState(false);
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<DetectedQuestion | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<AIAnswer | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [latestHeardText, setLatestHeardText] = useState<string>('');

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [alwaysOnTop, setAlwaysOnTop] = useState(settings.alwaysOnTop);
  const [serverOnline, setServerOnline] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

  // Check backend server health
  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/health');
        if (res.ok) setServerOnline(true);
      } catch {
        setServerOnline(false);
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 10000);
    return () => clearInterval(interval);
  }, []);

  // Sync settings & profile changes
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleUpdateProfile = (newProfile: CandidateProfile) => {
    setProfile(newProfile);
    saveProfile(newProfile);
  };

  // Toggle Always on top
  const handleToggleAlwaysOnTop = async () => {
    const nextVal = !alwaysOnTop;
    setAlwaysOnTop(nextVal);
    handleUpdateSettings({ ...settings, alwaysOnTop: nextVal });

    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      await (window as any).electronAPI.setAlwaysOnTop(nextVal);
    }
  };

  // Trigger AI Answer Generation for a detected question
  const generateAnswerForQuestion = useCallback(
    async (q: DetectedQuestion) => {
      setAiError(null);
      setIsStreaming(true);

      const startTime = performance.now();
      const newAnswerId = 'ans_' + Date.now();

      setCurrentAnswer({
        id: newAnswerId,
        questionId: q.id,
        content: '',
        isStreaming: true,
        latencyMs: 0,
        provider: settings.aiProvider,
        model: settings.deepseekModel,
        category: q.category,
        timestamp: Date.now(),
      });

      let accumulatedContent = '';

      await aiService.streamAnswer(
        q.text,
        q.category,
        profile,
        settings,
        {
          onChunk: (chunk: string) => {
            accumulatedContent += chunk;
            const latency = Math.round(performance.now() - startTime);

            setCurrentAnswer((prev) =>
              prev
                ? {
                    ...prev,
                    content: accumulatedContent,
                    latencyMs: latency,
                  }
                : null
            );
          },
          onComplete: () => {
            setIsStreaming(false);
            const latency = Math.round(performance.now() - startTime);

            const finalizedAnswer: AIAnswer = {
              id: newAnswerId,
              questionId: q.id,
              content: accumulatedContent,
              isStreaming: false,
              latencyMs: latency,
              provider: settings.aiProvider,
              model: settings.deepseekModel,
              category: q.category,
              timestamp: Date.now(),
            };

            setCurrentAnswer(finalizedAnswer);

            // Save to session history
            setHistory((prev) => {
              const updated: SessionHistoryItem[] = [
                {
                  id: 'sess_' + Date.now(),
                  question: q,
                  answer: finalizedAnswer,
                  timestamp: Date.now(),
                },
                ...prev.filter((item) => item.question.id !== q.id),
              ];
              saveHistory(updated);
              return updated;
            });
          },
          onError: (err: string) => {
            setIsStreaming(false);
            setAiError(err);
          },
        }
      );
    },
    [profile, settings]
  );

  // Handle incoming speech transcript
  const handleTranscript = useCallback(
    (segment: TranscriptSegment) => {
      setSpeechError(null);
      setLatestHeardText(segment.text);
      setTranscriptSegments((prev) => {
        if (!segment.isFinal) {
          const filtered = prev.filter((s) => s.id !== 'interim_current');
          return [...filtered, segment];
        }
        const filtered = prev.filter((s) => s.id !== 'interim_current');
        return [...filtered, segment];
      });

      // Analyze completed sentences for questions
      if (segment.isFinal) {
        const detected = createDetectedQuestion(segment.text);
        if (detected) {
          setCurrentQuestion(detected);

          // Auto-generate answer if enabled in settings
          if (settings.autoGenerateAnswer) {
            generateAnswerForQuestion(detected);
          }
        }
      }
    },
    [settings.autoGenerateAnswer, generateAnswerForQuestion]
  );

  // Handle manual question submission
  const handleManualAsk = useCallback(
    (text: string) => {
      const question = createDetectedQuestion(text, 'manual') || {
        id: 'q_' + Date.now(),
        text,
        category: 'TECHNICAL',
        confidence: 1,
        timestamp: Date.now(),
        source: 'manual',
      };
      setCurrentQuestion(question);
      generateAnswerForQuestion(question);
    },
    [generateAnswerForQuestion]
  );

  // Toggle listening
  const handleToggleListening = useCallback(() => {
    if (isListening) {
      speechRecognitionService.stop();
      setIsListening(false);
    } else {
      setSpeechError(null);
      speechRecognitionService.setLanguage(settings.speechLanguage);
      speechRecognitionService.start(
        handleTranscript,
        (err) => {
          console.warn('Speech Recognition notice:', err);
          if (err === 'network') {
            setSpeechError(
              'Notice: Electron cannot connect to Google Speech Recognition cloud servers without Google API keys. For live speech-to-text, open http://localhost:5173 in Google Chrome! You can also type or paste questions directly.'
            );
          } else if (err === 'not-allowed') {
            setSpeechError('Microphone permission was denied. Please allow microphone access in system/browser settings.');
          } else {
            setSpeechError(`Speech recognition notice: ${err}. You can type or paste any question directly.`);
          }
        }
      );
      setIsListening(true);
    }
  }, [isListening, settings.speechLanguage, handleTranscript]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore plain typing inside input or textarea, but allow Ctrl shortcuts
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if ((tag === 'input' || tag === 'textarea') && !e.ctrlKey && !e.metaKey) return;

      // Ctrl+Space -> Toggle Listening
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        handleToggleListening();
      }

      // Ctrl+K -> Clear Transcript
      if (e.ctrlKey && e.code === 'KeyK') {
        e.preventDefault();
        setTranscriptSegments([]);
      }

      // Ctrl+R -> Regenerate answer
      if (e.ctrlKey && e.code === 'KeyR' && currentQuestion && !isStreaming) {
        e.preventDefault();
        generateAnswerForQuestion(currentQuestion);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleListening, currentQuestion, isStreaming, generateAnswerForQuestion]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090D16] text-slate-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <Navbar
        settings={settings}
        profile={profile}
        onUpdateSettings={handleUpdateSettings}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        serverOnline={serverOnline}
        alwaysOnTop={alwaysOnTop}
        onToggleAlwaysOnTop={handleToggleAlwaysOnTop}
      />

      {/* Main App Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar History */}
        <Sidebar
          history={history}
          activeId={currentQuestion?.id}
          onSelectHistory={(item) => {
            setCurrentQuestion(item.question);
            if (item.answer) {
              setCurrentAnswer(item.answer);
            }
          }}
          onClearHistory={() => {
            setHistory([]);
            saveHistory([]);
          }}
        />

        {/* Dashboard Panels */}
        <main className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
          {/* Audio Visualizer & Control Bar */}
          <AudioVisualizer
            isListening={isListening}
            onToggleListening={handleToggleListening}
            selectedDeviceId={settings.audioInputDeviceId}
            onSelectDevice={(id) => handleUpdateSettings({ ...settings, audioInputDeviceId: id })}
          />

          {/* Core Content Grid */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden min-h-0">
            {/* Left Column: Live Speech Transcript (5 cols) */}
            <div className="lg:col-span-5 h-full overflow-hidden flex flex-col">
              <LiveTranscript
                segments={transcriptSegments}
                onClear={() => setTranscriptSegments([])}
                isListening={isListening}
                onAskAI={handleManualAsk}
                speechError={speechError}
              />
            </div>

            {/* Right Column: Detected Question & DeepSeek Live Answer (7 cols) */}
            <div className="lg:col-span-7 h-full overflow-hidden flex flex-col gap-4">
              {/* Question Panel */}
              <div className="flex-shrink-0">
                <DetectedQuestionPanel
                  question={currentQuestion}
                  onAskAI={generateAnswerForQuestion}
                  onManualSubmit={handleManualAsk}
                  isGenerating={isStreaming}
                  profile={profile}
                  onOpenProfile={() => setProfileOpen(true)}
                  latestHeardText={latestHeardText}
                />
              </div>

              {/* Streaming Answer Panel */}
              <div className="flex-1 overflow-hidden min-h-0">
                <AnswerPanel
                  answer={currentAnswer}
                  isStreaming={isStreaming}
                  onRegenerate={() => {
                    if (currentQuestion) generateAnswerForQuestion(currentQuestion);
                  }}
                  onClear={() => setCurrentAnswer(null)}
                  error={aiError}
                />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={handleUpdateSettings}
      />

      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        profile={profile}
        onSave={handleUpdateProfile}
      />
    </div>
  );
};
