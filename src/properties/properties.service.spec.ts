import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AdministrationsService } from '../administrations/administrations.service.js';
import { AuthUser } from '../auth/auth-user.js';
import { MunicipalitiesService } from '../municipalities/municipalities.service.js';
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
  directClientId: null,
  municipality: { id: '060035', name: 'Avellaneda', provinceName: 'Buenos Aires' },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const platformOwner: AuthUser = { role: 'platformOwner' };
const manager: AuthUser = {
  role: 'propertyManager',
  userId: 'u1',
  administrationId: 'a1',
  administrationRole: 'member',
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
  const municipalitiesService = { assertExist: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PropertiesService,
        { provide: PropertiesRepository, useValue: repository },
        { provide: AdministrationsService, useValue: administrationsService },
        { provide: MunicipalitiesService, useValue: municipalitiesService },
      ],
    }).compile();
    service = module.get(PropertiesService);
  });

  describe('create', () => {
    it('creates a property assigned to an existing administration', async () => {
      repository.create.mockResolvedValue(property);

      await service.create(
        {
          propertyType: 'building',
          municipalityId: '060035',
          address,
          administrationId: 'a1',
        },
        platformOwner,
      );

      expect(administrationsService.findOne).toHaveBeenCalledWith('a1');
      expect(municipalitiesService.assertExist).toHaveBeenCalledWith(['060035']);
      expect(repository.create).toHaveBeenCalledWith({
        propertyType: 'building',
        address,
        municipalityId: '060035',
        administrationId: 'a1',
      });
    });

    it('creates a property without administration', async () => {
      await service.create({ propertyType: 'house', municipalityId: '060035', address }, platformOwner);

      expect(administrationsService.findOne).not.toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ administrationId: null }));
    });

    it('fails for an unknown municipality', async () => {
      municipalitiesService.assertExist.mockRejectedValue(new BadRequestException());

      await expect(
        service.create({ propertyType: 'house', municipalityId: 'nope', address }, platformOwner),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('fails when the administration does not exist', async () => {
      administrationsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        service.create(
          {
            propertyType: 'building',
            municipalityId: '060035',
            address,
            administrationId: 'missing',
          },
          platformOwner,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it("assigns a property manager's property to their own administration", async () => {
      await service.create({ propertyType: 'building', municipalityId: '060035', address }, manager);

      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ administrationId: 'a1' }));
    });

    it('throws 403 when the property manager has no administration yet', async () => {
      await expect(
        service.create(
          { propertyType: 'building', municipalityId: '060035', address },
          { ...manager, administrationId: null, administrationRole: null },
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('throws 403 when a property manager uses another administration', async () => {
      await expect(
        service.create(
          { propertyType: 'building', municipalityId: '060035', address, administrationId: 'a2' },
          manager,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it("restricts a property manager to their own administration's properties", async () => {
      await service.findAll({}, manager);

      expect(repository.findAll).toHaveBeenCalledWith({ administrationId: 'a1' });
    });

    it('throws 403 when a property manager filters by another administration', async () => {
      await expect(service.findAll({ administrationId: 'a2' }, manager)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lets the platform owner list every property', async () => {
      await service.findAll({}, platformOwner);

      expect(repository.findAll).toHaveBeenCalledWith({ administrationId: undefined });
    });
  });

  describe('findOne', () => {
    it("returns a property of the property manager's administration", async () => {
      repository.findById.mockResolvedValue(property);

      await expect(service.findOne('p1', manager)).resolves.toBe(property);
    });

    it("returns one of the direct client's homes", async () => {
      const home = { ...property, administration: null, directClientId: 'c1' };
      repository.findById.mockResolvedValue(home);

      await expect(service.findOne('p1', { role: 'directClient', userId: 'c1' })).resolves.toBe(home);
    });

    it("throws 403 for another direct client's home", async () => {
      repository.findById.mockResolvedValue({ ...property, administration: null, directClientId: 'c2' });

      await expect(service.findOne('p1', { role: 'directClient', userId: 'c1' })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('throws 403 for a property of another administration', async () => {
      repository.findById.mockResolvedValue({ ...property, administration: { id: 'a2', name: 'Other' } });

      await expect(service.findOne('p1', manager)).rejects.toBeInstanceOf(ForbiddenException);
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

      await expect(service.findAdministrationHistory('missing', platformOwner)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
