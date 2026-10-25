import { ArrayUnique, IsArray, IsString } from 'class-validator';

export class UpdateMunicipalitiesDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  municipalityIds: string[];
}
