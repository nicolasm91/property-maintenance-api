import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../shared/infrastructure/persistence/prisma/generated/client.js';
import { PrismaService } from '../../../shared/infrastructure/persistence/prisma/prisma.service.js';
import {
  PropertyQueries,
  PropertyView,
} from '../../application/ports/property-queries.js';

const administrationSummary = { select: { id: true, name: true } } as const;

const viewInclude = {
  administration: administrationSummary,
} satisfies Prisma.PropertyInclude;

type ViewRow = Prisma.PropertyGetPayload<{ include: typeof viewInclude }>;

const toView = (row: ViewRow): PropertyView => ({
  id: row.id,
  propertyType: row.propertyType,
  address: {
    street: row.addressStreet,
    number: row.addressNumber,
    postalCode: row.addressPostalCode,
    intersection: row.addressIntersection,
  },
  administration: row.administration,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

@Injectable()
export class PrismaPropertyQueries implements PropertyQueries {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const row = await this.prisma.property.findUnique({
      where: { id },
      include: viewInclude,
    });
    return row ? toView(row) : null;
  }

  async findAll(filter: { administrationId?: string } = {}) {
    const rows = await this.prisma.property.findMany({
      where: { administrationId: filter.administrationId },
      include: viewInclude,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toView);
  }

  findAdministrationHistory(propertyId: string) {
    return this.prisma.administrationAssignment.findMany({
      where: { propertyId },
      select: {
        id: true,
        startedAt: true,
        endedAt: true,
        administration: administrationSummary,
      },
      orderBy: { startedAt: 'desc' },
    });
  }
}
