import { IsUUID } from 'class-validator';

export class ChangeAdministrationDto {
  @IsUUID()
  administrationId: string;
}
