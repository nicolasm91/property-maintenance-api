import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class RejectTaskDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  reason?: string;
}
