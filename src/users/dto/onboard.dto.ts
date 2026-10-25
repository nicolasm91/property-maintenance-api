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
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AddressDto } from '../../properties/dto/create-property.dto.js';
import { PROFILE_TYPES, type ProfileType, TRADES, type Trade } from '../entities/user.entity.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class HomeDto extends AddressDto {
  @IsString()
  @IsNotEmpty()
  municipalityId: string;
}

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

  @ApiPropertyOptional({ type: () => HomeDto, description: 'Required for directClient: their first home.' })
  @ValidateIf((dto: OnboardDto) => dto.profileType === 'directClient')
  @ValidateNested()
  @Type(() => HomeDto)
  home?: HomeDto;

  @ApiPropertyOptional({ enum: TRADES, isArray: true, description: 'Tradesmen only. Zero or more trades.' })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(TRADES, { each: true })
  trades?: Trade[];

  @ApiPropertyOptional({ type: [String], description: 'Tradesmen only: the municipalities they work in.' })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  municipalityIds?: string[];
}
