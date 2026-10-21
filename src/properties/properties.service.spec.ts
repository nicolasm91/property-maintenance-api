import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AdministrationsService } from '../administrations/administrations.service.js';
import { Property } from './entities/property.entity.js';
import { PropertiesService } from './properties.service.js';
import { PropertiesRepository } from './repositories/properties.repository.js';

const address = {
  street: 'Av. Corrientes',
  number: '1234',
  postalCode: 'C1043',
  intersection: 'Talcahuano and Libertad',
};

const property: Property = {
  id: 'p1',
  propertyType: 'building',
  address,
  administration: { id: 'a1', name: 'First Administration' },
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('PropertiesService', () => {
  let service: PropertiesService;
  const repository = {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    changeAdministration: vi.fn(),
    findAdministrationHistory: vi.fn(),
  };
  const administrationsService = { findOne: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PropertiesService,
        { provide: PropertiesRepository, useValue: repository },
        { provide: AdministrationsService, useValue: administrationsService },
      ],
    }).compile();
    service = module.get(PropertiesService);
  });

  describe('create', () => {
    it('creates a property assigned to an existing administration', async () => {
      repository.create.mockResolvedValue(property);

      await service.create({
        propertyType: 'building',
        address,
        administrationId: 'a1',
      });

      expect(administrationsService.findOne).toHaveBeenCalledWith('a1');
      expect(repository.create).toHaveBeenCalledWith({
        propertyType: 'building',
        address,
        administrationId: 'a1',
      });
    });

    it('creates a property without administration', async () => {
      await service.create({ propertyType: 'house', address });

      expect(administrationsService.findOne).not.toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ administrationId: null }));
    });

    it('fails when the administration does not exist', async () => {
      administrationsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        service.create({
          propertyType: 'building',
          address,
          administrationId: 'missing',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('changeAdministration', () => {
    it('changes the administration', async () => {
      repository.findById.mockResolvedValue(property);

      await service.changeAdministration('p1', { administrationId: 'a2' });

      expect(administrationsService.findOne).toHaveBeenCalledWith('a2');
      expect(repository.changeAdministration).toHaveBeenCalledWith('p1', 'a2');
    });

    it('throws 409 when the property already has that administration', async () => {
      repository.findById.mockResolvedValue(property);

      await expect(service.changeAdministration('p1', { administrationId: 'a1' })).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repository.changeAdministration).not.toHaveBeenCalled();
    });

    it('throws 404 when the property does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.changeAdministration('missing', { administrationId: 'a2' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('fails when the new administration does not exist', async () => {
      repository.findById.mockResolvedValue(property);
      administrationsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.changeAdministration('p1', { administrationId: 'missing' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.changeAdministration).not.toHaveBeenCalled();
    });
  });

  describe('findAdministrationHistory', () => {
    it('throws 404 when the property does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findAdministrationHistory('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
