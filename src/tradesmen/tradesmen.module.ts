import { Module } from '@nestjs/common';
import { PrismaTradesmenRepository } from './repositories/prisma/prisma-tradesmen.repository.js';
import { TradesmenRepository } from './repositories/tradesmen.repository.js';
import { TradesmenController } from './tradesmen.controller.js';
import { TradesmenService } from './tradesmen.service.js';

@Module({
  controllers: [TradesmenController],
  providers: [TradesmenService, { provide: TradesmenRepository, useClass: PrismaTradesmenRepository }],
  exports: [TradesmenService],
})
export class TradesmenModule {}
