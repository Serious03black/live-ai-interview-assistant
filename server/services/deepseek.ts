import { CandidateProfile, AppSettings, QuestionCategory } from '../../src/types';

export function buildSystemPrompt(
  category: QuestionCategory,
  profile?: CandidateProfile,
  settings?: Partial<AppSettings>
): string {
  const profileSection = profile
    ? `
=== CANDIDATE PROFILE & RESUME GROUND TRUTH ===
- Name: ${profile.name || 'Candidate'}
- Target Role: ${profile.targetRole || 'Software Engineer'}
- Years of Experience: ${profile.yearsOfExperience || 'Experienced'}
- Education: ${profile.education || 'Computer Science / Engineering'}
- Skills & Technologies: ${profile.skills?.join(', ') || 'Not specified'}
- Key Projects & Accomplishments: ${profile.projectsSummary || 'Not specified'}

${
  profile.resumeText && profile.resumeText.trim().length > 0
    ? `=== CANDIDATE FULL RESUME TEXT (ABSOLUTE GROUND TRUTH) ===\n${profile.resumeText.slice(0, 15000)}\n=== END RESUME TEXT ===`
    : '=== RESUME TEXT: Not provided yet (rely strictly on Candidate Profile details above) ==='
}
`
    : '';

  const formatInstruction = getCategoryFormatInstructions(category);
  const styleInstruction = settings?.responseStyle === 'bullet_points'
    ? 'Use clean bullet points for quick visual scanning.'
    : settings?.responseStyle === 'detailed'
    ? 'Provide thorough, well-explained responses with depth.'
    : 'Be concise, punchy, and direct to the point.';

  return `You are an elite, real-time AI Interview Co-pilot assisting a candidate during an active job interview.
Your answers will be spoken or read by the candidate in real-time, so they MUST be natural, clear, accurate, and easy to speak aloud.

${profileSection}

QUESTION CATEGORY DETECTED: [${category}]
${formatInstruction}

CRITICAL RESUME & PROFILE GROUNDING DIRECTIVES (MANDATORY):
1. NEVER GIVE RANDOM OR FICTITIOUS ANSWERS. You represent THIS specific candidate.
2. Ground all answers strictly in the candidate's actual projects, technologies, years of experience, and resume content provided above.
3. If asked "Tell me about yourself", "Walk me through your background", or behavioral questions, summarize this candidate's actual career path, education, and projects from their resume.
4. If asked about a technology (e.g., React, Python, Docker, PostgreSQL), connect the answer to how this candidate practically implemented it in their listed projects.
5. Speak authentically in FIRST PERSON ("I have worked on...", "In my recent project, I built...").
6. Speed and clarity are paramount: get straight to the answer without conversational filler like "Sure, I'd be happy to answer that."
7. ${styleInstruction}
8. When writing code, provide clean, idiomatic code with brief 1-2 sentence explanation and Time/Space complexity.
`;
}

function getCategoryFormatInstructions(category: QuestionCategory): string {
  switch (category) {
    case 'HR':
      return `HR & BEHAVIORAL FORMAT:
- First-person, authentic conversational tone.
- STAR method (Situation, Task, Action, Result) if asked about past experiences.
- Keep it confident, humble, and solution-oriented.`;

    case 'TECHNICAL':
      return `TECHNICAL QUESTION FORMAT:
1. Direct 1-2 sentence definition/core concept.
2. How it works practically under the hood.
3. Real-world example or use-case.
4. Key best practices or trade-offs.`;

    case 'CODING':
      return `CODING & ALGORITHMS FORMAT:
1. High-level Approach (1-2 sentences).
2. Clean, syntactically correct code block.
3. Explanation of key lines.
4. Time & Space Complexity (e.g., O(N) time, O(1) space).`;

    case 'PROJECT':
      return `PROJECT ARCHITECTURE FORMAT:
1. Project Overview & Business Value.
2. Tech Stack used.
3. My Specific Contribution & Architectural Role.
4. Core Challenge faced and how I solved it.`;

    default:
      return `GENERAL INTERVIEW FORMAT:
- Direct, clear answer followed by supporting details and examples.`;
  }
}

export async function* streamDeepSeekResponse(
  question: string,
  category: QuestionCategory,
  profile?: CandidateProfile,
  settings?: Partial<AppSettings>,
  apiKeyOverride?: string
): AsyncGenerator<string, void, unknown> {
  const apiKey = apiKeyOverride || settings?.deepseekApiKey || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DeepSeek API Key is missing. Please enter your API key in Settings.');
  }

  const baseUrl = settings?.deepseekBaseUrl || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  const model = settings?.deepseekModel || process.env.DEEPSEEK_MODEL || 'deepseek-chat';
  const systemPrompt = buildSystemPrompt(category, profile, settings);

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      stream: true,
      temperature: 0.6,
      max_tokens: settings?.responseLength === 'short' ? 400 : settings?.responseLength === 'comprehensive' ? 1200 : 700,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API Error (${response.status}): ${errorText}`);
  }

  if (!response.body) {
    throw new Error('No response stream returned from DeepSeek.');
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
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            yield delta;
          }
        } catch {
          // ignore partial JSON chunk
        }
      }
    }
  }
}
