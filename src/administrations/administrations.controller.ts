import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { AdministrationsService } from './administrations.service.js';
import { Administration } from './entities/administration.entity.js';
import { CreateAdministrationDto } from './dto/create-administration.dto.js';

@Controller('administrations')
export class AdministrationsController {
  constructor(
    private readonly administrationsService: AdministrationsService,
  ) {}

  @Post()
  create(@Body() dto: CreateAdministrationDto): Promise<Administration> {
    return this.administrationsService.create(dto);
  }

  @Get()
  findAll(): Promise<Administration[]> {
    return this.administrationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Administration> {
    return this.administrationsService.findOne(id);
  }
}
