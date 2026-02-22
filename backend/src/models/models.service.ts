import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../common/crypto/crypto.service';
import { LlmAdapterFactory } from '../common/llm/llm-adapter.factory';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';

@Injectable()
export class ModelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly llmFactory: LlmAdapterFactory,
  ) {}

  async findAll() {
    const models = await this.prisma.llmModel.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return models.map((m) => this.maskModel(m));
  }

  async findOne(id: string) {
    const model = await this.prisma.llmModel.findUnique({ where: { id } });
    if (!model) throw new NotFoundException(`Model ${id} not found`);
    return this.maskModel(model);
  }

  async create(dto: CreateModelDto) {
    const encryptedKey = this.crypto.encrypt(dto.apiKey);
    const model = await this.prisma.llmModel.create({
      data: { ...dto, apiKey: encryptedKey },
    });
    return this.maskModel(model);
  }

  async update(id: string, dto: UpdateModelDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.apiKey) {
      data.apiKey = this.crypto.encrypt(dto.apiKey);
    }
    const model = await this.prisma.llmModel.update({ where: { id }, data });
    return this.maskModel(model);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.llmModel.delete({ where: { id } });
  }

  async testConnection(id: string) {
    const model = await this.prisma.llmModel.findUnique({ where: { id } });
    if (!model) throw new NotFoundException(`Model ${id} not found`);

    const adapter = this.llmFactory.create(model);
    const messages = [{ role: 'user' as const, content: 'Reply with "ok" only.' }];
    const options = { temperature: 0, maxTokens: 10, timeout: model.timeout };

    try {
      const result = await adapter.chat(messages, options);
      return { success: true, response: result.content };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  private maskModel(model: any) {
    return {
      ...model,
      apiKey: this.crypto.maskKey(
        model.apiKey.includes(':') ? '(encrypted)' : model.apiKey,
      ),
    };
  }

  async findRaw(id: string) {
    const model = await this.prisma.llmModel.findUnique({ where: { id } });
    if (!model) throw new NotFoundException(`Model ${id} not found`);
    return model;
  }
}
