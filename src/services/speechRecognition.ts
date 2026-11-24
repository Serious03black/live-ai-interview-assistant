import { TranscriptSegment } from '../types';

type TranscriptCallback = (segment: TranscriptSegment) => void;
type ErrorCallback = (error: string) => void;

interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export class SpeechRecognitionService {
  private recognition: any = null;
  private isRunning: boolean = false;
  private onTranscriptCallback: TranscriptCallback | null = null;
  private onErrorCallback: ErrorCallback | null = null;
  private language: string = 'en-US';

  constructor() {
    const win = window as unknown as IWindow;
    const SpeechClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechClass) {
      this.recognition = new SpeechClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = this.language;

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const text = item[0]?.transcript || '';
          if (item.isFinal) {
            finalTranscript += text + ' ';
          } else {
            interimTranscript += text;
          }
        }

        if (finalTranscript && this.onTranscriptCallback) {
          this.onTranscriptCallback({
            id: 'seg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            text: finalTranscript.trim(),
            isFinal: true,
            timestamp: Date.now(),
          });
        } else if (interimTranscript && this.onTranscriptCallback) {
          this.onTranscriptCallback({
            id: 'interim_current',
            text: interimTranscript.trim(),
            isFinal: false,
            timestamp: Date.now(),
          });
        }
      };

      this.recognition.onerror = (event: any) => {
        // "no-speech" and "aborted" are normal lifecycle events during pauses, focus shifts, or restarts
        if (event.error !== 'no-speech' && event.error !== 'aborted' && this.onErrorCallback) {
          this.onErrorCallback(event.error);
        }
      };

      this.recognition.onend = () => {
        // Automatically restart if user hasn't explicitly stopped listening
        if (this.isRunning) {
          try {
            this.recognition.start();
          } catch {
            // ignore if already started
          }
        }
      };
    }
  }

  isSupported(): boolean {
    return !!this.recognition;
  }

  setLanguage(lang: string): void {
    this.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  start(onTranscript: TranscriptCallback, onError?: ErrorCallback): void {
    if (!this.recognition) {
      onError?.('Speech recognition is not supported in this browser/environment.');
      return;
    }

    this.onTranscriptCallback = onTranscript;
    this.onErrorCallback = onError || null;
    this.isRunning = true;

    try {
      this.recognition.start();
    } catch {
      // already running
    }
  }

  stop(): void {
    this.isRunning = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
  }
}

export const speechRecognitionService = new SpeechRecognitionService();
