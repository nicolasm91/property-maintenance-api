import { Administration } from '../../domain/administration.js';

export const toAdministrationResponse = (administration: Administration) => ({
  id: administration.id,
  name: administration.name,
  createdAt: administration.createdAt,
  updatedAt: administration.updatedAt,
});
