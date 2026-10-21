import { IsUUID } from 'class-validator';

export class ChangeAdministrationRequest {
  @IsUUID()
  administrationId: string;
}
