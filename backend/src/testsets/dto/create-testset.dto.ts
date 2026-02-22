import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTestCaseDto {
  @ApiProperty()
  @IsString()
  prompt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceAnswer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scoringCriteria?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;
}

export class CreateTestSetDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [CreateTestCaseDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTestCaseDto)
  testCases?: CreateTestCaseDto[];
}
