import { CandidateProfile, AppSettings, QuestionCategory } from '../../src/types';
import { buildSystemPrompt } from './deepseek';

export async function* streamGeminiResponse(
  question: string,
  category: QuestionCategory,
  profile?: CandidateProfile,
  settings?: Partial<AppSettings>,
  apiKeyOverride?: string
): AsyncGenerator<string, void, unknown> {
  const apiKey = apiKeyOverride || settings?.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API Key is missing. Please enter your API key in Settings.');
  }

  const model = settings?.geminiModel || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const systemPrompt = buildSystemPrompt(category, profile, settings);

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nCandidate Question to answer:\n"${question}"` }],
        },
      ],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 800,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
  }

  if (!response.body) {
    throw new Error('No stream returned from Gemini.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (trimmed.startsWith('data: ')) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            yield text;
          }
        } catch {
          // ignore
        }
      }
    }
  }
}
