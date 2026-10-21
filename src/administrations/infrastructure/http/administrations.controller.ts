import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CreateAdministrationUseCase } from '../../application/create-administration.use-case.js';
import { GetAdministrationUseCase } from '../../application/get-administration.use-case.js';
import { ListAdministrationsUseCase } from '../../application/list-administrations.use-case.js';
import { toAdministrationResponse } from './administration.response.js';
import { CreateAdministrationRequest } from './create-administration.request.js';

@Controller('administrations')
export class AdministrationsController {
  constructor(
    private readonly createAdministration: CreateAdministrationUseCase,
    private readonly getAdministration: GetAdministrationUseCase,
    private readonly listAdministrations: ListAdministrationsUseCase,
  ) {}

  @Post()
  async create(@Body() request: CreateAdministrationRequest) {
    return toAdministrationResponse(
      await this.createAdministration.execute(request),
    );
  }

  @Get()
  async findAll() {
    const administrations = await this.listAdministrations.execute();
    return administrations.map(toAdministrationResponse);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return toAdministrationResponse(await this.getAdministration.execute(id));
  }
}
