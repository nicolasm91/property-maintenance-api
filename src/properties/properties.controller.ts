import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { ChangeAdministrationDto } from './dto/change-administration.dto.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { FindPropertiesQueryDto } from './dto/find-properties-query.dto.js';
import { AdministrationAssignment, Property } from './entities/property.entity.js';
import { PropertiesService } from './properties.service.js';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('properties')
@Controller('properties')
@Roles('platformOwner', 'propertyManager')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @ApiOperation({ summary: "Create a property. A property manager's is always assigned to their own administration." })
  create(@Body() dto: CreatePropertyDto, @CurrentUser() user: AuthUser): Promise<Property> {
    return this.propertiesService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List properties, optionally only those currently assigned to an administration.' })
  findAll(@Query() query: FindPropertiesQueryDto, @CurrentUser() user: AuthUser): Promise<Property[]> {
    return this.propertiesService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a property with its current administration.' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser): Promise<Property> {
    return this.propertiesService.findOne(id, user);
  }

  @Put(':id/administration')
  @Roles('platformOwner')
  @ApiOperation({ summary: "Change the property's administration, keeping the assignment history." })
  changeAdministration(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeAdministrationDto,
  ): Promise<Property> {
    return this.propertiesService.changeAdministration(id, dto);
  }

  @Get(':id/administration-history')
  @ApiOperation({ summary: 'Administration assignment history, newest first.' })
  findAdministrationHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<AdministrationAssignment[]> {
    return this.propertiesService.findAdministrationHistory(id, user);
  }
}
