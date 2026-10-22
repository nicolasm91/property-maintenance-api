export const ROLES = ['platformOwner', 'propertyManager', 'directClient', 'contractor', 'tradesman'] as const;

export type Role = (typeof ROLES)[number];

export const ADMINISTRATION_ROLES = ['admin', 'member'] as const;

export type AdministrationRole = (typeof ADMINISTRATION_ROLES)[number];

// The platform owner is not a User of ours (no userId): the role is set by hand
// in Auth0's app_metadata until platform super-roles are designed.
export type AuthUser =
  | { role: 'platformOwner' }
  | {
      role: 'propertyManager';
      userId: string;
      administrationId: string;
      administrationRole: AdministrationRole;
    }
  | { role: 'directClient' | 'contractor' | 'tradesman'; userId: string };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
