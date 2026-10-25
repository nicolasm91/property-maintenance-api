import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MunicipalitiesService } from './municipalities.service.js';
import { MunicipalitiesRepository } from './repositories/municipalities.repository.js';

describe('MunicipalitiesService', () => {
  let service: MunicipalitiesService;
  const repository = { findProvinces: vi.fn(), findAll: vi.fn(), findExistingIds: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [MunicipalitiesService, { provide: MunicipalitiesRepository, useValue: repository }],
    }).compile();
    service = module.get(MunicipalitiesService);
  });

  it('searches ignoring case and accents, 50 at most', async () => {
    await service.findAll({ provinceId: '14', search: 'CÓRDOBA' });

    expect(repository.findAll).toHaveBeenCalledWith({ provinceId: '14', searchName: 'cordoba', limit: 50 });
  });

  it('lists a whole province without a search, uncapped', async () => {
    await service.findAll({ provinceId: '06' });

    expect(repository.findAll).toHaveBeenCalledWith({ provinceId: '06', searchName: undefined, limit: undefined });
  });

  it('caps a search across every province', async () => {
    await service.findAll({ search: 'san' });

    expect(repository.findAll).toHaveBeenCalledWith({ provinceId: undefined, searchName: 'san', limit: 50 });
  });

  describe('assertExist', () => {
    it('passes when every municipality exists', async () => {
      repository.findExistingIds.mockResolvedValue(['022007', '060028']);

      await expect(service.assertExist(['022007', '060028', '022007'])).resolves.toBeUndefined();
      expect(repository.findExistingIds).toHaveBeenCalledWith(['022007', '060028']);
    });

    it('throws 400 naming the unknown ones', async () => {
      repository.findExistingIds.mockResolvedValue(['022007']);

      await expect(service.assertExist(['022007', 'nope'])).rejects.toThrow(
        new BadRequestException('Unknown municipality: nope'),
      );
    });

    it('does not query for an empty list', async () => {
      await service.assertExist([]);

      expect(repository.findExistingIds).not.toHaveBeenCalled();
    });
  });
});
