import { AdministrationRole, Role } from './auth-user.js';

// What the Post-Login Action copies into the token's claims.
export interface ProfileMetadata {
  userId: string;
  role: Role;
  administrationId?: string;
  administrationRole?: AdministrationRole;
}

export abstract class IdentityProvider {
  abstract setProfileMetadata(sub: string, metadata: ProfileMetadata): Promise<void>;
  abstract clearProfileMetadata(sub: string): Promise<void>;
}
