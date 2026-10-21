import { ConflictError, NotFoundError } from '../../shared/domain/errors.js';

export class PropertyNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Property ${id} not found`);
  }
}

export class PropertyAlreadyAssignedError extends ConflictError {
  constructor(propertyId: string, administrationId: string) {
    super(
      `Property ${propertyId} is already assigned to administration ${administrationId}`,
    );
  }
}
