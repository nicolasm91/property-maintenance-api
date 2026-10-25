import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { TRADES, type Trade } from '../../users/entities/user.entity.js';

export class FindTradesmenQueryDto {
  @IsIn(TRADES)
  trade: Trade;

  @IsString()
  @IsNotEmpty()
  municipalityId: string;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
