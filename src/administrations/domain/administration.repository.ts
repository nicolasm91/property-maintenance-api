import { Administration } from './administration.js';

/** Port: persistence of Administration aggregates. */
export interface AdministrationRepository {
  findById(id: string): Promise<Administration | null>;
  findAll(): Promise<Administration[]>;
  exists(id: string): Promise<boolean>;
  save(administration: Administration): Promise<void>;
}

export const ADMINISTRATION_REPOSITORY = Symbol('AdministrationRepository');
