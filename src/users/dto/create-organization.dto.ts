import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateOrganizationDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  name: string;
}
