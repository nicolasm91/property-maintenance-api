import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { Administration } from '../../entities/administration.entity.js';
import { AdministrationsRepository } from '../administrations.repository.js';

@Injectable()
export class PrismaAdministrationsRepository implements AdministrationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { name: string }): Promise<Administration> {
    return this.prisma.propertyAdministration.create({ data });
  }

  findById(id: string): Promise<Administration | null> {
    return this.prisma.propertyAdministration.findUnique({ where: { id } });
  }

  findAll(): Promise<Administration[]> {
    return this.prisma.propertyAdministration.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
