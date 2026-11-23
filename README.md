# Live AI Interview Assistant 🎙️⚡

A modern, real-time desktop AI Interview Assistant application built with **Electron**, **React**, **TypeScript**, **Tailwind CSS**, and **DeepSeek API** (`deepseek-chat` / `deepseek-reasoner`).

The application listens to live conversation audio, transcribes speech in real time, automatically detects interviewer questions, personalizes context with your profile and resume, and displays streaming AI answer suggestions on a sleek desktop HUD with sub-second latency.

---

## 🌟 Key Highlights

- **⚡ DeepSeek V3 / R1 Powered**: Optimized for fast streaming reasoning and natural, conversational answers.
- **🎙️ Real-time Audio Capture**: Web Audio API analyzer with live waveform & frequency bars.
- **🗣️ Continuous Transcription**: Zero-latency speech-to-text with sentence boundary detection.
- **🧠 Smart Question Detection**: Real-time heuristic classifier distinguishing HR, Technical, Coding, and Project questions.
- **📄 Resume & Profile Grounding**: Ingests your PDF resume and skills so answers are grounded in your real achievements without hallucinations.
- **📌 Desktop HUD with Always-on-Top**: Pin the assistant window over your video call or code editor.
- **⌨️ Instant Hotkeys**:
  - `Ctrl + Space`: Start / Stop live listening
  - `Ctrl + K`: Clear transcript history
  - `Ctrl + R`: Regenerate AI answer
  - `Ctrl + C`: Instant copy answer to clipboard

---

## 🛠️ Architecture & Project Structure

```
live-ai-interview-assistant/
├── electron/
│   ├── main.ts            # Electron main process (window management, always-on-top, IPC)
│   └── preload.ts         # Secure IPC bridge
├── server/
│   ├── index.ts           # Express + WebSocket real-time server
│   ├── routes/
│   │   ├── ai.ts          # SSE streaming proxy for DeepSeek & Gemini
│   │   └── resume.ts      # PDF resume parsing endpoint
│   └── services/
│       ├── deepseek.ts    # DeepSeek OpenAI-compatible streaming client
│       ├── gemini.ts      # Gemini streaming client
│       └── questionDetector.ts # Question classification heuristics
├── src/
│   ├── components/
│   │   ├── Navbar.tsx         # Logo, AI model selector, always-on-top pin, window controls
│   │   ├── AudioVisualizer.tsx# Live waveform canvas & microphone selector
│   │   ├── LiveTranscript.tsx # Continuous real-time speech stream
│   │   ├── DetectedQuestion.tsx# Detected question card & category badge
│   │   ├── AnswerPanel.tsx    # Streaming AI response viewer with copy & latency metrics
│   │   ├── Sidebar.tsx        # Session questions history
│   │   ├── SettingsModal.tsx  # DeepSeek API key, models, and response styles
│   │   └── ProfileModal.tsx   # Candidate profile and PDF resume uploader
│   ├── services/
│   │   ├── audioCapture.ts    # Web Audio API microphone stream
│   │   ├── speechRecognition.ts # Continuous Web Speech STT
│   │   ├── questionDetector.ts# Client-side instant question classifier
│   │   └── aiService.ts       # SSE streaming client with direct fallback
│   ├── types/
│   │   └── index.ts           # Strict TypeScript contracts
│   ├── utils/
│   │   └── storage.ts         # LocalStorage persistence
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
Open a terminal in the project directory:
```bash
cd "C:\Users\prath\Desktop\live-ai-interview-assistant"
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your DeepSeek API key (or configure it directly inside the app settings modal ⚙️):
```env
DEEPSEEK_API_KEY=sk-your_deepseek_api_key_here
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

### 3. Run in Development Mode

#### Option A: Full Electron Desktop App
```bash
npm run dev
```

#### Option B: Browser Web Mode
```bash
npm run dev:web
```
Visit `http://localhost:5173` in Google Chrome or Microsoft Edge.

---

## 🔒 Security & Privacy

- Audio streams are analyzed strictly in memory.
- API keys and candidate profiles are stored exclusively on your local machine (`localStorage` / local `.env`).
- No conversation transcripts or audio recordings are saved to external third-party databases.
