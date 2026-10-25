import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Identity } from '../auth/auth-user.js';
import { IdentityProvider } from '../auth/identity-provider.js';
import { MunicipalitiesService } from '../municipalities/municipalities.service.js';
import { User } from './entities/user.entity.js';
import { UsersRepository } from './repositories/users.repository.js';
import { UsersService } from './users.service.js';

const identity: Identity = { sub: 'google-oauth2|123', email: 'ana@example.com' };

const base = {
  id: 'u1',
  email: 'ana@example.com',
  name: 'Ana',
  middleName: null,
  lastName: 'García',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const manager: User = {
  ...base,
  role: 'propertyManager',
  administration: { id: 'a1', name: 'Admin Ana' },
  administrationRole: 'admin',
};

describe('UsersService', () => {
  let service: UsersService;
  const repository = {
    findByAuth0Sub: vi.fn(),
    create: vi.fn(),
    updateTrades: vi.fn(),
    createAdministration: vi.fn(),
    createCompany: vi.fn(),
    updateMunicipalities: vi.fn(),
  };
  const identityProvider = { setProfileMetadata: vi.fn() };
  const municipalitiesService = { assertExist: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: repository },
        { provide: IdentityProvider, useValue: identityProvider },
        { provide: MunicipalitiesService, useValue: municipalitiesService },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  describe('onboard', () => {
    it('creates a property manager without administration and syncs the claims', async () => {
      const newManager: User = { ...manager, administration: null, administrationRole: null };
      repository.findByAuth0Sub.mockResolvedValue(null);
      repository.create.mockResolvedValue(newManager);

      await expect(
        service.onboard(identity, { profileType: 'propertyManager', name: 'Ana', middleName: '', lastName: 'García' }),
      ).resolves.toBe(newManager);

      expect(repository.create).toHaveBeenCalledWith({
        auth0Sub: identity.sub,
        email: identity.email,
        name: 'Ana',
        middleName: null,
        lastName: 'García',
        profile: { role: 'propertyManager' },
      });
      expect(identityProvider.setProfileMetadata).toHaveBeenCalledWith(identity.sub, {
        userId: 'u1',
        role: 'propertyManager',
      });
    });

    it('creates a tradesman with their trades', async () => {
      repository.findByAuth0Sub.mockResolvedValue(null);
      repository.create.mockResolvedValue({ ...base, role: 'tradesman', trades: ['plumber'], contractorId: null });

      await service.onboard(identity, {
        profileType: 'tradesman',
        name: 'Ana',
        lastName: 'García',
        trades: ['plumber'],
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ profile: { role: 'tradesman', trades: ['plumber'], municipalityIds: [] } }),
      );
      expect(identityProvider.setProfileMetadata).toHaveBeenCalledWith(identity.sub, {
        userId: 'u1',
        role: 'tradesman',
      });
    });

    it('creates a tradesman without trades', async () => {
      repository.findByAuth0Sub.mockResolvedValue(null);
      repository.create.mockResolvedValue({ ...base, role: 'tradesman', trades: [], contractorId: null });

      await service.onboard(identity, { profileType: 'tradesman', name: 'Ana', lastName: 'García' });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ profile: { role: 'tradesman', trades: [], municipalityIds: [] } }),
      );
    });

    it('creates a direct client with their first home', async () => {
      const home = {
        street: 'Av. Corrientes',
        number: '1234',
        postalCode: 'C1043',
        intersection: 'Talcahuano',
        municipalityId: '022007',
      };
      repository.findByAuth0Sub.mockResolvedValue(null);
      repository.create.mockResolvedValue({ ...base, role: 'directClient', homes: [] });

      await service.onboard(identity, { profileType: 'directClient', name: 'Ana', lastName: 'García', home });

      expect(municipalitiesService.assertExist).toHaveBeenCalledWith(['022007']);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ profile: { role: 'directClient', home } }),
      );
      expect(identityProvider.setProfileMetadata).toHaveBeenCalledWith(identity.sub, {
        userId: 'u1',
        role: 'directClient',
      });
    });

    it('re-syncs the claims of an existing User instead of creating another', async () => {
      repository.findByAuth0Sub.mockResolvedValue(manager);

      await expect(
        service.onboard(identity, {
          profileType: 'contractor',
          name: 'Ana',
          lastName: 'García',
        }),
      ).resolves.toBe(manager);

      expect(repository.create).not.toHaveBeenCalled();
      expect(identityProvider.setProfileMetadata).toHaveBeenCalledWith(
        identity.sub,
        expect.objectContaining({ role: 'propertyManager' }),
      );
    });

    it('throws 403 for a platform owner (password) account', async () => {
      repository.findByAuth0Sub.mockResolvedValue(null);

      await expect(
        service.onboard(
          { sub: 'auth0|owner', email: 'owner@example.com' },
          { profileType: 'tradesman', name: 'Ana', lastName: 'García' },
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.create).not.toHaveBeenCalled();
      expect(identityProvider.setProfileMetadata).not.toHaveBeenCalled();
    });

    it('throws 403 without a verified email', async () => {
      repository.findByAuth0Sub.mockResolvedValue(null);

      await expect(
        service.onboard({ ...identity, email: null }, { profileType: 'contractor', name: 'Ana', lastName: 'García' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('createAdministration', () => {
    it('creates it and syncs the claims with the administration', async () => {
      repository.createAdministration.mockResolvedValue(manager);

      await expect(service.createAdministration(identity, 'u1', { name: 'Admin Ana' })).resolves.toBe(manager);

      expect(repository.createAdministration).toHaveBeenCalledWith('u1', 'Admin Ana');
      expect(identityProvider.setProfileMetadata).toHaveBeenCalledWith(identity.sub, {
        userId: 'u1',
        role: 'propertyManager',
        administrationId: 'a1',
        administrationRole: 'admin',
      });
    });

    it('throws 404 when the User is not a property manager', async () => {
      repository.createAdministration.mockResolvedValue(null);

      await expect(service.createAdministration(identity, 'u1', { name: 'Admin Ana' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(identityProvider.setProfileMetadata).not.toHaveBeenCalled();
    });
  });

  describe('createCompany', () => {
    it('creates it', async () => {
      const contractor: User = { ...base, role: 'contractor', company: { id: 'k1', name: 'Ana SRL' } };
      repository.createCompany.mockResolvedValue(contractor);

      await expect(service.createCompany('u1', { name: 'Ana SRL' })).resolves.toBe(contractor);
      expect(repository.createCompany).toHaveBeenCalledWith('u1', 'Ana SRL');
    });

    it('throws 404 when the User is not a contractor', async () => {
      repository.createCompany.mockResolvedValue(null);

      await expect(service.createCompany('u1', { name: 'Ana SRL' })).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateMunicipalities', () => {
    it('checks the municipalities exist and replaces the service area', async () => {
      const tradesman = { ...base, role: 'tradesman', trades: [], contractorId: null };
      repository.updateMunicipalities.mockResolvedValue(tradesman);

      await expect(service.updateMunicipalities('u1', { municipalityIds: ['022007', '060035'] })).resolves.toBe(
        tradesman,
      );
      expect(municipalitiesService.assertExist).toHaveBeenCalledWith(['022007', '060035']);
      expect(repository.updateMunicipalities).toHaveBeenCalledWith('u1', ['022007', '060035']);
    });

    it('fails for an unknown municipality without saving', async () => {
      municipalitiesService.assertExist.mockRejectedValue(new BadRequestException());

      await expect(service.updateMunicipalities('u1', { municipalityIds: ['nope'] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repository.updateMunicipalities).not.toHaveBeenCalled();
    });
  });

  describe('updateTrades', () => {
    it("replaces the tradesman's trades", async () => {
      const tradesman = { ...base, role: 'tradesman', trades: ['mason'], contractorId: null };
      repository.updateTrades.mockResolvedValue(tradesman);

      await expect(service.updateTrades('u1', { trades: ['mason'] })).resolves.toBe(tradesman);
      expect(repository.updateTrades).toHaveBeenCalledWith('u1', ['mason']);
    });

    it('throws 404 when the User is not a tradesman', async () => {
      repository.updateTrades.mockResolvedValue(null);

      await expect(service.updateTrades('u1', { trades: [] })).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findMe', () => {
    it('throws 404 before onboarding', async () => {
      repository.findByAuth0Sub.mockResolvedValue(null);

      await expect(service.findMe(identity)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
