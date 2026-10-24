import { Transform } from 'class-transformer';
import { IsIn, IsISO8601, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { TRADES, type Trade } from '../../users/entities/user.entity.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateTaskDto {
  @IsUUID()
  tradesmanId: string;

  @IsUUID()
  propertyId: string;

  @IsIn(TRADES)
  trade: Trade;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  title: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsISO8601({ strict: true, strictSeparator: true })
  scheduledAt: string;
}
