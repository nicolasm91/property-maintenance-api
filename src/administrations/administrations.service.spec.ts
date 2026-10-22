import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AdministrationsService } from './administrations.service.js';
import { AdministrationsRepository } from './repositories/administrations.repository.js';

describe('AdministrationsService', () => {
  let service: AdministrationsService;
  const repository = {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [AdministrationsService, { provide: AdministrationsRepository, useValue: repository }],
    }).compile();
    service = module.get(AdministrationsService);
  });

  describe('findOne', () => {
    it('returns the administration', async () => {
      const administration = { id: 'a1', name: 'First Administration' };
      repository.findById.mockResolvedValue(administration);
      await expect(service.findOne('a1')).resolves.toBe(administration);
    });

    it('throws 404 when it does not exist', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.findOne('a1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findOneForUser', () => {
    const administration = { id: 'a1', name: 'First Administration' };

    it('returns any administration to the platform owner', async () => {
      repository.findById.mockResolvedValue(administration);
      await expect(service.findOneForUser('a1', { role: 'platformOwner' })).resolves.toBe(administration);
    });

    it("returns a property manager's own administration", async () => {
      repository.findById.mockResolvedValue(administration);
      await expect(
        service.findOneForUser('a1', {
          role: 'propertyManager',
          userId: 'u1',
          administrationId: 'a1',
          administrationRole: 'member',
        }),
      ).resolves.toBe(administration);
    });

    it('throws 403 for another administration', async () => {
      await expect(
        service.findOneForUser('a2', {
          role: 'propertyManager',
          userId: 'u1',
          administrationId: 'a1',
          administrationRole: 'admin',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.findById).not.toHaveBeenCalled();
    });
  });
});
