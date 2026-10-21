export const PROPERTY_TYPES = ['house', 'building'] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export interface Address {
  street: string;
  number: string;
  postalCode: string;
  /** Nearest cross streets. */
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
  /** Current administration, if any. */
  administration: AdministrationSummary | null;
  createdAt: Date;
  updatedAt: Date;
}

/** A period in which a property was administered by one administration. */
export interface AdministrationAssignment {
  id: string;
  administration: AdministrationSummary;
  startedAt: Date;
  /** Null while the assignment is current. */
  endedAt: Date | null;
}
