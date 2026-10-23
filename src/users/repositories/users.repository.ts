import { Trade, User } from '../entities/user.entity.js';

export type NewProfile =
  | { role: 'propertyManager'; administrationName: string }
  | { role: 'contractor'; companyName: string }
  | { role: 'tradesman'; trades: Trade[] };

export interface CreateUserData {
  auth0Sub: string;
  email: string;
  name: string;
  middleName: string | null;
  lastName: string;
  profile: NewProfile;
}

export abstract class UsersRepository {
  abstract findByAuth0Sub(auth0Sub: string): Promise<User | null>;
  // Must be atomic: also creates the property manager's administration (as its
  // admin) or the contractor's Company. Throws ConflictException if the
  // auth0Sub or email is already taken.
  abstract create(data: CreateUserData): Promise<User>;
}
