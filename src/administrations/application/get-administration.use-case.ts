import { Inject, Injectable } from '@nestjs/common';
import { AdministrationNotFoundError } from '../domain/administration.errors.js';
import {
  ADMINISTRATION_REPOSITORY,
  type AdministrationRepository,
} from '../domain/administration.repository.js';

@Injectable()
export class GetAdministrationUseCase {
  constructor(
    @Inject(ADMINISTRATION_REPOSITORY)
    private readonly administrations: AdministrationRepository,
  ) {}

  async execute(id: string) {
    const administration = await this.administrations.findById(id);
    if (!administration) throw new AdministrationNotFoundError(id);
    return administration;
  }
}
