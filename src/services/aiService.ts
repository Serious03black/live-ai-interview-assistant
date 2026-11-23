import { QuestionCategory, CandidateProfile, AppSettings } from '../types';

interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: () => void;
  onError: (error: string) => void;
}

export class AIService {
  private activeAbortController: AbortController | null = null;

  abort(): void {
    if (this.activeAbortController) {
      this.activeAbortController.abort();
      this.activeAbortController = null;
    }
  }

  async streamAnswer(
    question: string,
    category: QuestionCategory,
    profile: CandidateProfile,
    settings: AppSettings,
    callbacks: StreamCallbacks
  ): Promise<void> {
    this.abort();
    this.activeAbortController = new AbortController();

    const startTime = performance.now();

    // 1. Try streaming via local backend server (Express SSE)
    try {
      const response = await fetch('http://localhost:3001/api/ai/stream-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: this.activeAbortController.signal,
        body: JSON.stringify({
          question,
          category,
          profile,
          settings,
          apiKey: settings.deepseekApiKey || (typeof process !== 'undefined' ? process.env?.DEEPSEEK_API_KEY : undefined),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned error status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No streaming body received');
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
          if (!trimmed) continue;
          if (trimmed === 'data: [DONE]') {
            callbacks.onComplete();
            return;
          }
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.error) {
                callbacks.onError(data.error);
                return;
              }
              if (data.text) {
                callbacks.onChunk(data.text);
              }
            } catch {
              // ignore partial json
            }
          }
        }
      }

      callbacks.onComplete();
      return;
    } catch (serverErr: any) {
      if (serverErr.name === 'AbortError') {
        return;
      }
      console.warn('Backend proxy unavailable, attempting direct DeepSeek client fetch...', serverErr);
    }

    // 2. Direct client-side streaming fallback using DeepSeek API
    try {
      const apiKey = settings.deepseekApiKey || (typeof process !== 'undefined' ? process.env?.DEEPSEEK_API_KEY : '');
      if (!apiKey) {
        callbacks.onError(
          'DeepSeek API Key is required. Please open Settings (⚙️) and enter your DeepSeek API key.'
        );
        return;
      }

      const baseUrl = settings.deepseekBaseUrl || 'https://api.deepseek.com';
      const model = settings.deepseekModel || 'deepseek-chat';

      const systemPrompt = `You are an elite, real-time AI Interview Co-pilot assisting a candidate during a job interview.
=== CANDIDATE PROFILE & RESUME GROUND TRUTH ===
Candidate: ${profile.name || 'Candidate'} (${profile.targetRole || 'Software Engineer'}, ${profile.yearsOfExperience || 'Experienced'})
Education: ${profile.education || 'Computer Science'}
Skills: ${profile.skills.join(', ')}
Key Projects: ${profile.projectsSummary}
${
  profile.resumeText && profile.resumeText.trim().length > 0
    ? `=== CANDIDATE FULL RESUME TEXT (ABSOLUTE GROUND TRUTH) ===\n${profile.resumeText.slice(0, 15000)}\n=== END RESUME TEXT ===`
    : ''
}

Category: ${category}
CRITICAL RESUME & PROFILE GROUNDING DIRECTIVES (MANDATORY):
1. NEVER GIVE RANDOM OR FICTITIOUS ANSWERS. You represent THIS specific candidate.
2. Ground all answers strictly in the candidate's actual projects, technologies, years of experience, and resume content provided above.
3. If asked "Tell me about yourself" or questions about past experience, pull directly from the candidate's actual projects, education, and work history.
4. If asked about a technology, connect the answer to how this candidate practically implemented it in their projects.
5. Speak in FIRST PERSON ("I designed...", "In my recent project, I...").
6. Be direct and avoid conversational filler like "Sure, I'd be happy to answer that."
7. If technical, state the core concept, practical implementation from experience, and key trade-offs.
8. If coding, provide approach, clean code, and time/space complexity.`;

      const directRes = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        signal: this.activeAbortController.signal,
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question },
          ],
          stream: true,
          temperature: 0.6,
          max_tokens: settings.responseLength === 'short' ? 400 : settings.responseLength === 'comprehensive' ? 1200 : 700,
        }),
      });

      if (!directRes.ok) {
        const errorText = await directRes.text();
        throw new Error(`DeepSeek API Error (${directRes.status}): ${errorText}`);
      }

      if (!directRes.body) {
        throw new Error('No stream returned from DeepSeek API.');
      }

      const reader = directRes.body.getReader();
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
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                callbacks.onChunk(delta);
              }
            } catch {
              // ignore
            }
          }
        }
      }

      callbacks.onComplete();
    } catch (directErr: any) {
      if (directErr.name === 'AbortError') return;
      callbacks.onError(directErr.message || 'Failed to stream answer from AI provider.');
    }
  }
}

export const aiService = new AIService();
