export const PROPERTY_TYPES = ['house', 'building'] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];
