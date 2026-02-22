import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreateCompareDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '参与对比的模型 ID 列表' })
  @IsArray()
  modelIds: string[];

  @ApiProperty({ description: '对比 Prompt' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({ description: '系统提示词（覆盖模型默认）' })
  @IsOptional()
  @IsString()
  systemPrompt?: string;
}

export class CreateBatchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '参与测评的模型 ID 列表' })
  @IsArray()
  modelIds: string[];

  @ApiProperty({ description: '测评集 ID' })
  @IsString()
  testSetId: string;

  @ApiPropertyOptional({ description: '裁判模型 ID' })
  @IsOptional()
  @IsString()
  judgeModelId?: string;
}
