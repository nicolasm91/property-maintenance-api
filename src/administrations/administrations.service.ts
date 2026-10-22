import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../auth/auth-user.js';
import { Administration } from './entities/administration.entity.js';
import { CreateAdministrationDto } from './dto/create-administration.dto.js';
import { AdministrationsRepository } from './repositories/administrations.repository.js';

@Injectable()
export class AdministrationsService {
  constructor(private readonly administrations: AdministrationsRepository) {}

  create(dto: CreateAdministrationDto): Promise<Administration> {
    return this.administrations.create({ name: dto.name });
  }

  findAll(): Promise<Administration[]> {
    return this.administrations.findAll();
  }

  async findOne(id: string): Promise<Administration> {
    const administration = await this.administrations.findById(id);
    if (!administration) {
      throw new NotFoundException(`Administration ${id} not found`);
    }
    return administration;
  }

  async findOneForUser(id: string, user: AuthUser): Promise<Administration> {
    if (user.role !== 'platformOwner' && !(user.role === 'propertyManager' && user.administrationId === id)) {
      throw new ForbiddenException();
    }
    return this.findOne(id);
  }
}
