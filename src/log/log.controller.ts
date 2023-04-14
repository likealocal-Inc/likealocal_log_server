import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { LogService } from './log.service';
import { CreateLogDto } from './dto/create-log.dto';
import { LogEntity } from './entities/log.entity';
import { Request } from 'express';

@Controller('log')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Post()
  create(@Req() request: Request, @Body() createLogDto: CreateLogDto) {
    createLogDto.header = JSON.stringify(request.headers);
    return this.logService.create(createLogDto);
  }

  @Get(':name')
  async findAll(@Param('name') name: string): Promise<LogEntity[]> {
    return await this.logService.findAll(name);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<LogEntity> {
    return await this.logService.findOne(+id);
  }
}
