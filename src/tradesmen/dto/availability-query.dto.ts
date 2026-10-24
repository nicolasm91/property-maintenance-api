import { Matches } from 'class-validator';

export class AvailabilityQueryDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be a YYYY-MM-DD date' })
  date: string;
}
