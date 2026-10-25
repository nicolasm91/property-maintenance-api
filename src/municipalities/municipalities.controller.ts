import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AllowNotOnboarded } from '../auth/decorators/allow-not-onboarded.decorator.js';
import { FindMunicipalitiesQueryDto } from './dto/find-municipalities-query.dto.js';
import { Municipality, Province } from './entities/municipality.entity.js';
import { MunicipalitiesService } from './municipalities.service.js';

// Onboarding needs the catalog, so it is open to callers who have not onboarded yet.
@ApiTags('municipalities')
@Controller()
@AllowNotOnboarded()
export class MunicipalitiesController {
  constructor(private readonly municipalitiesService: MunicipalitiesService) {}

  @Get('provinces')
  @ApiOperation({ summary: 'Every province of the catalog, by name.' })
  findProvinces(): Promise<Province[]> {
    return this.municipalitiesService.findProvinces();
  }

  @Get('municipalities')
  @ApiOperation({
    summary:
      'Municipalities by name: all of a province, and/or (at most 50) whose name contains `search`, ignoring case and accents.',
  })
  findAll(@Query() query: FindMunicipalitiesQueryDto): Promise<Municipality[]> {
    return this.municipalitiesService.findAll(query);
  }
}
