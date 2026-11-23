export type QuestionCategory = 'HR' | 'TECHNICAL' | 'CODING' | 'PROJECT' | 'GENERAL';

export type AIProvider = 'deepseek' | 'gemini' | 'openai' | 'custom';

export interface CandidateProfile {
  name: string;
  targetRole: string;
  yearsOfExperience: string;
  education: string;
  skills: string[];
  projectsSummary: string;
  resumeText: string;
  preferredLanguage: string;
}

export interface DetectedQuestion {
  id: string;
  text: string;
  category: QuestionCategory;
  confidence: number;
  timestamp: number;
  source: 'auto_speech' | 'manual';
}

export interface AIAnswer {
  id: string;
  questionId: string;
  content: string;
  isStreaming: boolean;
  latencyMs: number;
  provider: AIProvider;
  model: string;
  category: QuestionCategory;
  timestamp: number;
}

export interface SessionHistoryItem {
  id: string;
  question: DetectedQuestion;
  answer?: AIAnswer;
  timestamp: number;
}

export interface AppSettings {
  aiProvider: AIProvider;
  deepseekApiKey: string;
  deepseekModel: string;
  deepseekBaseUrl: string;
  geminiApiKey: string;
  geminiModel: string;
  openaiApiKey: string;
  openaiModel: string;
  customApiUrl: string;
  customApiKey: string;
  customModel: string;
  audioInputDeviceId: string;
  speechLanguage: string;
  responseStyle: 'concise' | 'detailed' | 'bullet_points';
  responseLength: 'short' | 'medium' | 'comprehensive';
  autoGenerateAnswer: boolean;
  alwaysOnTop: boolean;
  fontSize: 'small' | 'medium' | 'large';
  transcriptionEngine: 'web_speech' | 'whisper_server';
  hotkeys: {
    toggleListening: string;
    clearTranscript: string;
    regenerateAnswer: string;
    copyAnswer: string;
  };
}

export interface AudioVisualizerState {
  isListening: boolean;
  audioLevel: number; // 0 to 100
  stream: MediaStream | null;
  error?: string;
}

export interface TranscriptSegment {
  id: string;
  text: string;
  isFinal: boolean;
  timestamp: number;
}
