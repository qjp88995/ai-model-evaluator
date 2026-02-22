import { Global, Module } from '@nestjs/common';
import { LlmAdapterFactory } from './llm-adapter.factory';

@Global()
@Module({
  providers: [LlmAdapterFactory],
  exports: [LlmAdapterFactory],
})
export class LlmModule {}
