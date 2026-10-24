import { IsIn } from 'class-validator';
import { TRADES, type Trade } from '../../users/entities/user.entity.js';

export class FindTradesmenQueryDto {
  @IsIn(TRADES)
  trade: Trade;
}
