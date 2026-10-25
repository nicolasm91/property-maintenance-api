export const PROPERTY_TYPES = ['house', 'building'] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

import { MunicipalitySummary } from '../../municipalities/entities/municipality.entity.js';

export class Address {
  street: string;
  number: string;
  postalCode: string;
  intersection: string;
}

export class AdministrationSummary {
  id: string;
  name: string;
}

export class Property {
  id: string;
  propertyType: PropertyType;
  address: Address;
  administration: AdministrationSummary | null;
  directClientId: string | null;
  // Null only on properties created before municipalities existed.
  municipality: MunicipalitySummary | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AdministrationAssignment {
  id: string;
  administration: AdministrationSummary;
  startedAt: Date;
  endedAt: Date | null;
}
