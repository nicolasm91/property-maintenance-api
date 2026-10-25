import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module.js';
import { AdministrationsModule } from './administrations/administrations.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { HealthModule } from './health/health.module.js';
import { MunicipalitiesModule } from './municipalities/municipalities.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PropertiesModule } from './properties/properties.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { TradesmenModule } from './tradesmen/tradesmen.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    PrismaModule,
    HealthModule,
    AdministrationsModule,
    PropertiesModule,
    UsersModule,
    TradesmenModule,
    TasksModule,
    AdminModule,
    MunicipalitiesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
