import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CryptoModule } from './common/crypto/crypto.module';
import { LlmModule } from './common/llm/llm.module';
import { ModelsModule } from './models/models.module';
import { TestsetsModule } from './testsets/testsets.module';
import { EvalModule } from './eval/eval.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CryptoModule,
    LlmModule,
    ModelsModule,
    TestsetsModule,
    EvalModule,
    StatsModule,
  ],
})
export class AppModule {}
