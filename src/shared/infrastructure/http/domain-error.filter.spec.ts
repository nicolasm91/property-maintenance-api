import { ArgumentsHost } from '@nestjs/common';
import {
  ConcurrencyError,
  DomainError,
  InvariantViolationError,
  NotFoundError,
} from '../../domain/errors.js';
import { DomainErrorFilter } from './domain-error.filter.js';

class SomethingNotFound extends NotFoundError {}

describe('DomainErrorFilter', () => {
  const statusOf = (error: DomainError) => {
    const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const host = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as unknown as ArgumentsHost;
    new DomainErrorFilter().catch(error, host);
    return response.status.mock.calls[0][0];
  };

  it('maps domain error categories to HTTP status codes', () => {
    expect(statusOf(new SomethingNotFound('x'))).toBe(404);
    expect(statusOf(new ConcurrencyError('x'))).toBe(409);
    expect(statusOf(new InvariantViolationError('x'))).toBe(422);
  });
});
