import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../prisma/generated/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { ProfileType } from '../../../users/entities/user.entity.js';
import { AdminUser } from '../../entities/admin-user.entity.js';
import { AdminUsersRepository } from '../admin-users.repository.js';

const adminUserSelect = {
  id: true,
  email: true,
  name: true,
  middleName: true,
  lastName: true,
  role: true,
  createdAt: true,
  propertyManager: { select: { administration: { select: { id: true, name: true } } } },
  contractor: { select: { company: { select: { id: true, name: true } } } },
  tradesman: { select: { _count: { select: { tasks: true } } } },
  _count: { select: { homes: true, createdTasks: true } },
} satisfies Prisma.UserSelect;

type AdminUserRow = Prisma.UserGetPayload<{ select: typeof adminUserSelect }>;

const toAdminUser = ({ propertyManager, contractor, tradesman, _count, ...row }: AdminUserRow): AdminUser => ({
  ...row,
  organization: propertyManager?.administration ?? contractor?.company ?? null,
  homes: _count.homes,
  tasks: _count.createdTasks + (tradesman?._count.tasks ?? 0),
});

@Injectable()
export class PrismaAdminUsersRepository implements AdminUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({ role, search }: { role?: ProfileType; search?: string }): Promise<AdminUser[]> {
    const contains = search ? { contains: search, mode: 'insensitive' as const } : undefined;
    const rows = await this.prisma.user.findMany({
      where: {
        role,
        OR: contains ? [{ email: contains }, { name: contains }, { lastName: contains }] : undefined,
      },
      select: adminUserSelect,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toAdminUser);
  }

  deleteCompletely(id: string): Promise<{ auth0Sub: string } | null> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id },
        select: {
          auth0Sub: true,
          propertyManager: { select: { administrationId: true } },
          contractor: { select: { companyId: true } },
        },
      });
      if (!user) {
        return null;
      }
      const homeIds = (await tx.property.findMany({ where: { directClientId: id }, select: { id: true } })).map(
        (home) => home.id,
      );
      await deleteTasks(tx, { OR: [{ createdById: id }, { tradesmanId: id }, { propertyId: { in: homeIds } }] });
      await tx.taskEvent.deleteMany({ where: { actorId: id } });
      await tx.property.deleteMany({ where: { id: { in: homeIds } } });
      // Cascades to the profile; a contractor's tradesmen become independent.
      await tx.user.delete({ where: { id } });

      const administrationId = user.propertyManager?.administrationId;
      if (administrationId && (await tx.propertyManager.count({ where: { administrationId } })) === 0) {
        await deleteAdministration(tx, administrationId);
      }
      const companyId = user.contractor?.companyId;
      if (companyId && (await tx.contractor.count({ where: { companyId } })) === 0) {
        await tx.company.delete({ where: { id: companyId } });
      }
      return { auth0Sub: user.auth0Sub };
    });
  }
}

type Transaction = Prisma.TransactionClient;

async function deleteTasks(tx: Transaction, where: Prisma.TaskWhereInput) {
  const taskIds = (await tx.task.findMany({ where, select: { id: true } })).map((task) => task.id);
  await tx.taskEvent.deleteMany({ where: { taskId: { in: taskIds } } });
  await tx.task.deleteMany({ where: { id: { in: taskIds } } });
}

// Also deletes the buildings it currently administers, with their history and tasks.
async function deleteAdministration(tx: Transaction, administrationId: string) {
  const propertyIds = (await tx.property.findMany({ where: { administrationId }, select: { id: true } })).map(
    (property) => property.id,
  );
  await deleteTasks(tx, { propertyId: { in: propertyIds } });
  await tx.administrationAssignment.deleteMany({
    where: { OR: [{ administrationId }, { propertyId: { in: propertyIds } }] },
  });
  await tx.property.deleteMany({ where: { id: { in: propertyIds } } });
  await tx.propertyAdministration.delete({ where: { id: administrationId } });
}
