import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { ChangeAdministrationDto } from './dto/change-administration.dto.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { FindPropertiesQueryDto } from './dto/find-properties-query.dto.js';
import { AdministrationAssignment, Property } from './entities/property.entity.js';
import { PropertiesService } from './properties.service.js';

@Controller('properties')
@Roles('platformOwner', 'propertyManager')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  create(@Body() dto: CreatePropertyDto, @CurrentUser() user: AuthUser): Promise<Property> {
    return this.propertiesService.create(dto, user);
  }

  @Get()
  findAll(@Query() query: FindPropertiesQueryDto, @CurrentUser() user: AuthUser): Promise<Property[]> {
    return this.propertiesService.findAll(query, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser): Promise<Property> {
    return this.propertiesService.findOne(id, user);
  }

  @Put(':id/administration')
  @Roles('platformOwner')
  changeAdministration(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeAdministrationDto,
  ): Promise<Property> {
    return this.propertiesService.changeAdministration(id, dto);
  }

  @Get(':id/administration-history')
  findAdministrationHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<AdministrationAssignment[]> {
    return this.propertiesService.findAdministrationHistory(id, user);
  }
}
