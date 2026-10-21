import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAdministrationRequest {
  @IsString()
  @IsNotEmpty()
  name: string;
}
