import { AdministrationRole } from '../../auth/auth-user.js';
import { Address } from '../../properties/entities/property.entity.js';

export const PROFILE_TYPES = ['propertyManager', 'directClient', 'contractor', 'tradesman'] as const;

export type ProfileType = (typeof PROFILE_TYPES)[number];

export const TRADES = ['electrician', 'handyman', 'plumber', 'mason'] as const;

export type Trade = (typeof TRADES)[number];

export interface Home {
  id: string;
  address: Address;
}

export type Profile =
  | {
      role: 'propertyManager';
      administration: { id: string; name: string };
      administrationRole: AdministrationRole;
    }
  | { role: 'directClient'; homes: Home[] }
  | { role: 'contractor'; company: { id: string; name: string } }
  | { role: 'tradesman'; trades: Trade[]; contractorId: string | null };

export type User = {
  id: string;
  email: string;
  name: string;
  middleName: string | null;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
} & Profile;
