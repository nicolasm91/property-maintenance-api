import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AdministrationsService } from '../administrations/administrations.service.js';
import { ChangeAdministrationDto } from './dto/change-administration.dto.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { FindPropertiesQueryDto } from './dto/find-properties-query.dto.js';
import { PropertiesRepository } from './repositories/properties.repository.js';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly properties: PropertiesRepository,
    private readonly administrationsService: AdministrationsService,
  ) {}

  async create(dto: CreatePropertyDto) {
    if (dto.administrationId) {
      await this.administrationsService.findOne(dto.administrationId);
    }
    return this.properties.create({
      propertyType: dto.propertyType,
      address: dto.address,
      administrationId: dto.administrationId ?? null,
    });
  }

  async findAll(query: FindPropertiesQueryDto) {
    if (query.administrationId) {
      await this.administrationsService.findOne(query.administrationId);
    }
    return this.properties.findAll({
      administrationId: query.administrationId,
    });
  }

  async findOne(id: string) {
    const property = await this.properties.findById(id);
    if (!property) {
      throw new NotFoundException(`Property ${id} not found`);
    }
    return property;
  }

  async changeAdministration(id: string, dto: ChangeAdministrationDto) {
    const property = await this.findOne(id);
    if (property.administration?.id === dto.administrationId) {
      throw new ConflictException(
        `Property ${id} is already assigned to administration ${dto.administrationId}`,
      );
    }
    await this.administrationsService.findOne(dto.administrationId);
    return this.properties.changeAdministration(id, dto.administrationId);
  }

  async findAdministrationHistory(id: string) {
    await this.findOne(id);
    return this.properties.findAdministrationHistory(id);
  }
}
