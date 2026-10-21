import { Address, AdministrationAssignment, Property, PropertyType } from '../entities/property.entity.js';

export interface CreatePropertyData {
  propertyType: PropertyType;
  address: Address;
  administrationId: string | null;
}

// Abstract class instead of an interface: interfaces don't exist at runtime,
// so Nest couldn't use one as the injection token.
export abstract class PropertiesRepository {
  abstract create(data: CreatePropertyData): Promise<Property>;
  abstract findById(id: string): Promise<Property | null>;
  abstract findAll(filter: { administrationId?: string }): Promise<Property[]>;
  // Must be atomic. Throws ConflictException on a concurrent change.
  abstract changeAdministration(propertyId: string, administrationId: string): Promise<Property>;
  abstract findAdministrationHistory(propertyId: string): Promise<AdministrationAssignment[]>;
}
