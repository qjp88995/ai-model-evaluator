import Anthropic from "@anthropic-ai/sdk";
import {
  ChatOptions,
  ChatResult,
  LlmAdapter,
  Message,
  StreamChunk,
} from "./llm.types";

export class AnthropicAdapter implements LlmAdapter {
  private client: Anthropic;
  private modelId: string;

  constructor(apiKey: string, modelId: string) {
    this.client = new Anthropic({ apiKey });
    this.modelId = modelId;
  }

  private splitMessages(messages: Message[]): {
    system?: string;
    messages: Anthropic.MessageParam[];
  } {
    const systemMessages = messages.filter((m) => m.role === "system");
    const nonSystemMessages = messages.filter((m) => m.role !== "system");
    return {
      system: systemMessages.map((m) => m.content).join("\n"),
      messages: nonSystemMessages as Anthropic.MessageParam[],
    };
  }

  async chat(messages: Message[], options: ChatOptions): Promise<ChatResult> {
    const start = Date.now();
    const { system, messages: msgs } = this.splitMessages(messages);

    const response = await this.client.messages.create({
      model: this.modelId,
      max_tokens: options.maxTokens ?? 2048,
      temperature: options.temperature ?? 0.7,
      system,
      messages: msgs,
    });

    const content = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as any).text)
      .join("");

    return {
      content,
      tokensInput: response.usage.input_tokens,
      tokensOutput: response.usage.output_tokens,
      responseTimeMs: Date.now() - start,
    };
  }

  async *stream(
    messages: Message[],
    options: ChatOptions,
  ): AsyncGenerator<StreamChunk> {
    const start = Date.now();
    const { system, messages: msgs } = this.splitMessages(messages);
    const maxTokens = options.maxTokens ?? 2048;

    // 先尝试开启 extended thinking，失败则回退到普通模式
    const streamIter =
      (await this.tryCreateThinkingStream(msgs, system, maxTokens)) ??
      (await this.createNormalStream(msgs, system, maxTokens, options));

    try {
      let tokensInput = 0;
      let tokensOutput = 0;

      for await (const event of streamIter) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "thinking_delta"
        ) {
          yield { thinking: (event.delta as any).thinking, done: false };
        } else if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          yield { content: event.delta.text, done: false };
        } else if (event.type === "message_delta" && event.usage) {
          tokensOutput = event.usage.output_tokens;
        } else if (event.type === "message_start" && event.message.usage) {
          tokensInput = event.message.usage.input_tokens;
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

  private async tryCreateThinkingStream(
    msgs: Anthropic.MessageParam[],
    system: string | undefined,
    maxTokens: number,
  ) {
    // extended thinking 要求 budget_tokens < max_tokens，且 temperature 固定为 1
    const budgetTokens = Math.max(1024, Math.floor(maxTokens * 0.6));
    const effectiveMaxTokens = Math.max(maxTokens, budgetTokens + 1024);

    try {
      return await this.client.messages.create({
        model: this.modelId,
        max_tokens: effectiveMaxTokens,
        system,
        messages: msgs,
        thinking: { type: "enabled", budget_tokens: budgetTokens },
        stream: true,
      });
    } catch {
      // 模型不支持 extended thinking，返回 null 以回退
      return null;
    }
  }

  private async createNormalStream(
    msgs: Anthropic.MessageParam[],
    system: string | undefined,
    maxTokens: number,
    options: ChatOptions,
  ) {
    return this.client.messages.create({
      model: this.modelId,
      max_tokens: maxTokens,
      temperature: options.temperature ?? 0.7,
      system,
      messages: msgs,
      stream: true,
    });
  }
}
