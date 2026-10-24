import { IsISO8601, IsOptional } from 'class-validator';

export class FindTasksQueryDto {
  @IsOptional()
  @IsISO8601({ strict: true, strictSeparator: true })
  from?: string;

  @IsOptional()
  @IsISO8601({ strict: true, strictSeparator: true })
  to?: string;
}
