import { Inject, Injectable } from '@nestjs/common';
import { PropertyNotFoundError } from '../domain/property.errors.js';
import {
  PROPERTY_QUERIES,
  type PropertyQueries,
} from './ports/property-queries.js';

@Injectable()
export class GetPropertyUseCase {
  constructor(
    @Inject(PROPERTY_QUERIES) private readonly queries: PropertyQueries,
  ) {}

  async execute(id: string) {
    const property = await this.queries.findById(id);
    if (!property) throw new PropertyNotFoundError(id);
    return property;
  }
}
