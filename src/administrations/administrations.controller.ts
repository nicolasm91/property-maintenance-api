import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { AdministrationsService } from './administrations.service.js';
import { CreateAdministrationDto } from './dto/create-administration.dto.js';

@Controller('administrations')
export class AdministrationsController {
  constructor(
    private readonly administrationsService: AdministrationsService,
  ) {}

  @Post()
  create(@Body() dto: CreateAdministrationDto) {
    return this.administrationsService.create(dto);
  }

  @Get()
  findAll() {
    return this.administrationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.administrationsService.findOne(id);
  }
}
