import { InvariantViolationError } from '../../shared/domain/errors.js';

export interface AdministrationProps {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Organization that manages condominium associations (a client of the platform). */
export class Administration {
  private constructor(private readonly props: AdministrationProps) {}

  static create(params: { id: string; name: string; now: Date }) {
    return new Administration({
      id: params.id,
      name: Administration.validName(params.name),
      createdAt: params.now,
      updatedAt: params.now,
    });
  }

  /** Rebuilds an administration from storage. */
  static rehydrate(props: AdministrationProps) {
    return new Administration({ ...props });
  }

  get id() {
    return this.props.id;
  }

  get name() {
    return this.props.name;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  private static validName(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new InvariantViolationError(
        'Administration name must not be empty',
      );
    }
    return trimmed;
  }
}
