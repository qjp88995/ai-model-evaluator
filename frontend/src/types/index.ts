export interface LlmModel {
  id: string;
  name: string;
  provider: string;
  apiKey: string;
  baseUrl?: string;
  modelId: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  systemPrompt?: string;
  timeout: number;
  retryCount: number;
  isJudge: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TestCase {
  id: string;
  testSetId: string;
  prompt: string;
  referenceAnswer?: string;
  scoringCriteria?: string;
  order: number;
}

export interface TestSet {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  testCases?: TestCase[];
  _count?: { testCases: number };
}

export interface EvalSession {
  id: string;
  name?: string;
  type: 'compare' | 'batch';
  modelIds: string[];
  prompt?: string;
  testSetId?: string;
  judgeModelId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  results?: EvalResult[];
  _count?: { results: number };
}

export interface EvalResult {
  id: string;
  sessionId: string;
  modelId: string;
  testCaseId?: string;
  prompt: string;
  response?: string;
  tokensInput?: number;
  tokensOutput?: number;
  responseTimeMs?: number;
  score?: number;
  scoreComment?: string;
  status: 'pending' | 'success' | 'failed';
  error?: string;
  createdAt: string;
}

export interface StatsOverview {
  totalTokensInput: number;
  totalTokensOutput: number;
  totalRequests: number;
  activeModels: number;
  totalSessions: number;
}
