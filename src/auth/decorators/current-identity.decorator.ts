import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { Identity } from '../auth-user.js';

export const CurrentIdentity = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Identity => context.switchToHttp().getRequest<Request>().identity!,
);
