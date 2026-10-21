import { Inject, Injectable } from '@nestjs/common';
import {
  ADMINISTRATION_REPOSITORY,
  type AdministrationRepository,
} from '../domain/administration.repository.js';

@Injectable()
export class ListAdministrationsUseCase {
  constructor(
    @Inject(ADMINISTRATION_REPOSITORY)
    private readonly administrations: AdministrationRepository,
  ) {}

  execute() {
    return this.administrations.findAll();
  }
}
