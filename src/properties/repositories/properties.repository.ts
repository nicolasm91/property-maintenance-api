import {
  Address,
  AdministrationAssignment,
  Property,
  PropertyType,
} from '../entities/property.entity.js';

export interface CreatePropertyData {
  propertyType: PropertyType;
  address: Address;
  administrationId: string | null;
}

// Contract that services depend on, never a concrete database. It is an
// abstract class (not an interface) so Nest can use it as the injection
// token; the implementation is bound in PropertiesModule.
export abstract class PropertiesRepository {
  /** Creates the property and, if it has an administration, its first assignment, atomically. */
  abstract create(data: CreatePropertyData): Promise<Property>;
  abstract findById(id: string): Promise<Property | null>;
  abstract findAll(filter: { administrationId?: string }): Promise<Property[]>;
  /**
   * Atomically closes the current assignment, opens a new one and updates the
   * property's current administration. Throws ConflictException if another
   * change on the same property happened concurrently.
   */
  abstract changeAdministration(
    propertyId: string,
    administrationId: string,
  ): Promise<Property>;
  /** Newest first. */
  abstract findAdministrationHistory(
    propertyId: string,
  ): Promise<AdministrationAssignment[]>;
}
