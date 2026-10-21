import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import {
  PROPERTY_TYPES,
  type PropertyType,
} from '../entities/property.entity.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class AddressDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  street: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  number: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  intersection: string;
}

export class CreatePropertyDto {
  @IsIn(PROPERTY_TYPES)
  propertyType: PropertyType;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @IsOptional()
  @IsUUID()
  administrationId?: string;
}
