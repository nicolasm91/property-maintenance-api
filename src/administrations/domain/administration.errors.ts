import { NotFoundError } from '../../shared/domain/errors.js';

export class AdministrationNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Administration ${id} not found`);
  }
}
