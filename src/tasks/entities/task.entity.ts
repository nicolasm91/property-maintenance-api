import { Address } from '../../properties/entities/property.entity.js';
import { Trade } from '../../users/entities/user.entity.js';

export const TASK_STATUSES = ['unassigned', 'assigned', 'done', 'completed', 'cancelled', 'rejected'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

// Tasks in these statuses don't take their tradesman's slot and leave their agenda.
export const INACTIVE_STATUSES = ['cancelled', 'rejected'] as const satisfies TaskStatus[];

export const TASK_EVENT_TYPES = [
  'created',
  'assigned',
  'reassigned',
  'rejected',
  'rescheduled',
  'done',
  'completed',
  'cancelled',
] as const;

export type TaskEventType = (typeof TASK_EVENT_TYPES)[number];

export class PersonSummary {
  id: string;
  name: string;
  middleName: string | null;
  lastName: string;
}

export class TaskProperty {
  id: string;
  address: Address;
}

export class Task {
  id: string;
  title: string;
  description: string;
  trade: Trade;
  status: TaskStatus;
  scheduledAt: Date;
  doneAt: Date | null;
  completedAt: Date | null;
  // 1 to 5, given by the requester when confirming the work.
  rating: number | null;
  cancelledAt: Date | null;
  property: TaskProperty;
  createdBy: PersonSummary;
  tradesman: PersonSummary | null;
  createdAt: Date;
  updatedAt: Date;
}

export class TaskEvent {
  id: string;
  type: TaskEventType;
  actor: PersonSummary;
  tradesmanId: string | null;
  reason: string | null;
  rating: number | null;
  occurredAt: Date;
}
