export const PROPERTY_TYPES = ['house', 'building'] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

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
  createdAt: Date;
  updatedAt: Date;
}

export class AdministrationAssignment {
  id: string;
  administration: AdministrationSummary;
  startedAt: Date;
  endedAt: Date | null;
}
