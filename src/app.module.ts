import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdministrationsModule } from './administrations/administrations.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { HealthModule } from './health/health.module.js';
import { PropertiesModule } from './properties/properties.module.js';
import { PrismaModule } from './shared/infrastructure/persistence/prisma/prisma.module.js';
import { SharedModule } from './shared/infrastructure/shared.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SharedModule,
    PrismaModule,
    HealthModule,
    AdministrationsModule,
    PropertiesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
