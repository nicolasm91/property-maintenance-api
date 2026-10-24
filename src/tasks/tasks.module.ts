import { Module } from '@nestjs/common';
import { PropertiesModule } from '../properties/properties.module.js';
import { TradesmenModule } from '../tradesmen/tradesmen.module.js';
import { PrismaTasksRepository } from './repositories/prisma/prisma-tasks.repository.js';
import { TasksRepository } from './repositories/tasks.repository.js';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';

@Module({
  imports: [TradesmenModule, PropertiesModule],
  controllers: [TasksController],
  providers: [TasksService, { provide: TasksRepository, useClass: PrismaTasksRepository }],
})
export class TasksModule {}
