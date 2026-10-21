import { IsOptional, IsUUID } from 'class-validator';

export class FindPropertiesQueryDto {
  @IsOptional()
  @IsUUID()
  administrationId?: string;
}
