import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const stats = await this.prisma.usageStat.aggregate({
      _sum: { tokensInput: true, tokensOutput: true, requestCount: true },
    });
    const modelCount = await this.prisma.llmModel.count({ where: { isActive: true } });
    const sessionCount = await this.prisma.evalSession.count();
    return {
      totalTokensInput: stats._sum.tokensInput ?? 0,
      totalTokensOutput: stats._sum.tokensOutput ?? 0,
      totalRequests: stats._sum.requestCount ?? 0,
      activeModels: modelCount,
      totalSessions: sessionCount,
    };
  }

  async getModelStats() {
    const stats = await this.prisma.usageStat.groupBy({
      by: ['modelId'],
      _sum: { tokensInput: true, tokensOutput: true, requestCount: true },
      orderBy: { _sum: { tokensOutput: 'desc' } },
    });

    const models = await this.prisma.llmModel.findMany({
      where: { id: { in: stats.map((s) => s.modelId) } },
      select: { id: true, name: true, provider: true },
    });

    const modelMap = new Map(models.map((m) => [m.id, m]));

    return stats.map((s) => ({
      ...s._sum,
      modelId: s.modelId,
      modelName: modelMap.get(s.modelId)?.name ?? s.modelId,
      provider: modelMap.get(s.modelId)?.provider ?? 'unknown',
    }));
  }

  async getTrend(days: number = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const stats = await this.prisma.usageStat.findMany({
      where: { date: { gte: since } },
      orderBy: { date: 'asc' },
    });

    const byDate = new Map<string, { tokensInput: number; tokensOutput: number; requestCount: number }>();

    for (const stat of stats) {
      const key = stat.date.toISOString().split('T')[0];
      const existing = byDate.get(key) ?? { tokensInput: 0, tokensOutput: 0, requestCount: 0 };
      byDate.set(key, {
        tokensInput: existing.tokensInput + stat.tokensInput,
        tokensOutput: existing.tokensOutput + stat.tokensOutput,
        requestCount: existing.requestCount + stat.requestCount,
      });
    }

    return Array.from(byDate.entries()).map(([date, data]) => ({ date, ...data }));
  }
}
