import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PropertiesService } from '../properties/properties.service.js';
import { TradesmenService } from '../tradesmen/tradesmen.service.js';
import { Task } from './entities/task.entity.js';
import { TasksRepository } from './repositories/tasks.repository.js';
import { DirectClientCaller, TasksService, TradesmanCaller } from './tasks.service.js';

const client: DirectClientCaller = { role: 'directClient', userId: 'c1' };
const tradesmanUser: TradesmanCaller = { role: 'tradesman', userId: 't1' };

const person = (id: string) => ({ id, name: 'Ana', middleName: null, lastName: 'García' });

const task: Task = {
  id: 'k1',
  title: 'Leaking tap',
  description: 'The kitchen tap drips',
  trade: 'plumber',
  status: 'assigned',
  scheduledAt: new Date('2026-11-02T13:00:00Z'),
  completedAt: null,
  cancelledAt: null,
  property: {
    id: 'p1',
    address: { street: 'Av. Corrientes', number: '1234', postalCode: 'C1043', intersection: 'Talcahuano' },
  },
  createdBy: person('c1'),
  tradesman: person('t1'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const booking = {
  tradesmanId: 't1',
  propertyId: 'p1',
  trade: 'plumber' as const,
  title: 'Leaking tap',
  description: 'The kitchen tap drips',
  scheduledAt: '2026-11-02T10:00:00-03:00',
};

describe('TasksService', () => {
  let service: TasksService;
  const repository = {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    changeStatus: vi.fn(),
    findEvents: vi.fn(),
  };
  const tradesmenService = { findBookable: vi.fn() };
  const propertiesService = { findOne: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();
    vi.useFakeTimers({ now: new Date('2026-11-01T12:00:00-03:00'), toFake: ['Date'] });
    const module = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: TasksRepository, useValue: repository },
        { provide: TradesmenService, useValue: tradesmenService },
        { provide: PropertiesService, useValue: propertiesService },
      ],
    }).compile();
    service = module.get(TasksService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('create', () => {
    beforeEach(() => {
      tradesmenService.findBookable.mockResolvedValue({ id: 't1', trades: ['plumber'], contractorId: null });
    });

    it("books the slot for one of the caller's homes", async () => {
      repository.create.mockResolvedValue(task);

      await expect(service.create(booking, client)).resolves.toBe(task);

      expect(propertiesService.findOne).toHaveBeenCalledWith('p1', client);
      expect(repository.create).toHaveBeenCalledWith({
        title: 'Leaking tap',
        description: 'The kitchen tap drips',
        trade: 'plumber',
        scheduledAt: new Date('2026-11-02T13:00:00Z'),
        createdById: 'c1',
        tradesmanId: 't1',
        propertyId: 'p1',
      });
    });

    it.each([
      ['not the start of a slot', '2026-11-02T10:15:00-03:00'],
      ['outside working hours', '2026-11-02T19:00:00-03:00'],
      ['in the past', '2026-11-01T10:00:00-03:00'],
    ])('throws 400 when scheduledAt is %s', async (_, scheduledAt) => {
      await expect(service.create({ ...booking, scheduledAt }, client)).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('throws 400 when the tradesman does not have the trade', async () => {
      await expect(service.create({ ...booking, trade: 'mason' }, client)).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('fails when the tradesman cannot be booked', async () => {
      tradesmenService.findBookable.mockRejectedValue(new NotFoundException());

      await expect(service.create(booking, client)).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it("fails when the property is not one of the caller's homes", async () => {
      propertiesService.findOne.mockRejectedValue(new ForbiddenException());

      await expect(service.create(booking, client)).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('gives a tradesman their agenda, without cancelled or rejected tasks', async () => {
      await service.findAll({ from: '2026-11-02T00:00:00-03:00' }, tradesmanUser);

      expect(repository.findAll).toHaveBeenCalledWith({
        from: new Date('2026-11-02T03:00:00Z'),
        to: undefined,
        tradesmanId: 't1',
        excludeStatuses: ['cancelled', 'rejected'],
      });
    });

    it('gives a direct client every task they created', async () => {
      await service.findAll({}, client);

      expect(repository.findAll).toHaveBeenCalledWith({ from: undefined, to: undefined, createdById: 'c1' });
    });
  });

  describe('complete', () => {
    it('completes a task assigned to the tradesman', async () => {
      repository.findById.mockResolvedValue(task);

      await service.complete('k1', tradesmanUser);

      expect(repository.changeStatus).toHaveBeenCalledWith('k1', {
        from: ['assigned'],
        to: 'completed',
        actorId: 't1',
        reason: null,
      });
    });

    it('throws 403 for a task of another tradesman', async () => {
      repository.findById.mockResolvedValue({ ...task, tradesman: person('t2') });

      await expect(service.complete('k1', tradesmanUser)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it.each(['completed', 'cancelled', 'rejected'] as const)('throws 409 for a %s task', async (status) => {
      repository.findById.mockResolvedValue({ ...task, status });

      await expect(service.complete('k1', tradesmanUser)).rejects.toBeInstanceOf(ConflictException);
      expect(repository.changeStatus).not.toHaveBeenCalled();
    });

    it('throws 404 when the task does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.complete('missing', tradesmanUser)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('reject', () => {
    it('rejects the task with the optional reason', async () => {
      repository.findById.mockResolvedValue(task);

      await service.reject('k1', { reason: 'Too far' }, tradesmanUser);

      expect(repository.changeStatus).toHaveBeenCalledWith('k1', {
        from: ['assigned'],
        to: 'rejected',
        actorId: 't1',
        reason: 'Too far',
      });
    });

    it('stores a blank reason as no reason', async () => {
      repository.findById.mockResolvedValue(task);

      await service.reject('k1', { reason: '' }, tradesmanUser);

      expect(repository.changeStatus).toHaveBeenCalledWith('k1', expect.objectContaining({ reason: null }));
    });

    it('throws 403 for a task of another tradesman', async () => {
      repository.findById.mockResolvedValue({ ...task, tradesman: person('t2') });

      await expect(service.reject('k1', {}, tradesmanUser)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws 409 for a completed task', async () => {
      repository.findById.mockResolvedValue({ ...task, status: 'completed' });

      await expect(service.reject('k1', {}, tradesmanUser)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('cancel', () => {
    it("cancels the caller's task with the reason", async () => {
      repository.findById.mockResolvedValue(task);

      await service.cancel('k1', { reason: 'Fixed it myself' }, client);

      expect(repository.changeStatus).toHaveBeenCalledWith('k1', {
        from: ['unassigned', 'assigned'],
        to: 'cancelled',
        actorId: 'c1',
        reason: 'Fixed it myself',
      });
    });

    it('throws 403 for a task of another client', async () => {
      repository.findById.mockResolvedValue({ ...task, createdBy: person('c2') });

      await expect(service.cancel('k1', { reason: 'No' }, client)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it.each(['completed', 'cancelled', 'rejected'] as const)('throws 409 for a %s task', async (status) => {
      repository.findById.mockResolvedValue({ ...task, status });

      await expect(service.cancel('k1', { reason: 'No' }, client)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('findEvents', () => {
    it.each([
      ['the client who created the task', client],
      ['the tradesman assigned to it', tradesmanUser],
    ])('returns the history to %s', async (_, user) => {
      repository.findById.mockResolvedValue(task);

      await service.findEvents('k1', user);

      expect(repository.findEvents).toHaveBeenCalledWith('k1');
    });

    it('throws 403 to anyone else', async () => {
      repository.findById.mockResolvedValue(task);

      await expect(service.findEvents('k1', { role: 'tradesman', userId: 't2' })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });
});
