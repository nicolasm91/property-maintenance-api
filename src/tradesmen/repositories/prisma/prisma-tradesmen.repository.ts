import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../prisma/generated/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { INACTIVE_STATUSES } from '../../../tasks/entities/task.entity.js';
import { Trade } from '../../../users/entities/user.entity.js';
import { Tradesman } from '../../entities/tradesman.entity.js';
import { TradesmenRepository } from '../tradesmen.repository.js';

const tradesmanInclude = {
  user: { select: { name: true, middleName: true, lastName: true } },
} satisfies Prisma.TradesmanInclude;

type TradesmanRow = Prisma.TradesmanGetPayload<{ include: typeof tradesmanInclude }>;

const toTradesman = ({ userId, user, trades, contractorId }: TradesmanRow): Tradesman => ({
  id: userId,
  ...user,
  trades,
  contractorId,
});

@Injectable()
export class PrismaTradesmenRepository implements TradesmenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findIndependentByTrade(trade: Trade): Promise<Tradesman[]> {
    const rows = await this.prisma.tradesman.findMany({
      where: { contractorId: null, trades: { has: trade } },
      include: tradesmanInclude,
      orderBy: [{ user: { lastName: 'asc' } }, { user: { name: 'asc' } }],
    });
    return rows.map(toTradesman);
  }

  async findById(id: string): Promise<Tradesman | null> {
    const row = await this.prisma.tradesman.findUnique({ where: { userId: id }, include: tradesmanInclude });
    return row ? toTradesman(row) : null;
  }

  async findTakenSlots(tradesmanId: string, from: Date, to: Date): Promise<Date[]> {
    const rows = await this.prisma.task.findMany({
      where: {
        tradesmanId,
        status: { notIn: [...INACTIVE_STATUSES] },
        scheduledAt: { gte: from, lte: to },
      },
      select: { scheduledAt: true },
    });
    return rows.map((row) => row.scheduledAt);
  }
}
