import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ConflictError,
  DomainError,
  InvariantViolationError,
  NotFoundError,
} from '../../domain/errors.js';

function statusFor(error: DomainError): HttpStatus {
  if (error instanceof NotFoundError) return HttpStatus.NOT_FOUND;
  if (error instanceof ConflictError) return HttpStatus.CONFLICT;
  if (error instanceof InvariantViolationError) {
    return HttpStatus.UNPROCESSABLE_ENTITY;
  }
  return HttpStatus.INTERNAL_SERVER_ERROR;
}

/** Translates domain errors into HTTP responses. */
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(error: DomainError, host: ArgumentsHost) {
    const status = statusFor(error);
    host.switchToHttp().getResponse<Response>().status(status).json({
      statusCode: status,
      error: error.name,
      message: error.message,
    });
  }
}
