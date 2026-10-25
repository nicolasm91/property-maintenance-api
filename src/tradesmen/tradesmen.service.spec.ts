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
  ratingAverage: 4.5,
  ratingCount: 2,
};

describe('TradesmenService', () => {
  let service: TradesmenService;
  const repository = { search: vi.fn(), servesMunicipality: vi.fn(), findById: vi.fn(), findTakenSlots: vi.fn() };

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

  describe('findAll', () => {
    const query = { trade: 'plumber' as const, municipalityId: '060035' };

    it('returns the first page and a cursor to the next one', async () => {
      repository.search.mockResolvedValue([tradesman, { ...tradesman, id: 't2' }, { ...tradesman, id: 't3' }]);

      const page = await service.findAll({ ...query, limit: 2 });

      expect(repository.search).toHaveBeenCalledWith({ ...query, skip: 0, take: 3 });
      expect(page.items.map((each) => each.id)).toEqual(['t1', 't2']);
      expect(page.nextCursor).toEqual(expect.any(String));

      repository.search.mockResolvedValue([{ ...tradesman, id: 't3' }]);
      const next = await service.findAll({ ...query, limit: 2, cursor: page.nextCursor! });

      expect(repository.search).toHaveBeenLastCalledWith({ ...query, skip: 2, take: 3 });
      expect(next).toEqual({ items: [{ ...tradesman, id: 't3' }], nextCursor: null });
    });

    it('uses 20 results per page by default', async () => {
      repository.search.mockResolvedValue([]);

      await service.findAll(query);

      expect(repository.search).toHaveBeenCalledWith({ ...query, skip: 0, take: 21 });
    });

    it.each(['not-base64-json', Buffer.from('{"offset":-1}').toString('base64url')])(
      'throws 400 for the invalid cursor %j',
      async (cursor) => {
        await expect(service.findAll({ ...query, cursor })).rejects.toBeInstanceOf(BadRequestException);
      },
    );
  });

  describe('assertServes', () => {
    it('throws 400 when the tradesman does not work in the municipality', async () => {
      repository.servesMunicipality.mockResolvedValue(false);

      await expect(service.assertServes('t1', '060035')).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.servesMunicipality).toHaveBeenCalledWith('t1', '060035');
    });

    it('passes when they do', async () => {
      repository.servesMunicipality.mockResolvedValue(true);

      await expect(service.assertServes('t1', '060035')).resolves.toBeUndefined();
    });
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
