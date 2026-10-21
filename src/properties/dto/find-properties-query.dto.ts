import { IsOptional, IsUUID } from 'class-validator';

export class FindPropertiesQueryDto {
  /** Only buildings currently assigned to this administration. */
  @IsOptional()
  @IsUUID()
  administrationId?: string;
}
