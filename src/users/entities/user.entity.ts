import { type AdministrationRole } from '../../auth/auth-user.js';
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
  administration: NamedReference;
  administrationRole: AdministrationRole;
}

export class DirectClientUser extends BaseUser {
  role: 'directClient';
  homes: Home[];
}

export class ContractorUser extends BaseUser {
  role: 'contractor';
  company: NamedReference;
}

export class TradesmanUser extends BaseUser {
  role: 'tradesman';
  trades: Trade[];
  contractorId: string | null;
}

export type User = PropertyManagerUser | DirectClientUser | ContractorUser | TradesmanUser;

export const USER_CLASSES = [PropertyManagerUser, DirectClientUser, ContractorUser, TradesmanUser];
