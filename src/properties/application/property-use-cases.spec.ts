import { Administration } from '../../administrations/domain/administration.js';
import { AdministrationNotFoundError } from '../../administrations/domain/administration.errors.js';
import { InMemoryAdministrationRepository } from '../../administrations/infrastructure/persistence/in-memory-administration.repository.js';
import { Clock } from '../../shared/application/clock.js';
import { IdGenerator } from '../../shared/application/id-generator.js';
import {
  PropertyAlreadyAssignedError,
  PropertyNotFoundError,
} from '../domain/property.errors.js';
import { InMemoryPropertyRepository } from '../infrastructure/persistence/in-memory-property.repository.js';
import { ChangePropertyAdministrationUseCase } from './change-property-administration.use-case.js';
import { CreatePropertyUseCase } from './create-property.use-case.js';

const address = {
  street: 'Av. Corrientes',
  number: '1234',
  postalCode: 'C1043',
  intersection: 'Talcahuano and Libertad',
};

describe('Property use cases', () => {
  let properties: InMemoryPropertyRepository;
  let administrations: InMemoryAdministrationRepository;
  let clock: Clock & { set(date: Date): void };
  let ids: IdGenerator;
  let createProperty: CreatePropertyUseCase;
  let changeAdministration: ChangePropertyAdministrationUseCase;

  beforeEach(async () => {
    properties = new InMemoryPropertyRepository();
    administrations = new InMemoryAdministrationRepository();
    let current = new Date('2026-01-01T00:00:00Z');
    clock = { now: () => current, set: (date) => (current = date) };
    let sequence = 0;
    ids = { generate: () => `id-${++sequence}` };

    const now = clock.now();
    await administrations.save(
      Administration.create({ id: 'a1', name: 'First Administration', now }),
    );
    await administrations.save(
      Administration.create({ id: 'a2', name: 'Second Administration', now }),
    );

    createProperty = new CreatePropertyUseCase(
      properties,
      administrations,
      clock,
      ids,
    );
    changeAdministration = new ChangePropertyAdministrationUseCase(
      properties,
      administrations,
      clock,
      ids,
    );
  });

  describe('CreatePropertyUseCase', () => {
    it('creates a property assigned to an administration', async () => {
      const id = await createProperty.execute({
        propertyType: 'building',
        address,
        administrationId: 'a1',
      });

      const property = await properties.findById(id);
      expect(property?.administrationId).toBe('a1');
      expect(property?.assignments).toHaveLength(1);
    });

    it('creates a property without administration', async () => {
      const id = await createProperty.execute({
        propertyType: 'house',
        address,
      });
      expect((await properties.findById(id))?.administrationId).toBeNull();
    });

    it('fails when the administration does not exist', async () => {
      await expect(
        createProperty.execute({
          propertyType: 'building',
          address,
          administrationId: 'missing',
        }),
      ).rejects.toBeInstanceOf(AdministrationNotFoundError);
    });
  });

  describe('ChangePropertyAdministrationUseCase', () => {
    it('moves the property to another administration, keeping the history', async () => {
      const propertyId = await createProperty.execute({
        propertyType: 'building',
        address,
        administrationId: 'a1',
      });
      const changedAt = new Date('2026-06-01T00:00:00Z');
      clock.set(changedAt);

      await changeAdministration.execute({
        propertyId,
        administrationId: 'a2',
      });

      const property = await properties.findById(propertyId);
      expect(property?.administrationId).toBe('a2');
      expect(
        property?.assignments.map((a) => [a.administrationId, a.endedAt]),
      ).toEqual([
        ['a1', changedAt],
        ['a2', null],
      ]);
    });

    it('fails when the property already has that administration', async () => {
      const propertyId = await createProperty.execute({
        propertyType: 'building',
        address,
        administrationId: 'a1',
      });
      await expect(
        changeAdministration.execute({ propertyId, administrationId: 'a1' }),
      ).rejects.toBeInstanceOf(PropertyAlreadyAssignedError);
    });

    it('fails when the property does not exist', async () => {
      await expect(
        changeAdministration.execute({
          propertyId: 'missing',
          administrationId: 'a2',
        }),
      ).rejects.toBeInstanceOf(PropertyNotFoundError);
    });

    it('fails when the administration does not exist', async () => {
      const propertyId = await createProperty.execute({
        propertyType: 'building',
        address,
      });
      await expect(
        changeAdministration.execute({
          propertyId,
          administrationId: 'missing',
        }),
      ).rejects.toBeInstanceOf(AdministrationNotFoundError);
    });
  });
});
