import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { AdministrationsService } from './administrations.service.js';
import { Administration } from './entities/administration.entity.js';
import { CreateAdministrationDto } from './dto/create-administration.dto.js';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('administrations')
@Controller('administrations')
export class AdministrationsController {
  constructor(private readonly administrationsService: AdministrationsService) {}

  @Post()
  @Roles('platformOwner')
  @ApiOperation({
    summary: 'Create a property administration. Platform owner only: property managers use POST /me/administration.',
  })
  create(@Body() dto: CreateAdministrationDto): Promise<Administration> {
    return this.administrationsService.create(dto);
  }

  @Get()
  @Roles('platformOwner')
  @ApiOperation({ summary: 'List administrations.' })
  findAll(): Promise<Administration[]> {
    return this.administrationsService.findAll();
  }

  @Get(':id')
  @Roles('platformOwner', 'propertyManager')
  @ApiOperation({ summary: 'Get an administration. A property manager only gets their own.' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser): Promise<Administration> {
    return this.administrationsService.findOneForUser(id, user);
  }
}
