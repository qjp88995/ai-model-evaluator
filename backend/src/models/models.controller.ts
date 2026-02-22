import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ModelsService } from './models.service';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';

@ApiTags('models')
@Controller('models')
export class ModelsController {
  constructor(private readonly service: ModelsService) {}

  @Get()
  @ApiOperation({ summary: '获取所有模型' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个模型' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建模型' })
  create(@Body() dto: CreateModelDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新模型' })
  update(@Param('id') id: string, @Body() dto: UpdateModelDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除模型' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/test')
  @ApiOperation({ summary: '测试模型连通性' })
  test(@Param('id') id: string) {
    return this.service.testConnection(id);
  }
}
