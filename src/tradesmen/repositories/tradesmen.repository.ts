import { Trade } from '../../users/entities/user.entity.js';
import { Tradesman } from '../entities/tradesman.entity.js';

export abstract class TradesmenRepository {
  // Independent tradesmen with the trade who work in the municipality, by
  // rating (unrated last), then name.
  abstract search(filter: { trade: Trade; municipalityId: string; skip: number; take: number }): Promise<Tradesman[]>;
  abstract servesMunicipality(tradesmanId: string, municipalityId: string): Promise<boolean>;
  abstract findById(id: string): Promise<Tradesman | null>;
  // Start of every slot in [from, to] taken by one of the tradesman's active tasks.
  abstract findTakenSlots(tradesmanId: string, from: Date, to: Date): Promise<Date[]>;
}
