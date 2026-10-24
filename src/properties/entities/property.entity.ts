export const PROPERTY_TYPES = ['house', 'building'] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export interface Address {
  street: string;
  number: string;
  postalCode: string;
  intersection: string;
}

export interface AdministrationSummary {
  id: string;
  name: string;
}

export interface Property {
  id: string;
  propertyType: PropertyType;
  address: Address;
  administration: AdministrationSummary | null;
  directClientId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdministrationAssignment {
  id: string;
  administration: AdministrationSummary;
  startedAt: Date;
  endedAt: Date | null;
}
