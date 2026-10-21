import { Injectable } from '@nestjs/common';
import { ConcurrencyError } from '../../../shared/domain/errors.js';
import {
  Prisma,
  type AdministrationAssignment as AssignmentRow,
  type Property as PropertyRow,
} from '../../../shared/infrastructure/persistence/prisma/generated/client.js';
import { PrismaService } from '../../../shared/infrastructure/persistence/prisma/prisma.service.js';
import { Address } from '../../domain/address.js';
import { AdministrationAssignment } from '../../domain/administration-assignment.js';
import { Property } from '../../domain/property.js';
import { PropertyRepository } from '../../domain/property.repository.js';

const toDomain = (row: PropertyRow & { assignments: AssignmentRow[] }) =>
  Property.rehydrate({
    id: row.id,
    type: row.propertyType,
    address: Address.create({
      street: row.addressStreet,
      number: row.addressNumber,
      postalCode: row.addressPostalCode,
      intersection: row.addressIntersection,
    }),
    assignments: row.assignments.map((a) =>
      AdministrationAssignment.rehydrate({
        id: a.id,
        administrationId: a.administrationId,
        startedAt: a.startedAt,
        endedAt: a.endedAt,
      }),
    ),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });

@Injectable()
export class PrismaPropertyRepository implements PropertyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const row = await this.prisma.property.findUnique({
      where: { id },
      include: { assignments: { orderBy: { startedAt: 'asc' } } },
    });
    return row ? toDomain(row) : null;
  }

  async save(property: Property) {
    const data = {
      propertyType: property.type,
      addressStreet: property.address.street,
      addressNumber: property.address.number,
      addressPostalCode: property.address.postalCode,
      addressIntersection: property.address.intersection,
      // Denormalized copy of the open assignment, for cheap reads.
      administrationId: property.administrationId,
      updatedAt: property.updatedAt,
    };

    // Assignments are upserted in history order, so the previous one is closed
    // before the new one is opened (see the partial unique index in the
    // first migration).
    try {
      await this.prisma.$transaction([
        this.prisma.property.upsert({
          where: { id: property.id },
          create: { id: property.id, createdAt: property.createdAt, ...data },
          update: data,
        }),
        ...property.assignments.map((assignment) =>
          this.prisma.administrationAssignment.upsert({
            where: { id: assignment.id },
            create: {
              id: assignment.id,
              propertyId: property.id,
              administrationId: assignment.administrationId,
              startedAt: assignment.startedAt,
              endedAt: assignment.endedAt,
            },
            update: { endedAt: assignment.endedAt },
          }),
        ),
      ]);
    } catch (error) {
      // Another transaction opened an assignment for this property after we
      // loaded it: the one-open-assignment index rejected ours.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConcurrencyError(
          `Property ${property.id} was modified concurrently, retry`,
        );
      }
      throw error;
    }
  }
}
