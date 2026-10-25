import { Municipality, Province } from '../entities/municipality.entity.js';

export abstract class MunicipalitiesRepository {
  abstract findProvinces(): Promise<Province[]>;
  // `searchName` is already lowercased and without accents. By name, at most `limit` if given.
  abstract findAll(filter: { provinceId?: string; searchName?: string; limit?: number }): Promise<Municipality[]>;
  abstract findExistingIds(ids: string[]): Promise<string[]>;
}
