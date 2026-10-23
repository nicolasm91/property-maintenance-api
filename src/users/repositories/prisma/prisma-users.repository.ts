import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../../../prisma/generated/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { User } from '../../entities/user.entity.js';
import { CreateUserData, NewProfile, UsersRepository } from '../users.repository.js';

const summary = { select: { id: true, name: true } } as const;

const userInclude = {
  propertyManager: { include: { administration: summary } },
  contractor: { include: { company: summary } },
  tradesman: true,
} satisfies Prisma.UserInclude;

type UserRow = Prisma.UserGetPayload<{ include: typeof userInclude }>;

const toUser = ({ propertyManager, contractor, tradesman, auth0Sub: _auth0Sub, ...row }: UserRow): User => {
  switch (row.role) {
    case 'propertyManager':
      return {
        ...row,
        role: row.role,
        administration: propertyManager!.administration,
        administrationRole: propertyManager!.administrationRole,
      };
    case 'contractor':
      return { ...row, role: row.role, company: contractor!.company };
    case 'tradesman':
      return { ...row, role: row.role, trades: tradesman!.trades, contractorId: tradesman!.contractorId };
    case 'directClient':
      return { ...row, role: row.role };
  }
};

const profileData = (profile: NewProfile): Omit<Prisma.UserCreateInput, 'auth0Sub' | 'email' | 'name' | 'lastName'> => {
  switch (profile.role) {
    case 'propertyManager':
      return {
        role: profile.role,
        propertyManager: {
          create: {
            administrationRole: 'admin',
            administration: { create: { name: profile.administrationName } },
          },
        },
      };
    case 'contractor':
      return {
        role: profile.role,
        contractor: { create: { company: { create: { name: profile.companyName } } } },
      };
    case 'tradesman':
      return { role: profile.role, tradesman: { create: { trades: profile.trades } } };
  }
};

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByAuth0Sub(auth0Sub: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { auth0Sub }, include: userInclude });
    return row ? toUser(row) : null;
  }

  async create({ profile, ...data }: CreateUserData): Promise<User> {
    try {
      // A nested create runs in a single transaction.
      const row = await this.prisma.user.create({
        data: { ...data, ...profileData(profile) },
        include: userInclude,
      });
      return toUser(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A User with this account or email already exists');
      }
      throw error;
    }
  }
}
