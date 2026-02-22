import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';

export class CreateModelDto {
  @ApiProperty({ description: '显示名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '服务商', enum: ['openai', 'anthropic', 'zhipu', 'moonshot', 'qianwen', 'custom'] })
  @IsString()
  provider: string;

  @ApiProperty({ description: 'API Key（明文，后端加密存储）' })
  @IsString()
  apiKey: string;

  @ApiPropertyOptional({ description: '自定义 Base URL' })
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiProperty({ description: '实际调用的 model 名称' })
  @IsString()
  modelId: string;

  @ApiPropertyOptional({ description: '温度', default: 0.7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({ description: 'Top P', default: 1.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  topP?: number;

  @ApiPropertyOptional({ description: '最大 Token 数', default: 2048 })
  @IsOptional()
  @IsNumber()
  maxTokens?: number;

  @ApiPropertyOptional({ description: '系统提示词' })
  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @ApiPropertyOptional({ description: '超时时间(ms)', default: 30000 })
  @IsOptional()
  @IsNumber()
  timeout?: number;

  @ApiPropertyOptional({ description: '重试次数', default: 2 })
  @IsOptional()
  @IsNumber()
  retryCount?: number;

  @ApiPropertyOptional({ description: '是否可作为裁判模型', default: false })
  @IsOptional()
  @IsBoolean()
  isJudge?: boolean;

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
