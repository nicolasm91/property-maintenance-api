import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAdministrationDto } from './dto/create-administration.dto.js';
import { AdministrationsRepository } from './repositories/administrations.repository.js';

@Injectable()
export class AdministrationsService {
  constructor(private readonly administrations: AdministrationsRepository) {}

  create(dto: CreateAdministrationDto) {
    return this.administrations.create({ name: dto.name });
  }

  findAll() {
    return this.administrations.findAll();
  }

  async findOne(id: string) {
    const administration = await this.administrations.findById(id);
    if (!administration) {
      throw new NotFoundException(`Administration ${id} not found`);
    }
    return administration;
  }
}
