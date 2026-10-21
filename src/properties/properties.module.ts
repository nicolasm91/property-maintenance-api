import { Module } from '@nestjs/common';
import { AdministrationsModule } from '../administrations/administrations.module.js';
import { ChangePropertyAdministrationUseCase } from './application/change-property-administration.use-case.js';
import { CreatePropertyUseCase } from './application/create-property.use-case.js';
import { GetAdministrationHistoryUseCase } from './application/get-administration-history.use-case.js';
import { GetPropertyUseCase } from './application/get-property.use-case.js';
import { ListPropertiesUseCase } from './application/list-properties.use-case.js';
import { PROPERTY_QUERIES } from './application/ports/property-queries.js';
import { PROPERTY_REPOSITORY } from './domain/property.repository.js';
import { AdministrationPropertiesController } from './infrastructure/http/administration-properties.controller.js';
import { PropertiesController } from './infrastructure/http/properties.controller.js';
import { PrismaPropertyQueries } from './infrastructure/persistence/prisma-property.queries.js';
import { PrismaPropertyRepository } from './infrastructure/persistence/prisma-property.repository.js';

@Module({
  imports: [AdministrationsModule],
  controllers: [PropertiesController, AdministrationPropertiesController],
  providers: [
    // Swapping the database means binding other adapters here.
    { provide: PROPERTY_REPOSITORY, useClass: PrismaPropertyRepository },
    { provide: PROPERTY_QUERIES, useClass: PrismaPropertyQueries },
    CreatePropertyUseCase,
    ChangePropertyAdministrationUseCase,
    GetPropertyUseCase,
    ListPropertiesUseCase,
    GetAdministrationHistoryUseCase,
  ],
})
export class PropertiesModule {}
