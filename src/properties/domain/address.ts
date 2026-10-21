import { InvariantViolationError } from '../../shared/domain/errors.js';

export interface AddressProps {
  street: string;
  number: string;
  postalCode: string;
  /** Nearest cross streets. */
  intersection: string;
}

export class Address {
  private constructor(private readonly props: AddressProps) {}

  static create(props: AddressProps) {
    const normalized = {} as AddressProps;
    for (const key of Object.keys(props) as (keyof AddressProps)[]) {
      const value = props[key].trim();
      if (!value) {
        throw new InvariantViolationError(`Address ${key} must not be empty`);
      }
      normalized[key] = value;
    }
    return new Address(normalized);
  }

  get street() {
    return this.props.street;
  }

  get number() {
    return this.props.number;
  }

  get postalCode() {
    return this.props.postalCode;
  }

  get intersection() {
    return this.props.intersection;
  }

  toJSON(): AddressProps {
    return { ...this.props };
  }
}
