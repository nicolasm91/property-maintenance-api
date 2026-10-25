import { Address } from '../../properties/entities/property.entity.js';
import { Trade, User } from '../entities/user.entity.js';

export type NewProfile =
  | { role: 'propertyManager' }
  | { role: 'directClient'; home: Address & { municipalityId: string } }
  | { role: 'contractor' }
  | { role: 'tradesman'; trades: Trade[]; municipalityIds: string[] };

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
  // Must be atomic: also creates the direct client's first home. Throws
  // ConflictException if the auth0Sub or email is already taken.
  abstract create(data: CreateUserData): Promise<User>;
  // Returns null if the User is not a tradesman.
  abstract updateTrades(userId: string, trades: Trade[]): Promise<User | null>;
  // Replaces the tradesman's service area atomically. Returns null if the User is not a tradesman.
  abstract updateMunicipalities(userId: string, municipalityIds: string[]): Promise<User | null>;
  // Atomic: creates the administration with the property manager as its admin.
  // Returns null if the User is not a property manager; throws
  // ConflictException if they already have an administration.
  abstract createAdministration(userId: string, name: string): Promise<User | null>;
  // Same contract as createAdministration, for a contractor's Company.
  abstract createCompany(userId: string, name: string): Promise<User | null>;
}
