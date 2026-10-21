import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../../../prisma/generated/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import {
  AdministrationAssignment,
  Property,
} from '../../entities/property.entity.js';
import {
  CreatePropertyData,
  PropertiesRepository,
} from '../properties.repository.js';

const administrationSummary = { select: { id: true, name: true } } as const;

const propertyInclude = {
  administration: administrationSummary,
} satisfies Prisma.PropertyInclude;

type PropertyRow = Prisma.PropertyGetPayload<{
  include: typeof propertyInclude;
}>;

const toProperty = (row: PropertyRow): Property => ({
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
export class PrismaPropertiesRepository implements PropertiesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create({
    propertyType,
    address,
    administrationId,
  }: CreatePropertyData): Promise<Property> {
    const row = await this.prisma.property.create({
      data: {
        propertyType,
        addressStreet: address.street,
        addressNumber: address.number,
        addressPostalCode: address.postalCode,
        addressIntersection: address.intersection,
        administrationId,
        assignments: administrationId
          ? { create: { administrationId } }
          : undefined,
      },
      include: propertyInclude,
    });
    return toProperty(row);
  }

  async findById(id: string): Promise<Property | null> {
    const row = await this.prisma.property.findUnique({
      where: { id },
      include: propertyInclude,
    });
    return row ? toProperty(row) : null;
  }

  async findAll(filter: { administrationId?: string }): Promise<Property[]> {
    const rows = await this.prisma.property.findMany({
      where: { administrationId: filter.administrationId },
      include: propertyInclude,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toProperty);
  }

  async changeAdministration(
    propertyId: string,
    administrationId: string,
  ): Promise<Property> {
    const now = new Date();
    try {
      const [, , row] = await this.prisma.$transaction([
        this.prisma.administrationAssignment.updateMany({
          where: { propertyId, endedAt: null },
          data: { endedAt: now },
        }),
        this.prisma.administrationAssignment.create({
          data: { propertyId, administrationId, startedAt: now },
        }),
        this.prisma.property.update({
          where: { id: propertyId },
          data: { administrationId },
          include: propertyInclude,
        }),
      ]);
      return toProperty(row);
    } catch (error) {
      // A concurrent change already opened an assignment for this property and
      // the partial unique index on open assignments rejected ours.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `The administration of property ${propertyId} was changed concurrently, retry`,
        );
      }
      throw error;
    }
  }

  findAdministrationHistory(
    propertyId: string,
  ): Promise<AdministrationAssignment[]> {
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
