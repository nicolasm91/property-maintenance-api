import { errors, type JWTPayload, type JWTVerifyGetKey, jwtVerify } from 'jose';
import { ADMINISTRATION_ROLES, AuthUser, ROLES } from './auth-user.js';
import { InvalidTokenError, TokenVerifier, VerifiedToken } from './token-verifier.js';

// Auth0 requires custom claims to be namespaced. Must match the Post-Login Action.
export const CLAIMS_NAMESPACE = 'https://property-maintenance-api/';

export class JoseTokenVerifier extends TokenVerifier {
  constructor(
    private readonly keys: JWTVerifyGetKey,
    private readonly issuer: string,
    private readonly audience: string,
  ) {
    super();
  }

  async verify(token: string): Promise<VerifiedToken> {
    let payload: JWTPayload;
    try {
      ({ payload } = await jwtVerify(token, this.keys, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['RS256'],
      }));
    } catch (error) {
      if (error instanceof errors.JOSEError) {
        throw new InvalidTokenError(error.message);
      }
      throw error;
    }
    const email = payload[CLAIMS_NAMESPACE + 'email'];
    return {
      identity: {
        sub: requireString(payload.sub, 'sub'),
        email: typeof email === 'string' && email !== '' ? email : null,
      },
      user: toAuthUser(payload),
    };
  }
}

function toAuthUser(payload: JWTPayload): AuthUser | null {
  const claim = (name: string) => payload[CLAIMS_NAMESPACE + name];
  const role = claim('role');
  if (role === undefined) {
    return null;
  }
  if (!isOneOf(ROLES, role)) {
    throw new InvalidTokenError(`Unknown role ${JSON.stringify(role)}`);
  }
  if (role === 'platformOwner') {
    return { role };
  }

  const userId = requireString(claim('userId'), 'userId');
  if (role !== 'propertyManager') {
    return { role, userId };
  }
  const administrationRole = claim('administrationRole');
  if (!isOneOf(ADMINISTRATION_ROLES, administrationRole)) {
    throw new InvalidTokenError('Invalid administrationRole claim');
  }
  return {
    role,
    userId,
    administrationId: requireString(claim('administrationId'), 'administrationId'),
    administrationRole,
  };
}

function requireString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value === '') {
    throw new InvalidTokenError(`Missing ${name} claim`);
  }
  return value;
}

function isOneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return values.includes(value as T);
}
