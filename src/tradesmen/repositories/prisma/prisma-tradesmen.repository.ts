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

const toTradesman = ({ userId, user, trades, contractorId, ratingAverage, ratingCount }: TradesmanRow): Tradesman => ({
  id: userId,
  ...user,
  trades,
  contractorId,
  ratingAverage: ratingAverage === null ? null : Number(ratingAverage),
  ratingCount,
});

@Injectable()
export class PrismaTradesmenRepository implements TradesmenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async search({
    trade,
    municipalityId,
    skip,
    take,
  }: {
    trade: Trade;
    municipalityId: string;
    skip: number;
    take: number;
  }): Promise<Tradesman[]> {
    const rows = await this.prisma.tradesman.findMany({
      where: { contractorId: null, trades: { has: trade }, municipalities: { some: { municipalityId } } },
      include: tradesmanInclude,
      orderBy: [
        { ratingAverage: { sort: 'desc', nulls: 'last' } },
        { user: { lastName: 'asc' } },
        { user: { name: 'asc' } },
        { userId: 'asc' },
      ],
      skip,
      take,
    });
    return rows.map(toTradesman);
  }

  async servesMunicipality(tradesmanId: string, municipalityId: string): Promise<boolean> {
    const row = await this.prisma.tradesmanMunicipality.findUnique({
      where: { municipalityId_tradesmanId: { municipalityId, tradesmanId } },
    });
    return row !== null;
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
