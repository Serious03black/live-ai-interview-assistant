import { Router, Request, Response } from 'express';
import { streamDeepSeekResponse } from '../services/deepseek';
import { streamGeminiResponse } from '../services/gemini';
import { CandidateProfile, AppSettings, QuestionCategory, AIProvider } from '../../src/types';

export const aiRouter = Router();

aiRouter.post('/stream-answer', async (req: Request, res: Response) => {
  const { question, category = 'TECHNICAL', profile, settings, apiKey } = req.body as {
    question: string;
    category: QuestionCategory;
    profile?: CandidateProfile;
    settings?: Partial<AppSettings>;
    apiKey?: string;
  };

  if (!question) {
    res.status(400).json({ error: 'Question is required' });
    return;
  }

  const provider: AIProvider = settings?.aiProvider || 'deepseek';

  // Setup Server-Sent Events headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    let streamGenerator: AsyncGenerator<string, void, unknown>;

    if (provider === 'gemini') {
      streamGenerator = streamGeminiResponse(question, category, profile, settings, apiKey);
    } else {
      // Default & primary: DeepSeek API (also compatible with OpenAI)
      streamGenerator = streamDeepSeekResponse(question, category, profile, settings, apiKey);
    }

    for await (const chunk of streamGenerator) {
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown streaming error';
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.end();
  }
});
