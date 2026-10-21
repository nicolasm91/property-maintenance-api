import { Type } from 'class-transformer';
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
} from '../../domain/property-type.js';

export class AddressRequest {
  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  number: string;

  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @IsString()
  @IsNotEmpty()
  intersection: string;
}

export class CreatePropertyRequest {
  @IsIn(PROPERTY_TYPES)
  propertyType: PropertyType;

  @ValidateNested()
  @Type(() => AddressRequest)
  address: AddressRequest;

  @IsOptional()
  @IsUUID()
  administrationId?: string;
}
