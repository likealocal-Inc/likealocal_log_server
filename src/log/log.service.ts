import { Injectable } from '@nestjs/common';
import { CreateLogDto } from './dto/create-log.dto';
import { PrismaService } from 'src/config/core/prisma/prisma.service';
import { LogEntity as LogEntity } from './entities/log.entity';

@Injectable()
export class LogService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createLogDto: CreateLogDto): Promise<void> {
    await this.prisma.log.create({ data: createLogDto });
  }

  async findAll(name: string): Promise<LogEntity[]> {
    return await this.prisma.log.findMany({ where: { name } });
  }

  async findOne(id: number): Promise<LogEntity> {
    return await this.prisma.log.findUnique({ where: { id } });
  }
}
