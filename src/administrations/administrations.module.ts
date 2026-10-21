import { Module } from '@nestjs/common';
import { AdministrationsController } from './administrations.controller.js';
import { AdministrationsService } from './administrations.service.js';
import { AdministrationsRepository } from './repositories/administrations.repository.js';
import { PrismaAdministrationsRepository } from './repositories/prisma/prisma-administrations.repository.js';

@Module({
  controllers: [AdministrationsController],
  providers: [
    AdministrationsService,
    // To change the database, bind another implementation here.
    {
      provide: AdministrationsRepository,
      useClass: PrismaAdministrationsRepository,
    },
  ],
  exports: [AdministrationsService],
})
export class AdministrationsModule {}
