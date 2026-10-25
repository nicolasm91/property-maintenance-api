import { Module } from '@nestjs/common';
import { MunicipalitiesController } from './municipalities.controller.js';
import { MunicipalitiesService } from './municipalities.service.js';
import { MunicipalitiesRepository } from './repositories/municipalities.repository.js';
import { PrismaMunicipalitiesRepository } from './repositories/prisma/prisma-municipalities.repository.js';

@Module({
  controllers: [MunicipalitiesController],
  providers: [MunicipalitiesService, { provide: MunicipalitiesRepository, useClass: PrismaMunicipalitiesRepository }],
  exports: [MunicipalitiesService],
})
export class MunicipalitiesModule {}
