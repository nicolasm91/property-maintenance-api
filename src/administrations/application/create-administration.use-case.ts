import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '../../shared/application/clock.js';
import {
  ID_GENERATOR,
  type IdGenerator,
} from '../../shared/application/id-generator.js';
import { Administration } from '../domain/administration.js';
import {
  ADMINISTRATION_REPOSITORY,
  type AdministrationRepository,
} from '../domain/administration.repository.js';

export interface CreateAdministrationCommand {
  name: string;
}

@Injectable()
export class CreateAdministrationUseCase {
  constructor(
    @Inject(ADMINISTRATION_REPOSITORY)
    private readonly administrations: AdministrationRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator,
  ) {}

  async execute(command: CreateAdministrationCommand) {
    const administration = Administration.create({
      id: this.ids.generate(),
      name: command.name,
      now: this.clock.now(),
    });
    await this.administrations.save(administration);
    return administration;
  }
}
