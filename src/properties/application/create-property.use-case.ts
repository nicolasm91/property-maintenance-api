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
import { Address, AddressProps } from '../domain/address.js';
import { Property } from '../domain/property.js';
import {
  PROPERTY_REPOSITORY,
  type PropertyRepository,
} from '../domain/property.repository.js';
import { PropertyType } from '../domain/property-type.js';

export interface CreatePropertyCommand {
  propertyType: PropertyType;
  address: AddressProps;
  administrationId?: string;
}

@Injectable()
export class CreatePropertyUseCase {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly properties: PropertyRepository,
    @Inject(ADMINISTRATION_REPOSITORY)
    private readonly administrations: AdministrationRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator,
  ) {}

  /** Returns the id of the new property. */
  async execute(command: CreatePropertyCommand) {
    const now = this.clock.now();
    const property = Property.create({
      id: this.ids.generate(),
      type: command.propertyType,
      address: Address.create(command.address),
      now,
    });

    const { administrationId } = command;
    if (administrationId) {
      if (!(await this.administrations.exists(administrationId))) {
        throw new AdministrationNotFoundError(administrationId);
      }
      property.assignAdministration({
        administrationId,
        assignmentId: this.ids.generate(),
        at: now,
      });
    }

    await this.properties.save(property);
    return property.id;
  }
}
