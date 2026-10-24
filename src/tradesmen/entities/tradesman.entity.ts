import { Trade } from '../../users/entities/user.entity.js';

export class Tradesman {
  id: string;
  name: string;
  middleName: string | null;
  lastName: string;
  trades: Trade[];
  contractorId: string | null;
}
