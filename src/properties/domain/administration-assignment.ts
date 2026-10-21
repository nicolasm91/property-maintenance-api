import { InvariantViolationError } from '../../shared/domain/errors.js';

export interface AdministrationAssignmentProps {
  id: string;
  administrationId: string;
  startedAt: Date;
  endedAt: Date | null;
}

/** A period in which a property was administered by one administration. */
export class AdministrationAssignment {
  private constructor(private readonly props: AdministrationAssignmentProps) {}

  static open(params: { id: string; administrationId: string; at: Date }) {
    return new AdministrationAssignment({
      id: params.id,
      administrationId: params.administrationId,
      startedAt: params.at,
      endedAt: null,
    });
  }

  static rehydrate(props: AdministrationAssignmentProps) {
    return new AdministrationAssignment({ ...props });
  }

  get id() {
    return this.props.id;
  }

  get administrationId() {
    return this.props.administrationId;
  }

  get startedAt() {
    return this.props.startedAt;
  }

  get endedAt() {
    return this.props.endedAt;
  }

  get isOpen() {
    return this.props.endedAt === null;
  }

  close(at: Date) {
    if (!this.isOpen) {
      throw new InvariantViolationError(
        `Administration assignment ${this.id} is already closed`,
      );
    }
    this.props.endedAt = at;
  }
}
