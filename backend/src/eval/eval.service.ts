import { Injectable, NotFoundException } from "@nestjs/common";
import { Response } from "express";
import { PrismaService } from "../prisma/prisma.service";
import { LlmAdapterFactory } from "../common/llm/llm-adapter.factory";
import { CreateCompareDto, CreateBatchDto } from "./dto/create-eval.dto";
import { Message } from "../common/llm/llm.types";

const JUDGE_PROMPT = (
  prompt: string,
  referenceAnswer: string,
  scoringCriteria: string,
  response: string,
) =>
  `
你是一个客观的评分专家。请根据以下信息对模型回答进行评分。

【问题】${prompt}
【参考答案】${referenceAnswer || "无"}
【评分标准】${scoringCriteria || "综合评估回答质量"}
【待评分回答】${response}

请给出 1-10 分的评分，并简要说明理由。
严格返回 JSON 格式：{"score": 8, "comment": "..."}
`.trim();

@Injectable()
export class EvalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llmFactory: LlmAdapterFactory,
  ) {}

  async createCompareSession(dto: CreateCompareDto) {
    return this.prisma.evalSession.create({
      data: {
        name: dto.name,
        type: "compare",
        modelIds: dto.modelIds,
        prompt: dto.prompt,
        status: "pending",
      },
    });
  }

  async streamCompare(sessionId: string, res: Response) {
    const session = await this.prisma.evalSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const send = (data: object) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      // 强制立即将数据刷到客户端，避免缓冲区积压导致多模型输出串行
      (res as any).flush?.();
    };

    await this.prisma.evalSession.update({
      where: { id: sessionId },
      data: { status: "running" },
    });

    const models = await this.prisma.llmModel.findMany({
      where: { id: { in: session.modelIds } },
    });

    const streamModel = async (model: any) => {
      const resultRecord = await this.prisma.evalResult.create({
        data: {
          sessionId,
          modelId: model.id,
          prompt: session.prompt,
          status: "pending",
        },
      });

      const messages: Message[] = [];
      if (model.systemPrompt) {
        messages.push({ role: "system", content: model.systemPrompt });
      }
      messages.push({ role: "user", content: session.prompt });

      const adapter = this.llmFactory.create(model);
      let fullResponse = "";

      try {
        for await (const chunk of adapter.stream(messages, {
          temperature: model.temperature,
          topP: model.topP,
          maxTokens: model.maxTokens,
          timeout: model.timeout,
        })) {
          if (chunk.done) {
            await this.prisma.evalResult.update({
              where: { id: resultRecord.id },
              data: {
                response: fullResponse,
                tokensInput: chunk.tokensInput,
                tokensOutput: chunk.tokensOutput,
                responseTimeMs: chunk.responseTimeMs,
                status: chunk.error ? "failed" : "success",
                error: chunk.error,
              },
            });
            await this.updateUsageStat(
              model.id,
              chunk.tokensInput ?? 0,
              chunk.tokensOutput ?? 0,
            );
            send({
              modelId: model.id,
              done: true,
              tokensInput: chunk.tokensInput,
              tokensOutput: chunk.tokensOutput,
              responseTimeMs: chunk.responseTimeMs,
              error: chunk.error,
            });
          } else {
            fullResponse += chunk.content ?? "";
            send({ modelId: model.id, chunk: chunk.content, done: false });
          }
        }
      } catch (err: any) {
        send({ modelId: model.id, error: err.message, done: true });
      }
    };

    await Promise.allSettled(models.map((m) => streamModel(m)));

    await this.prisma.evalSession.update({
      where: { id: sessionId },
      data: { status: "completed", completedAt: new Date() },
    });

    res.end();
  }

  async createBatchSession(dto: CreateBatchDto) {
    const session = await this.prisma.evalSession.create({
      data: {
        name: dto.name,
        type: "batch",
        modelIds: dto.modelIds,
        testSetId: dto.testSetId,
        judgeModelId: dto.judgeModelId,
        status: "pending",
      },
    });
    this.runBatch(session.id).catch(console.error);
    return session;
  }

  private async runBatch(sessionId: string) {
    const session = await this.prisma.evalSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) return;

    await this.prisma.evalSession.update({
      where: { id: sessionId },
      data: { status: "running" },
    });

    const testSet = await this.prisma.testSet.findUnique({
      where: { id: session.testSetId },
      include: { testCases: { orderBy: { order: "asc" } } },
    });
    if (!testSet) return;

    const models = await this.prisma.llmModel.findMany({
      where: { id: { in: session.modelIds } },
    });

    const judgeModel = session.judgeModelId
      ? await this.prisma.llmModel.findUnique({
          where: { id: session.judgeModelId },
        })
      : null;

    for (const testCase of testSet.testCases) {
      await Promise.allSettled(
        models.map((model) =>
          this.runBatchCase(sessionId, model, testCase, judgeModel),
        ),
      );
    }

    await this.prisma.evalSession.update({
      where: { id: sessionId },
      data: { status: "completed", completedAt: new Date() },
    });
  }

  private async runBatchCase(
    sessionId: string,
    model: any,
    testCase: any,
    judgeModel: any,
  ) {
    const resultRecord = await this.prisma.evalResult.create({
      data: {
        sessionId,
        modelId: model.id,
        testCaseId: testCase.id,
        prompt: testCase.prompt,
        status: "pending",
      },
    });

    const messages: Message[] = [];
    if (model.systemPrompt) {
      messages.push({ role: "system", content: model.systemPrompt });
    }
    messages.push({ role: "user", content: testCase.prompt });

    const adapter = this.llmFactory.create(model);

    try {
      const result = await adapter.chat(messages, {
        temperature: model.temperature,
        topP: model.topP,
        maxTokens: model.maxTokens,
        timeout: model.timeout,
      });

      let score: number | undefined;
      let scoreComment: string | undefined;

      if (judgeModel) {
        const judgeResult = await this.runJudge(
          judgeModel,
          testCase.prompt,
          testCase.referenceAnswer ?? "",
          testCase.scoringCriteria ?? "",
          result.content,
        );
        score = judgeResult?.score;
        scoreComment = judgeResult?.comment;
      }

      await this.prisma.evalResult.update({
        where: { id: resultRecord.id },
        data: {
          response: result.content,
          tokensInput: result.tokensInput,
          tokensOutput: result.tokensOutput,
          responseTimeMs: result.responseTimeMs,
          score,
          scoreComment,
          status: "success",
        },
      });

      await this.updateUsageStat(
        model.id,
        result.tokensInput,
        result.tokensOutput,
      );
    } catch (err: any) {
      await this.prisma.evalResult.update({
        where: { id: resultRecord.id },
        data: { status: "failed", error: err.message },
      });
    }
  }

  private async runJudge(
    judgeModel: any,
    prompt: string,
    referenceAnswer: string,
    scoringCriteria: string,
    response: string,
  ): Promise<{ score: number; comment: string } | null> {
    try {
      const adapter = this.llmFactory.create(judgeModel);
      const messages: Message[] = [
        {
          role: "user",
          content: JUDGE_PROMPT(
            prompt,
            referenceAnswer,
            scoringCriteria,
            response,
          ),
        },
      ];
      const result = await adapter.chat(messages, {
        temperature: 0,
        maxTokens: 256,
      });
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // 评分失败不影响主流程
    }
    return null;
  }

  private async updateUsageStat(
    modelId: string,
    tokensInput: number,
    tokensOutput: number,
  ) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    await this.prisma.usageStat.upsert({
      where: { modelId_date: { modelId, date } },
      create: { modelId, date, tokensInput, tokensOutput, requestCount: 1 },
      update: {
        tokensInput: { increment: tokensInput },
        tokensOutput: { increment: tokensOutput },
        requestCount: { increment: 1 },
      },
    });
  }

  findSessions(type?: string) {
    return this.prisma.evalSession.findMany({
      where: type ? { type } : undefined,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { results: true } } },
    });
  }

  async findSession(id: string) {
    const session = await this.prisma.evalSession.findUnique({
      where: { id },
      include: { results: { orderBy: { createdAt: "asc" } } },
    });
    if (!session) throw new NotFoundException(`Session ${id} not found`);
    return session;
  }

  async exportSession(id: string) {
    const session = await this.findSession(id);
    return {
      session: {
        id: session.id,
        name: session.name,
        type: session.type,
        status: session.status,
        createdAt: session.createdAt,
      },
      results: session.results,
    };
  }
}
