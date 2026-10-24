import { Trade } from '../../users/entities/user.entity.js';
import { Tradesman } from '../entities/tradesman.entity.js';

export abstract class TradesmenRepository {
  abstract findIndependentByTrade(trade: Trade): Promise<Tradesman[]>;
  abstract findById(id: string): Promise<Tradesman | null>;
  // Start of every slot in [from, to] taken by one of the tradesman's active tasks.
  abstract findTakenSlots(tradesmanId: string, from: Date, to: Date): Promise<Date[]>;
}
