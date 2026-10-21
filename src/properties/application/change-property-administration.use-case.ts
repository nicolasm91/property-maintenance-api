import { Inject, Injectable } from '@nestjs/common';
import { AdministrationNotFoundError } from '../../administrations/domain/administration.errors.js';
import {
  ADMINISTRATION_REPOSITORY,
  type AdministrationRepository,
} from '../../administrations/domain/administration.repository.js';
import { CLOCK, type Clock } from '../../shared/application/clock.js';
import {
  ID_GENERATOR,
  type IdGenerator,
} from '../../shared/application/id-generator.js';
import { PropertyNotFoundError } from '../domain/property.errors.js';
import {
  PROPERTY_REPOSITORY,
  type PropertyRepository,
} from '../domain/property.repository.js';

export interface ChangePropertyAdministrationCommand {
  propertyId: string;
  administrationId: string;
}

@Injectable()
export class ChangePropertyAdministrationUseCase {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly properties: PropertyRepository,
    @Inject(ADMINISTRATION_REPOSITORY)
    private readonly administrations: AdministrationRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator,
  ) {}

  async execute(command: ChangePropertyAdministrationCommand) {
    const property = await this.properties.findById(command.propertyId);
    if (!property) throw new PropertyNotFoundError(command.propertyId);
    if (!(await this.administrations.exists(command.administrationId))) {
      throw new AdministrationNotFoundError(command.administrationId);
    }

    property.assignAdministration({
      administrationId: command.administrationId,
      assignmentId: this.ids.generate(),
      at: this.clock.now(),
    });
    await this.properties.save(property);
  }
}
