import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUser, Role } from './auth-user.js';
import { AuthGuard } from './auth.guard.js';
import { IS_PUBLIC_KEY } from './decorators/public.decorator.js';
import { ROLES_KEY } from './decorators/roles.decorator.js';
import { InvalidTokenError, NotOnboardedError, TokenVerifier } from './token-verifier.js';

const platformOwner: AuthUser = { role: 'platformOwner' };

describe('AuthGuard', () => {
  const tokenVerifier = { verify: vi.fn() };
  let metadata: { [IS_PUBLIC_KEY]?: boolean; [ROLES_KEY]?: Role[] };
  let guard: AuthGuard;

  beforeEach(() => {
    vi.resetAllMocks();
    metadata = {};
    const reflector = { getAllAndOverride: (key: keyof typeof metadata) => metadata[key] } as unknown as Reflector;
    guard = new AuthGuard(reflector, tokenVerifier as TokenVerifier);
  });

  const contextWith = (authorization?: string) => {
    const request: { headers: { authorization?: string }; user?: AuthUser } = { headers: { authorization } };
    const context = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    return { context, request };
  };

  it('lets public routes through without a token', async () => {
    metadata[IS_PUBLIC_KEY] = true;

    await expect(guard.canActivate(contextWith().context)).resolves.toBe(true);
    expect(tokenVerifier.verify).not.toHaveBeenCalled();
  });

  it.each([undefined, 'Basic abc', 'Bearer'])('throws 401 for authorization header %s', async (header) => {
    await expect(guard.canActivate(contextWith(header).context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches the user from a valid token', async () => {
    tokenVerifier.verify.mockResolvedValue(platformOwner);
    const { context, request } = contextWith('Bearer token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(tokenVerifier.verify).toHaveBeenCalledWith('token');
    expect(request.user).toBe(platformOwner);
  });

  it('throws 401 for an invalid token', async () => {
    tokenVerifier.verify.mockRejectedValue(new InvalidTokenError());

    await expect(guard.canActivate(contextWith('Bearer token').context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws 403 for a user who has not completed onboarding', async () => {
    tokenVerifier.verify.mockRejectedValue(new NotOnboardedError());

    await expect(guard.canActivate(contextWith('Bearer token').context)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws 403 when the role is not allowed', async () => {
    metadata[ROLES_KEY] = ['propertyManager'];
    tokenVerifier.verify.mockResolvedValue(platformOwner);

    await expect(guard.canActivate(contextWith('Bearer token').context)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows a listed role', async () => {
    metadata[ROLES_KEY] = ['platformOwner', 'propertyManager'];
    tokenVerifier.verify.mockResolvedValue(platformOwner);

    await expect(guard.canActivate(contextWith('Bearer token').context)).resolves.toBe(true);
  });
});
