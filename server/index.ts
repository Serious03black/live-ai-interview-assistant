import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import { aiRouter } from './routes/ai';
import { resumeRouter } from './routes/resume';
import { detectQuestion } from './services/questionDetector';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api/ai', aiRouter);
app.use('/api/resume', resumeRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), service: 'Live AI Interview Assistant Server' });
});

// WebSocket for real-time speech and question events
wss.on('connection', (ws: WebSocket) => {
  ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Connected to Live AI Interview Assistant WebSocket' }));

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message.toString());

      // Client sends live speech segment
      if (data.type === 'SPEECH_TRANSCRIPT') {
        const text = data.text || '';
        const detection = detectQuestion(text);

        if (detection.isQuestion) {
          ws.send(JSON.stringify({
            type: 'QUESTION_DETECTED',
            question: detection.questionText,
            category: detection.category,
            confidence: detection.confidence,
            timestamp: Date.now(),
          }));
        }
      }
    } catch {
      // ignore malformed ws messages
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Live AI Interview Assistant server listening on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server active on ws://localhost:${PORT}`);
});
