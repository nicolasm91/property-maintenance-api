import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ChangeAdministrationDto } from './dto/change-administration.dto.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { FindPropertiesQueryDto } from './dto/find-properties-query.dto.js';
import { PropertiesService } from './properties.service.js';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  create(@Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(dto);
  }

  @Get()
  findAll(@Query() query: FindPropertiesQueryDto) {
    return this.propertiesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.propertiesService.findOne(id);
  }

  @Put(':id/administration')
  changeAdministration(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeAdministrationDto,
  ) {
    return this.propertiesService.changeAdministration(id, dto);
  }

  @Get(':id/administration-history')
  findAdministrationHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.propertiesService.findAdministrationHistory(id);
  }
}
