import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTestSetDto, CreateTestCaseDto } from './dto/create-testset.dto';

@Injectable()
export class TestsetsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.testSet.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { testCases: true } } },
    });
  }

  async findOne(id: string) {
    const set = await this.prisma.testSet.findUnique({
      where: { id },
      include: { testCases: { orderBy: { order: 'asc' } } },
    });
    if (!set) throw new NotFoundException(`TestSet ${id} not found`);
    return set;
  }

  async create(dto: CreateTestSetDto) {
    const { testCases, ...setData } = dto;
    return this.prisma.testSet.create({
      data: {
        ...setData,
        testCases: testCases
          ? { create: testCases.map((tc, i) => ({ ...tc, order: tc.order ?? i })) }
          : undefined,
      },
      include: { testCases: { orderBy: { order: 'asc' } } },
    });
  }

  async update(id: string, dto: Partial<CreateTestSetDto>) {
    await this.findOne(id);
    const { testCases, ...setData } = dto;
    return this.prisma.testSet.update({
      where: { id },
      data: setData,
      include: { testCases: { orderBy: { order: 'asc' } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.testSet.delete({ where: { id } });
  }

  async addCase(testSetId: string, dto: CreateTestCaseDto) {
    await this.findOne(testSetId);
    const count = await this.prisma.testCase.count({ where: { testSetId } });
    return this.prisma.testCase.create({
      data: { ...dto, testSetId, order: dto.order ?? count },
    });
  }

  async updateCase(testSetId: string, caseId: string, dto: Partial<CreateTestCaseDto>) {
    const tc = await this.prisma.testCase.findFirst({ where: { id: caseId, testSetId } });
    if (!tc) throw new NotFoundException(`TestCase ${caseId} not found`);
    return this.prisma.testCase.update({ where: { id: caseId }, data: dto });
  }

  async removeCase(testSetId: string, caseId: string) {
    const tc = await this.prisma.testCase.findFirst({ where: { id: caseId, testSetId } });
    if (!tc) throw new NotFoundException(`TestCase ${caseId} not found`);
    await this.prisma.testCase.delete({ where: { id: caseId } });
  }

  async importCases(testSetId: string, cases: CreateTestCaseDto[]) {
    await this.findOne(testSetId);
    const currentCount = await this.prisma.testCase.count({ where: { testSetId } });
    const data = cases.map((tc, i) => ({
      ...tc,
      testSetId,
      order: currentCount + i,
    }));
    return this.prisma.testCase.createMany({ data });
  }
}
