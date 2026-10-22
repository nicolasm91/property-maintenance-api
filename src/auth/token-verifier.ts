import { AuthUser } from './auth-user.js';

export class InvalidTokenError extends Error {}

// A valid token of someone who hasn't completed onboarding yet (no profile claims).
export class NotOnboardedError extends Error {}

export abstract class TokenVerifier {
  // Throws InvalidTokenError or NotOnboardedError.
  abstract verify(token: string): Promise<AuthUser>;
}
