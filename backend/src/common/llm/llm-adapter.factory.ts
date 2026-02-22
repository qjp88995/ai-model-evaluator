import { Injectable } from '@nestjs/common';
import { CryptoService } from '../crypto/crypto.service';
import { LlmAdapter } from './llm.types';
import { OpenAIAdapter } from './openai.adapter';
import { AnthropicAdapter } from './anthropic.adapter';

interface ModelConfig {
  provider: string;
  apiKey: string; // encrypted
  modelId: string;
  baseUrl?: string;
}

@Injectable()
export class LlmAdapterFactory {
  constructor(private readonly crypto: CryptoService) {}

  create(model: ModelConfig): LlmAdapter {
    const apiKey = this.crypto.decrypt(model.apiKey);

    switch (model.provider) {
      case 'anthropic':
        return new AnthropicAdapter(apiKey, model.modelId);
      case 'openai':
      case 'zhipu':
      case 'moonshot':
      case 'qianwen':
      case 'custom':
      default:
        return new OpenAIAdapter(apiKey, model.modelId, model.baseUrl);
    }
  }
}
