import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Tradesman } from './entities/tradesman.entity.js';
import { TradesmenRepository } from './repositories/tradesmen.repository.js';
import { TradesmenService } from './tradesmen.service.js';

const tradesman: Tradesman = {
  id: 't1',
  name: 'Luis',
  middleName: null,
  lastName: 'Pérez',
  trades: ['plumber'],
  contractorId: null,
};

describe('TradesmenService', () => {
  let service: TradesmenService;
  const repository = { findIndependentByTrade: vi.fn(), findById: vi.fn(), findTakenSlots: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [TradesmenService, { provide: TradesmenRepository, useValue: repository }],
    }).compile();
    service = module.get(TradesmenService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('findBookable', () => {
    it('returns an independent tradesman', async () => {
      repository.findById.mockResolvedValue(tradesman);

      await expect(service.findBookable('t1')).resolves.toBe(tradesman);
    });

    it('throws 404 for a tradesman who works for a contractor', async () => {
      repository.findById.mockResolvedValue({ ...tradesman, contractorId: 'k1' });

      await expect(service.findBookable('t1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws 404 when the tradesman does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findBookable('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findAvailability', () => {
    beforeEach(() => {
      repository.findById.mockResolvedValue(tradesman);
      repository.findTakenSlots.mockResolvedValue([]);
    });

    it('returns the free slots of the day', async () => {
      vi.useFakeTimers({ now: new Date('2026-11-01T12:00:00-03:00'), toFake: ['Date'] });
      repository.findTakenSlots.mockResolvedValue([new Date('2026-11-02T10:00:00-03:00')]);

      const slots = await service.findAvailability('t1', { date: '2026-11-02' });

      expect(repository.findTakenSlots).toHaveBeenCalledWith(
        't1',
        new Date('2026-11-02T07:00:00-03:00'),
        new Date('2026-11-02T18:30:00-03:00'),
      );
      expect(slots).toHaveLength(23);
      expect(slots).not.toContainEqual(new Date('2026-11-02T10:00:00-03:00'));
    });

    it('leaves out the slots that already started today', async () => {
      vi.useFakeTimers({ now: new Date('2026-11-02T17:45:00-03:00'), toFake: ['Date'] });

      const slots = await service.findAvailability('t1', { date: '2026-11-02' });

      expect(slots).toEqual([new Date('2026-11-02T18:00:00-03:00'), new Date('2026-11-02T18:30:00-03:00')]);
    });

    it('throws 400 for an impossible date', async () => {
      await expect(service.findAvailability('t1', { date: '2026-02-30' })).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
