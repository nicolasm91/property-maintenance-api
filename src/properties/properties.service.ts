import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AdministrationsService } from '../administrations/administrations.service.js';
import { MunicipalitiesService } from '../municipalities/municipalities.service.js';
import { AuthUser } from '../auth/auth-user.js';
import { ChangeAdministrationDto } from './dto/change-administration.dto.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { FindPropertiesQueryDto } from './dto/find-properties-query.dto.js';
import { AdministrationAssignment, Property } from './entities/property.entity.js';
import { PropertiesRepository } from './repositories/properties.repository.js';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly properties: PropertiesRepository,
    private readonly administrationsService: AdministrationsService,
    private readonly municipalitiesService: MunicipalitiesService,
  ) {}

  async create(dto: CreatePropertyDto, user: AuthUser): Promise<Property> {
    const administrationId = this.scopeToOwnAdministration(dto.administrationId, user);
    if (administrationId) {
      await this.administrationsService.findOne(administrationId);
    }
    await this.municipalitiesService.assertExist([dto.municipalityId]);
    return this.properties.create({
      propertyType: dto.propertyType,
      address: dto.address,
      municipalityId: dto.municipalityId,
      administrationId: administrationId ?? null,
    });
  }

  async findAll(query: FindPropertiesQueryDto, user: AuthUser): Promise<Property[]> {
    const administrationId = this.scopeToOwnAdministration(query.administrationId, user);
    if (administrationId) {
      await this.administrationsService.findOne(administrationId);
    }
    return this.properties.findAll({ administrationId });
  }

  async findOne(id: string, user: AuthUser): Promise<Property> {
    const property = await this.findOneOrThrow(id);
    if (
      user.role === 'propertyManager' &&
      (!user.administrationId || property.administration?.id !== user.administrationId)
    ) {
      throw new ForbiddenException();
    }
    if (user.role === 'directClient' && property.directClientId !== user.userId) {
      throw new ForbiddenException();
    }
    return property;
  }

  async changeAdministration(id: string, dto: ChangeAdministrationDto): Promise<Property> {
    const property = await this.findOneOrThrow(id);
    if (property.administration?.id === dto.administrationId) {
      throw new ConflictException(`Property ${id} is already assigned to administration ${dto.administrationId}`);
    }
    await this.administrationsService.findOne(dto.administrationId);
    return this.properties.changeAdministration(id, dto.administrationId);
  }

  async findAdministrationHistory(id: string, user: AuthUser): Promise<AdministrationAssignment[]> {
    if (user.role !== 'propertyManager') {
      await this.findOne(id, user);
      return this.properties.findAdministrationHistory(id);
    }
    const property = await this.findOneOrThrow(id);
    if (!user.administrationId) {
      throw new ForbiddenException();
    }
    const history = await this.properties.findAdministrationHistory(id);
    if (property.administration?.id === user.administrationId) {
      return history;
    }
    const ownEnds = history
      .filter((assignment) => assignment.administration.id === user.administrationId && assignment.endedAt)
      .map((assignment) => assignment.endedAt!.getTime());
    if (ownEnds.length === 0) {
      throw new ForbiddenException();
    }
    // A previous administration sees the history only up to when it last stopped
    // managing the building, so the administrations that followed stay hidden.
    const cutoff = Math.max(...ownEnds);
    return history.filter((assignment) => assignment.startedAt.getTime() < cutoff);
  }

  private async findOneOrThrow(id: string) {
    const property = await this.properties.findById(id);
    if (!property) {
      throw new NotFoundException(`Property ${id} not found`);
    }
    return property;
  }

  // Property managers only work on their own administration's buildings; the
  // platform owner can use any administration.
  private scopeToOwnAdministration(administrationId: string | undefined, user: AuthUser) {
    if (user.role !== 'propertyManager') {
      return administrationId;
    }
    if (!user.administrationId) {
      throw new ForbiddenException('Create your administration first');
    }
    if (administrationId && administrationId !== user.administrationId) {
      throw new ForbiddenException();
    }
    return user.administrationId;
  }
}
