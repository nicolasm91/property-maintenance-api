import { AuthUser, Identity } from './auth-user.js';

export class InvalidTokenError extends Error {}

export interface VerifiedToken {
  identity: Identity;
  // Null until the caller completes onboarding (the token has no profile claims).
  user: AuthUser | null;
}

export abstract class TokenVerifier {
  // Throws InvalidTokenError.
  abstract verify(token: string): Promise<VerifiedToken>;
}
