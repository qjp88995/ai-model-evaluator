import OpenAI from "openai";
import {
  ChatOptions,
  ChatResult,
  LlmAdapter,
  Message,
  StreamChunk,
} from "./llm.types";

export class OpenAIAdapter implements LlmAdapter {
  private client: OpenAI;
  private modelId: string;

  constructor(apiKey: string, modelId: string, baseUrl?: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: baseUrl,
      timeout: 60000,
    });
    this.modelId = modelId;
  }

  async chat(messages: Message[], options: ChatOptions): Promise<ChatResult> {
    const start = Date.now();
    const response = await this.client.chat.completions.create({
      model: this.modelId,
      messages: messages as any,
      ...(options.temperature != null && {
        temperature: options.temperature,
      }),
      ...(options.topP != null && { top_p: options.topP }),
      max_tokens: options.maxTokens ?? 2048,
    });

    const choice = response.choices[0];
    return {
      content: choice.message.content ?? "",
      tokensInput: response.usage?.prompt_tokens ?? 0,
      tokensOutput: response.usage?.completion_tokens ?? 0,
      responseTimeMs: Date.now() - start,
    };
  }

  async *stream(
    messages: Message[],
    options: ChatOptions,
  ): AsyncGenerator<StreamChunk> {
    const start = Date.now();
    let tokensInput = 0;
    let tokensOutput = 0;

    try {
      const stream = await this.client.chat.completions.create({
        model: this.modelId,
        messages: messages as any,
        ...(options.temperature != null && {
          temperature: options.temperature,
        }),
        ...(options.topP != null && { top_p: options.topP }),
        max_tokens: options.maxTokens ?? 2048,
        stream: true,
        stream_options: { include_usage: true },
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (chunk.usage) {
          tokensInput = chunk.usage.prompt_tokens;
          tokensOutput = chunk.usage.completion_tokens;
        }
        if (delta) {
          yield { content: delta, done: false };
        }
      }

      yield {
        done: true,
        tokensInput,
        tokensOutput,
        responseTimeMs: Date.now() - start,
      };
    } catch (err: any) {
      yield { done: true, error: err.message ?? "Unknown error" };
    }
  }
}
