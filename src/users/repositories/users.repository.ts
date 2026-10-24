import { Address } from '../../properties/entities/property.entity.js';
import { Trade, User } from '../entities/user.entity.js';

export type NewProfile =
  | { role: 'propertyManager'; administrationName: string }
  | { role: 'directClient'; home: Address }
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
  // admin), the direct client's first home, or the contractor's Company. Throws
  // ConflictException if the auth0Sub or email is already taken.
  abstract create(data: CreateUserData): Promise<User>;
  // Returns null if the User is not a tradesman.
  abstract updateTrades(userId: string, trades: Trade[]): Promise<User | null>;
}
