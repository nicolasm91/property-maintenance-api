import { Trade } from '../../users/entities/user.entity.js';
import { Task, TaskEvent, TaskStatus } from '../entities/task.entity.js';

export interface CreateTaskData {
  title: string;
  description: string;
  trade: Trade;
  scheduledAt: Date;
  createdById: string;
  tradesmanId: string;
  propertyId: string;
}

export interface TaskFilter {
  createdById?: string;
  tradesmanId?: string;
  excludeStatuses?: readonly TaskStatus[];
  from?: Date;
  to?: Date;
}

export interface StatusChange {
  from: readonly TaskStatus[];
  to: 'completed' | 'cancelled' | 'rejected';
  actorId: string;
  reason: string | null;
}

export abstract class TasksRepository {
  // Creates the task already assigned, with its `created` event, atomically.
  // Throws ConflictException if the tradesman already has the slot taken.
  abstract create(data: CreateTaskData): Promise<Task>;
  abstract findById(id: string): Promise<Task | null>;
  abstract findAll(filter: TaskFilter): Promise<Task[]>;
  // Records the matching event atomically. Throws ConflictException if the
  // task is no longer in one of the `from` statuses (a concurrent change).
  abstract changeStatus(id: string, change: StatusChange): Promise<Task>;
  abstract findEvents(taskId: string): Promise<TaskEvent[]>;
}
