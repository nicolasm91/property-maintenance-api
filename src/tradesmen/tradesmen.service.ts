import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { isFutureSlotStart, slotsOn } from '../tasks/slots.js';
import { AvailabilityQueryDto } from './dto/availability-query.dto.js';
import { FindTradesmenQueryDto } from './dto/find-tradesmen-query.dto.js';
import { Tradesman } from './entities/tradesman.entity.js';
import { TradesmenRepository } from './repositories/tradesmen.repository.js';

@Injectable()
export class TradesmenService {
  constructor(private readonly tradesmen: TradesmenRepository) {}

  findAll(query: FindTradesmenQueryDto): Promise<Tradesman[]> {
    return this.tradesmen.findIndependentByTrade(query.trade);
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
