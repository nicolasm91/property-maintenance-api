import { Inject, Injectable } from '@nestjs/common';
import { AdministrationNotFoundError } from '../../administrations/domain/administration.errors.js';
import {
  ADMINISTRATION_REPOSITORY,
  type AdministrationRepository,
} from '../../administrations/domain/administration.repository.js';
import {
  PROPERTY_QUERIES,
  type PropertyQueries,
} from './ports/property-queries.js';

@Injectable()
export class ListPropertiesUseCase {
  constructor(
    @Inject(PROPERTY_QUERIES) private readonly queries: PropertyQueries,
    @Inject(ADMINISTRATION_REPOSITORY)
    private readonly administrations: AdministrationRepository,
  ) {}

  async execute(filter: { administrationId?: string } = {}) {
    const { administrationId } = filter;
    if (
      administrationId &&
      !(await this.administrations.exists(administrationId))
    ) {
      throw new AdministrationNotFoundError(administrationId);
    }
    return this.queries.findAll(filter);
  }
}
