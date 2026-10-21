import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { AdministrationsRepository } from '../administrations.repository.js';

@Injectable()
export class PrismaAdministrationsRepository implements AdministrationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { name: string }) {
    return this.prisma.propertyAdministration.create({ data });
  }

  findById(id: string) {
    return this.prisma.propertyAdministration.findUnique({ where: { id } });
  }

  findAll() {
    return this.prisma.propertyAdministration.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
