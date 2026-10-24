import { ArrayUnique, IsArray, IsIn } from 'class-validator';
import { TRADES, type Trade } from '../entities/user.entity.js';

export class UpdateTradesDto {
  @IsArray()
  @ArrayUnique()
  @IsIn(TRADES, { each: true })
  trades: Trade[];
}
