import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { isFutureSlotStart, slotsOn } from '../tasks/slots.js';
import { AvailabilityQueryDto } from './dto/availability-query.dto.js';
import { FindTradesmenQueryDto } from './dto/find-tradesmen-query.dto.js';
import { Tradesman, TradesmenPage } from './entities/tradesman.entity.js';
import { TradesmenRepository } from './repositories/tradesmen.repository.js';

const DEFAULT_PAGE_SIZE = 20;

const encodeCursor = (offset: number) => Buffer.from(JSON.stringify({ offset })).toString('base64url');

function decodeCursor(cursor: string): number {
  try {
    const { offset } = JSON.parse(Buffer.from(cursor, 'base64url').toString()) as { offset: unknown };
    if (Number.isInteger(offset) && (offset as number) >= 0) {
      return offset as number;
    }
  } catch {
    // Falls through to the 400 below.
  }
  throw new BadRequestException('Invalid cursor');
}

@Injectable()
export class TradesmenService {
  constructor(private readonly tradesmen: TradesmenRepository) {}

  // The cursor is an opaque offset: search results are read a few pages deep at most.
  async findAll(query: FindTradesmenQueryDto): Promise<TradesmenPage> {
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;
    const skip = query.cursor ? decodeCursor(query.cursor) : 0;
    const found = await this.tradesmen.search({
      trade: query.trade,
      municipalityId: query.municipalityId,
      skip,
      take: limit + 1,
    });
    return {
      items: found.slice(0, limit),
      nextCursor: found.length > limit ? encodeCursor(skip + limit) : null,
    };
  }

  async assertServes(tradesmanId: string, municipalityId: string): Promise<void> {
    if (!(await this.tradesmen.servesMunicipality(tradesmanId, municipalityId))) {
      throw new BadRequestException(`Tradesman ${tradesmanId} does not work in municipality ${municipalityId}`);
    }
  }

  // Direct clients can only book independent tradesmen.
  async findBookable(id: string): Promise<Tradesman> {
    const tradesman = await this.tradesmen.findById(id);
    if (!tradesman || tradesman.contractorId) {
      throw new NotFoundException(`Tradesman ${id} not found`);
    }
    return tradesman;
  }

  async findAvailability(id: string, query: AvailabilityQueryDto): Promise<Date[]> {
    await this.findBookable(id);
    let slots: Date[];
    try {
      slots = slotsOn(query.date);
    } catch (error) {
      if (error instanceof RangeError) {
        throw new BadRequestException(`Invalid date: ${query.date}`);
      }
      throw error;
    }
    const taken = await this.tradesmen.findTakenSlots(id, slots[0], slots[slots.length - 1]);
    const takenTimes = new Set(taken.map((slot) => slot.getTime()));
    const now = new Date();
    return slots.filter((slot) => isFutureSlotStart(slot, now) && !takenTimes.has(slot.getTime()));
  }
}
