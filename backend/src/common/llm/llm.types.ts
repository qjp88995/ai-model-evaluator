export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface ChatResult {
  content: string;
  tokensInput: number;
  tokensOutput: number;
  responseTimeMs: number;
}

export interface StreamChunk {
  content?: string;
  done: boolean;
  tokensInput?: number;
  tokensOutput?: number;
  responseTimeMs?: number;
  error?: string;
}

export interface LlmAdapter {
  chat(messages: Message[], options: ChatOptions): Promise<ChatResult>;
  stream(messages: Message[], options: ChatOptions): AsyncGenerator<StreamChunk>;
}
