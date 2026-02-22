import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StatsService } from './stats.service';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly service: StatsService) {}

  @Get('overview')
  @ApiOperation({ summary: '用量汇总' })
  getOverview() {
    return this.service.getOverview();
  }

  @Get('models')
  @ApiOperation({ summary: '各模型用量排行' })
  getModelStats() {
    return this.service.getModelStats();
  }

  @Get('trend')
  @ApiOperation({ summary: '时间序列数据' })
  getTrend(@Query('days') days?: string) {
    return this.service.getTrend(days ? parseInt(days, 10) : 7);
  }
}
