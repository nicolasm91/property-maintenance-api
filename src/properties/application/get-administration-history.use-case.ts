import { Inject, Injectable } from '@nestjs/common';
import { PropertyNotFoundError } from '../domain/property.errors.js';
import {
  PROPERTY_QUERIES,
  type PropertyQueries,
} from './ports/property-queries.js';

@Injectable()
export class GetAdministrationHistoryUseCase {
  constructor(
    @Inject(PROPERTY_QUERIES) private readonly queries: PropertyQueries,
  ) {}

  async execute(propertyId: string) {
    if (!(await this.queries.findById(propertyId))) {
      throw new PropertyNotFoundError(propertyId);
    }
    return this.queries.findAdministrationHistory(propertyId);
  }
}
