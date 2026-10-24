import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '../auth/auth-user.js';
import { PropertiesService } from '../properties/properties.service.js';
import { TradesmenService } from '../tradesmen/tradesmen.service.js';
import { CancelTaskDto } from './dto/cancel-task.dto.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { FindTasksQueryDto } from './dto/find-tasks-query.dto.js';
import { RejectTaskDto } from './dto/reject-task.dto.js';
import { INACTIVE_STATUSES, Task, TaskEvent, TaskStatus } from './entities/task.entity.js';
import { TasksRepository } from './repositories/tasks.repository.js';
import { isFutureSlotStart } from './slots.js';

export type DirectClient = AuthUser & { role: 'directClient' };
export type TradesmanUser = AuthUser & { role: 'tradesman' };

@Injectable()
export class TasksService {
  constructor(
    private readonly tasks: TasksRepository,
    private readonly tradesmenService: TradesmenService,
    private readonly propertiesService: PropertiesService,
  ) {}

  async create(dto: CreateTaskDto, user: DirectClient): Promise<Task> {
    const scheduledAt = new Date(dto.scheduledAt);
    if (!isFutureSlotStart(scheduledAt)) {
      throw new BadRequestException('scheduledAt must be the start of a future slot');
    }
    const tradesman = await this.tradesmenService.findBookable(dto.tradesmanId);
    if (!tradesman.trades.includes(dto.trade)) {
      throw new BadRequestException(`Tradesman ${dto.tradesmanId} does not work as ${dto.trade}`);
    }
    // Also checks that the property is one of the caller's homes.
    await this.propertiesService.findOne(dto.propertyId, user);
    return this.tasks.create({
      title: dto.title,
      description: dto.description,
      trade: dto.trade,
      scheduledAt,
      createdById: user.userId,
      tradesmanId: dto.tradesmanId,
      propertyId: dto.propertyId,
    });
  }

  findAll(query: FindTasksQueryDto, user: DirectClient | TradesmanUser): Promise<Task[]> {
    const range = {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    };
    if (user.role === 'tradesman') {
      return this.tasks.findAll({ ...range, tradesmanId: user.userId, excludeStatuses: INACTIVE_STATUSES });
    }
    return this.tasks.findAll({ ...range, createdById: user.userId });
  }

  async complete(id: string, user: TradesmanUser): Promise<Task> {
    const task = await this.findOneOrThrow(id);
    if (task.tradesman?.id !== user.userId) {
      throw new ForbiddenException();
    }
    assertStatus(task, ['assigned']);
    return this.tasks.changeStatus(id, { from: ['assigned'], to: 'completed', actorId: user.userId, reason: null });
  }

  async reject(id: string, dto: RejectTaskDto, user: TradesmanUser): Promise<Task> {
    const task = await this.findOneOrThrow(id);
    if (task.tradesman?.id !== user.userId) {
      throw new ForbiddenException();
    }
    assertStatus(task, ['assigned']);
    return this.tasks.changeStatus(id, {
      from: ['assigned'],
      to: 'rejected',
      actorId: user.userId,
      reason: dto.reason || null,
    });
  }

  async cancel(id: string, dto: CancelTaskDto, user: DirectClient): Promise<Task> {
    const task = await this.findOneOrThrow(id);
    if (task.createdBy.id !== user.userId) {
      throw new ForbiddenException();
    }
    const cancellable: TaskStatus[] = ['unassigned', 'assigned'];
    assertStatus(task, cancellable);
    return this.tasks.changeStatus(id, {
      from: cancellable,
      to: 'cancelled',
      actorId: user.userId,
      reason: dto.reason,
    });
  }

  async findEvents(id: string, user: DirectClient | TradesmanUser): Promise<TaskEvent[]> {
    const task = await this.findOneOrThrow(id);
    if (task.createdBy.id !== user.userId && task.tradesman?.id !== user.userId) {
      throw new ForbiddenException();
    }
    return this.tasks.findEvents(id);
  }

  private async findOneOrThrow(id: string) {
    const task = await this.tasks.findById(id);
    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    return task;
  }
}

function assertStatus(task: Task, allowed: TaskStatus[]) {
  if (!allowed.includes(task.status)) {
    throw new ConflictException(`Task ${task.id} is ${task.status}`);
  }
}
