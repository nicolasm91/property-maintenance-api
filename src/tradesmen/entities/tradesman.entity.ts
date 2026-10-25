import { Trade } from '../../users/entities/user.entity.js';

export class Tradesman {
  id: string;
  name: string;
  middleName: string | null;
  lastName: string;
  trades: Trade[];
  contractorId: string | null;
  // Null until they get their first rating.
  ratingAverage: number | null;
  ratingCount: number;
}

export class TradesmenPage {
  items: Tradesman[];
  // Pass it back as `cursor` for the next page; null on the last one.
  nextCursor: string | null;
}
