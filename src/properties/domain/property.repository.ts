import { Property } from './property.js';

/**
 * Port: persistence of Property aggregates. `save` must persist the property
 * and its assignment history atomically, and throw ConcurrencyError if a
 * concurrent change made the aggregate stale.
 */
export interface PropertyRepository {
  findById(id: string): Promise<Property | null>;
  save(property: Property): Promise<void>;
}

export const PROPERTY_REPOSITORY = Symbol('PropertyRepository');
