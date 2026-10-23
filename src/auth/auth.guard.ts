import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Role } from './auth-user.js';
import { ALLOW_NOT_ONBOARDED_KEY } from './decorators/allow-not-onboarded.decorator.js';
import { IS_PUBLIC_KEY } from './decorators/public.decorator.js';
import { ROLES_KEY } from './decorators/roles.decorator.js';
import { InvalidTokenError, TokenVerifier, VerifiedToken } from './token-verifier.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenVerifier: TokenVerifier,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let verified: VerifiedToken;
    try {
      verified = await this.tokenVerifier.verify(token);
    } catch (error) {
      if (error instanceof InvalidTokenError) {
        throw new UnauthorizedException('Invalid token');
      }
      throw error;
    }
    request.identity = verified.identity;

    if (!verified.user) {
      if (this.reflector.getAllAndOverride<boolean>(ALLOW_NOT_ONBOARDED_KEY, targets)) {
        return true;
      }
      throw new ForbiddenException('Onboarding not completed');
    }
    request.user = verified.user;

    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, targets);
    if (roles && !roles.includes(request.user.role)) {
      throw new ForbiddenException();
    }
    return true;
  }
}
