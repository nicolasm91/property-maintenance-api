import { Module } from '@nestjs/common';
import { CreateAdministrationUseCase } from './application/create-administration.use-case.js';
import { GetAdministrationUseCase } from './application/get-administration.use-case.js';
import { ListAdministrationsUseCase } from './application/list-administrations.use-case.js';
import { ADMINISTRATION_REPOSITORY } from './domain/administration.repository.js';
import { AdministrationsController } from './infrastructure/http/administrations.controller.js';
import { PrismaAdministrationRepository } from './infrastructure/persistence/prisma-administration.repository.js';

@Module({
  controllers: [AdministrationsController],
  providers: [
    // Swapping the database means binding another adapter here.
    {
      provide: ADMINISTRATION_REPOSITORY,
      useClass: PrismaAdministrationRepository,
    },
    CreateAdministrationUseCase,
    GetAdministrationUseCase,
    ListAdministrationsUseCase,
  ],
  exports: [ADMINISTRATION_REPOSITORY],
})
export class AdministrationsModule {}
