import { Controller, Get, Post, Param, Body, Res, Query } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Response } from "express";
import { EvalService } from "./eval.service";
import { CreateCompareDto, CreateBatchDto } from "./dto/create-eval.dto";

@ApiTags("eval")
@Controller("eval")
export class EvalController {
  constructor(private readonly service: EvalService) {}

  @Post("compare")
  @ApiOperation({ summary: "创建对比会话" })
  createCompare(@Body() dto: CreateCompareDto) {
    return this.service.createCompareSession(dto);
  }

  @Get("compare/:id/stream/:modelId")
  @ApiOperation({ summary: "SSE 流式输出（单模型独立连接）" })
  streamOneModel(
    @Param("id") id: string,
    @Param("modelId") modelId: string,
    @Res() res: Response,
  ) {
    return this.service.streamOneModel(id, modelId, res);
  }

  @Post("batch")
  @ApiOperation({ summary: "启动批量评测" })
  createBatch(@Body() dto: CreateBatchDto) {
    return this.service.createBatchSession(dto);
  }

  @Get("sessions")
  @ApiOperation({ summary: "历史会话列表" })
  findSessions(@Query("type") type?: string) {
    return this.service.findSessions(type);
  }

  @Get("sessions/:id")
  @ApiOperation({ summary: "会话详情 + 结果" })
  findSession(@Param("id") id: string) {
    return this.service.findSession(id);
  }

  @Get("sessions/:id/export")
  @ApiOperation({ summary: "导出会话数据" })
  exportSession(@Param("id") id: string) {
    return this.service.exportSession(id);
  }
}
