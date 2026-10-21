import { InvariantViolationError } from '../../shared/domain/errors.js';
import { Address } from './address.js';
import { AdministrationAssignment } from './administration-assignment.js';
import { PropertyAlreadyAssignedError } from './property.errors.js';
import { PropertyType } from './property-type.js';

export interface PropertyProps {
  id: string;
  type: PropertyType;
  address: Address;
  /** Assignment history, oldest first. At most one is open. */
  assignments: AdministrationAssignment[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A house or building. Aggregate root of its administration assignment
 * history: the current administration is the one of the open assignment.
 */
export class Property {
  private constructor(private readonly props: PropertyProps) {}

  static create(params: {
    id: string;
    type: PropertyType;
    address: Address;
    now: Date;
  }) {
    return new Property({
      id: params.id,
      type: params.type,
      address: params.address,
      assignments: [],
      createdAt: params.now,
      updatedAt: params.now,
    });
  }

  /** Rebuilds a property from storage, checking the aggregate invariants. */
  static rehydrate(props: PropertyProps) {
    const open = props.assignments.filter((a) => a.isOpen);
    if (open.length > 1) {
      throw new InvariantViolationError(
        `Property ${props.id} has more than one open administration assignment`,
      );
    }
    return new Property({ ...props, assignments: [...props.assignments] });
  }

  get id() {
    return this.props.id;
  }

  get type() {
    return this.props.type;
  }

  get address() {
    return this.props.address;
  }

  get assignments(): readonly AdministrationAssignment[] {
    return this.props.assignments;
  }

  get administrationId() {
    return this.openAssignment()?.administrationId ?? null;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  /**
   * Assigns the property to an administration: closes the current assignment,
   * if any, and opens a new one at the same instant.
   */
  assignAdministration(params: {
    administrationId: string;
    assignmentId: string;
    at: Date;
  }) {
    if (this.administrationId === params.administrationId) {
      throw new PropertyAlreadyAssignedError(this.id, params.administrationId);
    }
    this.openAssignment()?.close(params.at);
    this.props.assignments.push(
      AdministrationAssignment.open({
        id: params.assignmentId,
        administrationId: params.administrationId,
        at: params.at,
      }),
    );
    this.props.updatedAt = params.at;
  }

  private openAssignment() {
    return this.props.assignments.find((a) => a.isOpen);
  }
}
