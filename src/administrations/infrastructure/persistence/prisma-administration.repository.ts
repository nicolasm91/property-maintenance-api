import { Injectable } from '@nestjs/common';
import type { PropertyAdministration as AdministrationRow } from '../../../shared/infrastructure/persistence/prisma/generated/client.js';
import { PrismaService } from '../../../shared/infrastructure/persistence/prisma/prisma.service.js';
import { Administration } from '../../domain/administration.js';
import { AdministrationRepository } from '../../domain/administration.repository.js';

const toDomain = (row: AdministrationRow) => Administration.rehydrate(row);

@Injectable()
export class PrismaAdministrationRepository implements AdministrationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const row = await this.prisma.propertyAdministration.findUnique({
      where: { id },
    });
    return row ? toDomain(row) : null;
  }

  async findAll() {
    const rows = await this.prisma.propertyAdministration.findMany({
      orderBy: { name: 'asc' },
    });
    return rows.map(toDomain);
  }

  async exists(id: string) {
    return (
      (await this.prisma.propertyAdministration.count({ where: { id } })) > 0
    );
  }

  async save(administration: Administration) {
    const data = {
      name: administration.name,
      updatedAt: administration.updatedAt,
    };
    await this.prisma.propertyAdministration.upsert({
      where: { id: administration.id },
      create: {
        id: administration.id,
        createdAt: administration.createdAt,
        ...data,
      },
      update: data,
    });
  }
}
