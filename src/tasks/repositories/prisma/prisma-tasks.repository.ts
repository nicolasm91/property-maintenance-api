import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../../../prisma/generated/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { Task, TaskEvent } from '../../entities/task.entity.js';
import { CreateTaskData, StatusChange, TaskFilter, TasksRepository } from '../tasks.repository.js';

const personSummary = { select: { id: true, name: true, middleName: true, lastName: true } } as const;

const taskInclude = {
  property: {
    select: {
      id: true,
      addressStreet: true,
      addressNumber: true,
      addressPostalCode: true,
      addressIntersection: true,
    },
  },
  createdBy: personSummary,
  tradesman: { select: { user: personSummary } },
} satisfies Prisma.TaskInclude;

type TaskRow = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

const toTask = ({ property, tradesman, createdById: _c, tradesmanId: _t, propertyId: _p, ...row }: TaskRow): Task => ({
  ...row,
  property: {
    id: property.id,
    address: {
      street: property.addressStreet,
      number: property.addressNumber,
      postalCode: property.addressPostalCode,
      intersection: property.addressIntersection,
    },
  },
  tradesman: tradesman?.user ?? null,
});

@Injectable()
export class PrismaTasksRepository implements TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create({ createdById, tradesmanId, ...data }: CreateTaskData): Promise<Task> {
    try {
      // A nested create runs in a single transaction.
      const row = await this.prisma.task.create({
        data: {
          ...data,
          status: 'assigned',
          createdById,
          tradesmanId,
          events: { create: { type: 'created', actorId: createdById, tradesmanId } },
        },
        include: taskInclude,
      });
      return toTask(row);
    } catch (error) {
      // The partial unique index on the tradesman's active slots rejected it,
      // also when two bookings of the same slot race.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('The tradesman already has that slot taken');
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Task | null> {
    const row = await this.prisma.task.findUnique({ where: { id }, include: taskInclude });
    return row ? toTask(row) : null;
  }

  async findAll({ createdById, tradesmanId, excludeStatuses, from, to }: TaskFilter): Promise<Task[]> {
    const rows = await this.prisma.task.findMany({
      where: {
        createdById,
        tradesmanId,
        status: excludeStatuses ? { notIn: [...excludeStatuses] } : undefined,
        scheduledAt: { gte: from, lt: to },
      },
      include: taskInclude,
      orderBy: { scheduledAt: 'asc' },
    });
    return rows.map(toTask);
  }

  changeStatus(id: string, { from, to, actorId, reason }: StatusChange): Promise<Task> {
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      // Guarding on the status makes concurrent changes fail instead of both
      // succeeding (e.g. completing and cancelling the same task).
      const { count } = await tx.task.updateMany({
        where: { id, status: { in: [...from] } },
        data: {
          status: to,
          completedAt: to === 'completed' ? now : undefined,
          cancelledAt: to === 'cancelled' ? now : undefined,
        },
      });
      if (count === 0) {
        throw new ConflictException(`Task ${id} was changed concurrently, retry`);
      }
      const row = await tx.task.findUniqueOrThrow({ where: { id }, include: taskInclude });
      await tx.taskEvent.create({
        data: { taskId: id, type: to, actorId, tradesmanId: row.tradesmanId, reason, occurredAt: now },
      });
      return toTask(row);
    });
  }

  async findEvents(taskId: string): Promise<TaskEvent[]> {
    const rows = await this.prisma.taskEvent.findMany({
      where: { taskId },
      select: { id: true, type: true, actor: personSummary, tradesmanId: true, reason: true, occurredAt: true },
      orderBy: { occurredAt: 'asc' },
    });
    return rows;
  }
}
