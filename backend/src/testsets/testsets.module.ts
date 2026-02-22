import { Module } from '@nestjs/common';
import { TestsetsController } from './testsets.controller';
import { TestsetsService } from './testsets.service';

@Module({
  controllers: [TestsetsController],
  providers: [TestsetsService],
  exports: [TestsetsService],
})
export class TestsetsModule {}
