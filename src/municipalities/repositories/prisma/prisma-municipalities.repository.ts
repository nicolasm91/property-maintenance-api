import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { Municipality, Province } from '../../entities/municipality.entity.js';
import { MunicipalitiesRepository } from '../municipalities.repository.js';

const municipalitySelect = { id: true, name: true, provinceId: true, provinceName: true } as const;

@Injectable()
export class PrismaMunicipalitiesRepository implements MunicipalitiesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findProvinces(): Promise<Province[]> {
    const rows = await this.prisma.municipality.findMany({
      distinct: ['provinceId'],
      select: { provinceId: true, provinceName: true },
      orderBy: { provinceId: 'asc' },
    });
    return rows
      .map(({ provinceId, provinceName }) => ({ id: provinceId, name: provinceName }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  findAll({
    provinceId,
    searchName,
    limit,
  }: {
    provinceId?: string;
    searchName?: string;
    limit?: number;
  }): Promise<Municipality[]> {
    return this.prisma.municipality.findMany({
      where: { provinceId, searchName: searchName ? { contains: searchName } : undefined },
      select: municipalitySelect,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      take: limit,
    });
  }

  async findExistingIds(ids: string[]): Promise<string[]> {
    const rows = await this.prisma.municipality.findMany({ where: { id: { in: ids } }, select: { id: true } });
    return rows.map((row) => row.id);
  }
}
