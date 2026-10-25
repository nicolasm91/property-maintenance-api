import { NamedReference, type ProfileType } from '../../users/entities/user.entity.js';

export class AdminUser {
  id: string;
  email: string;
  name: string;
  middleName: string | null;
  lastName: string;
  role: ProfileType;
  // The property manager's administration or the contractor's Company.
  organization: NamedReference | null;
  homes: number;
  tasks: number;
  createdAt: Date;
}
