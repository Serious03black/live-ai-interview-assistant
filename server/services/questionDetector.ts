import { QuestionCategory } from '../../src/types';

interface QuestionDetectionResult {
  isQuestion: boolean;
  questionText: string;
  category: QuestionCategory;
  confidence: number;
}

const FILLER_PREFIX = /^(?:so|okay|ok|well|now|alright|all right|and|um|uh|right|hey|hello|hi|next|then|like|actually|basically|quick question|my question is|i want to ask|i would like to know|can you tell me|could you tell me)\s*[,:-]?\s*/i;

const QUESTION_STARTERS = [
  /^(what|how|why|when|where|which|who|whose|whom)\b/i,
  /^(can|could|would|should|will|do|does|did|is|are|was|were|have|has|had)\s+(you|we|one|i)\b/i,
  /^(tell me about|walk me through|explain|describe|give me an example|elaborate on|talk about|discuss)\b/i,
  /^(write a|implement a|create a|design a|build a|reverse a|find the)\b/i,
  /^(difference between|compare|pros and cons of|advantages of)\b/i,
  /^(what is the difference|how does|what are the)\b/i,
  /\b(what is|what are|how does|how do|why do|why does|how would|what would)\b/i,
  /\b(difference between|tell me about|explain how|can you explain)\b/i,
];

const CODING_KEYWORDS = [
  /\b(write a function|algorithm|time complexity|space complexity|reverse|linked list|binary tree|array|string|sort|leetcode|recursion|dynamic programming|sql query|regex|data structure|binary search)\b/i,
];

const PROJECT_KEYWORDS = [
  /\b(your last project|current project|architecture|tech stack|system design|microservices|challenges you faced|production issue|scale|database design|infrastructure|scalability|trade-offs)\b/i,
];

const HR_KEYWORDS = [
  /\b(tell me about yourself|strengths and weaknesses|where do you see yourself|why should we hire you|conflict|disagreement|teamwork|salary expectation|notice period|leadership|biggest achievement|difficult situation)\b/i,
];

function cleanInterviewerText(text: string): string {
  let cleaned = text.trim();
  for (let i = 0; i < 3; i++) {
    const next = cleaned.replace(FILLER_PREFIX, '');
    if (next === cleaned) break;
    cleaned = next.trim();
  }
  return cleaned;
}

export function detectQuestion(rawText: string): QuestionDetectionResult {
  const text = rawText.trim();
  const cleaned = cleanInterviewerText(text);

  if (cleaned.length < 6) {
    return { isQuestion: false, questionText: '', category: 'GENERAL', confidence: 0 };
  }

  let isQuestion = false;
  let confidence = 0.5;

  if (text.endsWith('?') || text.includes('?') || cleaned.endsWith('?')) {
    isQuestion = true;
    confidence += 0.35;
  }

  for (const pattern of QUESTION_STARTERS) {
    if (pattern.test(cleaned) || pattern.test(text)) {
      isQuestion = true;
      confidence += 0.35;
      break;
    }
  }

  if (!isQuestion) {
    return { isQuestion: false, questionText: '', category: 'GENERAL', confidence: 0 };
  }

  let category: QuestionCategory = 'TECHNICAL';
  if (CODING_KEYWORDS.some((re) => re.test(text) || re.test(cleaned))) {
    category = 'CODING';
  } else if (PROJECT_KEYWORDS.some((re) => re.test(text) || re.test(cleaned))) {
    category = 'PROJECT';
  } else if (HR_KEYWORDS.some((re) => re.test(text) || re.test(cleaned))) {
    category = 'HR';
  }

  return {
    isQuestion: true,
    questionText: text,
    category,
    confidence: Math.min(confidence, 0.98),
  };
}
