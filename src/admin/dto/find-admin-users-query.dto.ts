import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PROFILE_TYPES, type ProfileType } from '../../users/entities/user.entity.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class FindAdminUsersQueryDto {
  @IsOptional()
  @IsIn(PROFILE_TYPES)
  role?: ProfileType;

  // Matched against email, name, and last name, ignoring case.
  @Transform(trim)
  @IsOptional()
  @IsString()
  search?: string;
}
