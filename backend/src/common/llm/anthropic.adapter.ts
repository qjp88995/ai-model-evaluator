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

    try {
      const stream = await this.client.messages.create({
        model: this.modelId,
        max_tokens: options.maxTokens ?? 2048,
        temperature: options.temperature ?? 0.7,
        system,
        messages: msgs,
        stream: true,
      });

      let tokensInput = 0;
      let tokensOutput = 0;

      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          yield { content: event.delta.text, done: false };
          await new Promise<void>((r) => setImmediate(r));
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
}
