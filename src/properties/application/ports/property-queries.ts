import { AddressProps } from '../../domain/address.js';
import { PropertyType } from '../../domain/property-type.js';

export interface AdministrationSummary {
  id: string;
  name: string;
}

export interface PropertyView {
  id: string;
  propertyType: PropertyType;
  address: AddressProps;
  administration: AdministrationSummary | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdministrationAssignmentView {
  id: string;
  administration: AdministrationSummary;
  startedAt: Date;
  endedAt: Date | null;
}

/**
 * Port: read side for properties. Returns views shaped for consumers, so
 * listings don't need to load whole aggregates.
 */
export interface PropertyQueries {
  findById(id: string): Promise<PropertyView | null>;
  findAll(filter?: { administrationId?: string }): Promise<PropertyView[]>;
  /** Newest first. */
  findAdministrationHistory(
    propertyId: string,
  ): Promise<AdministrationAssignmentView[]>;
}

export const PROPERTY_QUERIES = Symbol('PropertyQueries');
