import { Transform, Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { AddressDto } from '../../properties/dto/create-property.dto.js';
import { PROFILE_TYPES, type ProfileType, TRADES, type Trade } from '../entities/user.entity.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class OnboardDto {
  @IsIn(PROFILE_TYPES)
  profileType: ProfileType;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  name: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  middleName?: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ValidateIf((dto: OnboardDto) => dto.profileType === 'propertyManager')
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  administrationName?: string;

  @ValidateIf((dto: OnboardDto) => dto.profileType === 'contractor')
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  companyName?: string;

  @ValidateIf((dto: OnboardDto) => dto.profileType === 'directClient')
  @ValidateNested()
  @Type(() => AddressDto)
  home?: AddressDto;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(TRADES, { each: true })
  trades?: Trade[];
}
