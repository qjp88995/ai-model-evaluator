import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TestsetsService } from './testsets.service';
import { CreateTestSetDto, CreateTestCaseDto } from './dto/create-testset.dto';

@ApiTags('testsets')
@Controller('testsets')
export class TestsetsController {
  constructor(private readonly service: TestsetsService) {}

  @Get()
  @ApiOperation({ summary: '获取所有测评集' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取测评集详情（含用例）' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建测评集' })
  create(@Body() dto: CreateTestSetDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新测评集' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateTestSetDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除测评集' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/cases')
  @ApiOperation({ summary: '添加测试用例' })
  addCase(@Param('id') id: string, @Body() dto: CreateTestCaseDto) {
    return this.service.addCase(id, dto);
  }

  @Put(':id/cases/:caseId')
  @ApiOperation({ summary: '更新测试用例' })
  updateCase(
    @Param('id') id: string,
    @Param('caseId') caseId: string,
    @Body() dto: Partial<CreateTestCaseDto>,
  ) {
    return this.service.updateCase(id, caseId, dto);
  }

  @Delete(':id/cases/:caseId')
  @ApiOperation({ summary: '删除测试用例' })
  removeCase(@Param('id') id: string, @Param('caseId') caseId: string) {
    return this.service.removeCase(id, caseId);
  }

  @Post(':id/import')
  @ApiOperation({ summary: '批量导入测试用例' })
  importCases(@Param('id') id: string, @Body() cases: CreateTestCaseDto[]) {
    return this.service.importCases(id, cases);
  }
}
