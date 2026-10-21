// Base errors of the domain layer. They carry no transport concerns: the HTTP
// adapter maps each category to a status code (see DomainErrorFilter).

export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** A referenced entity does not exist. */
export abstract class NotFoundError extends DomainError {}

/** The operation conflicts with the current state of an entity. */
export abstract class ConflictError extends DomainError {}

/** The input breaks a domain invariant (e.g. an empty required value). */
export class InvariantViolationError extends DomainError {}

/** Another operation changed the same data concurrently; the caller may retry. */
export class ConcurrencyError extends ConflictError {}
