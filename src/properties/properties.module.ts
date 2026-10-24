import { Module } from '@nestjs/common';
import { AdministrationsModule } from '../administrations/administrations.module.js';
import { PropertiesController } from './properties.controller.js';
import { PropertiesService } from './properties.service.js';
import { PropertiesRepository } from './repositories/properties.repository.js';
import { PrismaPropertiesRepository } from './repositories/prisma/prisma-properties.repository.js';

@Module({
  imports: [AdministrationsModule],
  controllers: [PropertiesController],
  providers: [PropertiesService, { provide: PropertiesRepository, useClass: PrismaPropertiesRepository }],
  exports: [PropertiesService],
})
export class PropertiesModule {}
