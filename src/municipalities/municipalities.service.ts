import { BadRequestException, Injectable } from '@nestjs/common';
import { FindMunicipalitiesQueryDto } from './dto/find-municipalities-query.dto.js';
import { Municipality, Province } from './entities/municipality.entity.js';
import { MunicipalitiesRepository } from './repositories/municipalities.repository.js';
import { toSearchName } from './search-name.js';

const MAX_SEARCH_RESULTS = 50;

@Injectable()
export class MunicipalitiesService {
  constructor(private readonly municipalities: MunicipalitiesRepository) {}

  findProvinces(): Promise<Province[]> {
    return this.municipalities.findProvinces();
  }

  // A whole province (at most a few hundred) feeds a picker; searches are capped.
  findAll(query: FindMunicipalitiesQueryDto): Promise<Municipality[]> {
    return this.municipalities.findAll({
      provinceId: query.provinceId,
      searchName: query.search ? toSearchName(query.search) : undefined,
      limit: query.provinceId && !query.search ? undefined : MAX_SEARCH_RESULTS,
    });
  }

  async assertExist(ids: string[]): Promise<void> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) {
      return;
    }
    const existing = new Set(await this.municipalities.findExistingIds(unique));
    const unknown = unique.filter((id) => !existing.has(id));
    if (unknown.length > 0) {
      throw new BadRequestException(`Unknown municipality: ${unknown.join(', ')}`);
    }
  }
}
