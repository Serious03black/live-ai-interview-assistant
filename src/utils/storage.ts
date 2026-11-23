import { AppSettings, CandidateProfile, SessionHistoryItem } from '../types';

const SETTINGS_KEY = 'live_ai_interview_settings';
const PROFILE_KEY = 'live_ai_interview_profile';
const HISTORY_KEY = 'live_ai_interview_history';

export const DEFAULT_SETTINGS: AppSettings = {
  aiProvider: 'deepseek',
  deepseekApiKey: '',
  deepseekModel: 'deepseek-chat',
  deepseekBaseUrl: 'https://api.deepseek.com',
  geminiApiKey: '',
  geminiModel: 'gemini-1.5-flash',
  openaiApiKey: '',
  openaiModel: 'gpt-4o-mini',
  customApiUrl: 'http://localhost:11434/v1',
  customApiKey: '',
  customModel: 'llama3',
  audioInputDeviceId: 'default',
  speechLanguage: 'en-US',
  responseStyle: 'concise',
  responseLength: 'medium',
  autoGenerateAnswer: true,
  alwaysOnTop: false,
  fontSize: 'medium',
  transcriptionEngine: 'web_speech',
  hotkeys: {
    toggleListening: 'Space',
    clearTranscript: 'KeyK',
    regenerateAnswer: 'KeyR',
    copyAnswer: 'KeyC',
  },
};

export const DEFAULT_PROFILE: CandidateProfile = {
  name: '',
  targetRole: 'Full Stack Engineer',
  yearsOfExperience: '3+',
  education: 'B.S. in Computer Science',
  skills: ['TypeScript', 'React', 'Node.js', 'Python', 'System Design', 'PostgreSQL', 'Docker'],
  projectsSummary: 'Architected scalable web applications, real-time streaming pipelines, and microservices.',
  resumeText: '',
  preferredLanguage: 'English',
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const envKey = (typeof process !== 'undefined' && process.env?.DEEPSEEK_API_KEY) || '';
    if (!raw) {
      return {
        ...DEFAULT_SETTINGS,
        deepseekApiKey: envKey || DEFAULT_SETTINGS.deepseekApiKey,
      };
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      deepseekApiKey: parsed.deepseekApiKey || envKey || '',
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function loadProfile(): CandidateProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: CandidateProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

export function loadHistory(): SessionHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveHistory(history: SessionHistoryItem[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-50)));
  } catch {
    // ignore
  }
}
