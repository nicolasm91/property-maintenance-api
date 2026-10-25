import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class FindMunicipalitiesQueryDto {
  @IsOptional()
  @Matches(/^\d{2}$/, { message: 'provinceId must be a two-digit Georef province id' })
  provinceId?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(60)
  search?: string;
}
