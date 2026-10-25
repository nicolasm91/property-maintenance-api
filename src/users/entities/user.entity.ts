import { type AdministrationRole } from '../../auth/auth-user.js';
import { MunicipalitySummary } from '../../municipalities/entities/municipality.entity.js';
import { Address } from '../../properties/entities/property.entity.js';

export const PROFILE_TYPES = ['propertyManager', 'directClient', 'contractor', 'tradesman'] as const;

export type ProfileType = (typeof PROFILE_TYPES)[number];

export const TRADES = ['electrician', 'handyman', 'plumber', 'mason'] as const;

export type Trade = (typeof TRADES)[number];

export class NamedReference {
  id: string;
  name: string;
}

export class Home {
  id: string;
  address: Address;
  // Null only on homes created before municipalities existed.
  municipality: MunicipalitySummary | null;
}

// Classes, not interfaces, so the OpenAPI document can describe each role's User.
class BaseUser {
  id: string;
  email: string;
  name: string;
  middleName: string | null;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PropertyManagerUser extends BaseUser {
  role: 'propertyManager';
  // Both null until they create their administration (POST /me/administration).
  administration: NamedReference | null;
  administrationRole: AdministrationRole | null;
}

export class DirectClientUser extends BaseUser {
  role: 'directClient';
  homes: Home[];
}

export class ContractorUser extends BaseUser {
  role: 'contractor';
  // Null until they create their Company (POST /me/company).
  company: NamedReference | null;
}

export class TradesmanUser extends BaseUser {
  role: 'tradesman';
  trades: Trade[];
  contractorId: string | null;
  // Their service area.
  municipalities: MunicipalitySummary[];
  ratingAverage: number | null;
  ratingCount: number;
}

export type User = PropertyManagerUser | DirectClientUser | ContractorUser | TradesmanUser;

export const USER_CLASSES = [PropertyManagerUser, DirectClientUser, ContractorUser, TradesmanUser];
