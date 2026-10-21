import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ChangePropertyAdministrationUseCase } from '../../application/change-property-administration.use-case.js';
import { CreatePropertyUseCase } from '../../application/create-property.use-case.js';
import { GetAdministrationHistoryUseCase } from '../../application/get-administration-history.use-case.js';
import { GetPropertyUseCase } from '../../application/get-property.use-case.js';
import { ListPropertiesUseCase } from '../../application/list-properties.use-case.js';
import { ChangeAdministrationRequest } from './change-administration.request.js';
import { CreatePropertyRequest } from './create-property.request.js';

@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly createProperty: CreatePropertyUseCase,
    private readonly changeAdministration: ChangePropertyAdministrationUseCase,
    private readonly getProperty: GetPropertyUseCase,
    private readonly listProperties: ListPropertiesUseCase,
    private readonly getAdministrationHistory: GetAdministrationHistoryUseCase,
  ) {}

  @Post()
  async create(@Body() request: CreatePropertyRequest) {
    const id = await this.createProperty.execute(request);
    return this.getProperty.execute(id);
  }

  @Get()
  findAll() {
    return this.listProperties.execute();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getProperty.execute(id);
  }

  @Put(':id/administration')
  async assignAdministration(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() request: ChangeAdministrationRequest,
  ) {
    await this.changeAdministration.execute({
      propertyId: id,
      administrationId: request.administrationId,
    });
    return this.getProperty.execute(id);
  }

  @Get(':id/administration-history')
  findAdministrationHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.getAdministrationHistory.execute(id);
  }
}
