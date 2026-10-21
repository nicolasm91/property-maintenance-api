import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ListPropertiesUseCase } from '../../application/list-properties.use-case.js';

/** Buildings currently assigned to an administration. */
@Controller('administrations/:administrationId/properties')
export class AdministrationPropertiesController {
  constructor(private readonly listProperties: ListPropertiesUseCase) {}

  @Get()
  findAll(@Param('administrationId', ParseUUIDPipe) administrationId: string) {
    return this.listProperties.execute({ administrationId });
  }
}
