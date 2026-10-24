import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { AuthUser, Identity } from './../src/auth/auth-user.js';
import { IdentityProvider } from './../src/auth/identity-provider.js';
import { TokenVerifier } from './../src/auth/token-verifier.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

// Runs against the database in DATABASE_URL and deletes what it creates.
describe('Direct client booking (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const sessions = new Map<string, { identity: Identity; user: AuthUser | null }>();
  const userIds: string[] = [];

  const home = { street: 'Av. Corrientes', number: '1234', postalCode: 'C1043', intersection: 'Talcahuano' };
  // Tomorrow in the platform time zone (UTC-3), so every slot is in the future.
  const day = new Date(Date.now() - 3 * 3_600_000 + 24 * 3_600_000).toISOString().slice(0, 10);
  const slot = (time: string) => new Date(`${day}T${time}:00-03:00`).toISOString();

  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function signUp(token: string, body: object) {
    const identity = { sub: `google-oauth2|${randomUUID()}`, email: `${randomUUID()}@example.com` };
    sessions.set(token, { identity, user: null });
    const response = await request(app.getHttpServer()).post('/me').set(as(token)).send(body).expect(201);
    const user = response.body as { id: string; role: 'directClient' | 'tradesman' };
    userIds.push(user.id);
    sessions.set(token, { identity, user: { role: user.role, userId: user.id } });
    return response.body as { id: string; homes?: { id: string }[] };
  }

  let tradesmanId: string;
  let homeId: string;

  const book = (time: string) =>
    request(app.getHttpServer())
      .post('/tasks')
      .set(as('client'))
      .send({
        tradesmanId,
        propertyId: homeId,
        trade: 'plumber',
        title: 'Leaking tap',
        description: 'The kitchen tap drips',
        scheduledAt: slot(time),
      });

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(TokenVerifier)
      .useValue({ verify: (token: string) => Promise.resolve(sessions.get(token)) })
      .overrideProvider(IdentityProvider)
      .useValue({ setProfileMetadata: () => Promise.resolve(), clearProfileMetadata: () => Promise.resolve() })
      .compile();
    app = moduleFixture.createNestApplication();
    // Same pipe as main.ts, which tests don't run.
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);

    tradesmanId = (await signUp('tradesman', { profileType: 'tradesman', name: 'Luis', lastName: 'Pérez' })).id;
    const client = await signUp('client', { profileType: 'directClient', name: 'Ana', lastName: 'García', home });
    homeId = client.homes![0].id;
  });

  afterAll(async () => {
    await prisma.taskEvent.deleteMany({ where: { actorId: { in: userIds } } });
    await prisma.task.deleteMany({ where: { createdById: { in: userIds } } });
    await prisma.property.deleteMany({ where: { directClientId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('lets a tradesman update their trades and be found by them', async () => {
    await request(app.getHttpServer())
      .put('/me/trades')
      .set(as('tradesman'))
      .send({ trades: ['plumber', 'electrician'] })
      .expect(200);

    const { body } = await request(app.getHttpServer()).get('/tradesmen?trade=plumber').set(as('client')).expect(200);
    expect(body).toContainEqual(expect.objectContaining({ id: tradesmanId, trades: ['plumber', 'electrician'] }));
  });

  it('books a free slot, and refuses a slot already taken', async () => {
    const { body: task } = await book('09:00').expect(201);
    expect(task).toMatchObject({ status: 'assigned', scheduledAt: slot('09:00'), tradesman: { id: tradesmanId } });

    await book('09:00').expect(409);

    const { body: free } = await request(app.getHttpServer())
      .get(`/tradesmen/${tradesmanId}/availability?date=${day}`)
      .set(as('client'))
      .expect(200);
    expect(free).toHaveLength(23);
    expect(free).not.toContain(slot('09:00'));
  });

  it('lets only one of two concurrent bookings of the same slot succeed', async () => {
    const statuses = (await Promise.all([book('10:00'), book('10:00')])).map((response) => response.status);

    expect(statuses.sort((a, b) => a - b)).toEqual([201, 409]);
  });

  it('rejects a booking outside the slot grid', async () => {
    await book('19:00').expect(400);
  });

  it('runs the task lifecycle: agenda, complete, reject, cancel, history', async () => {
    const { body: toComplete } = await book('11:00').expect(201);
    const { body: toReject } = await book('11:30').expect(201);
    const { body: toCancel } = await book('12:00').expect(201);

    await request(app.getHttpServer())
      .post(`/tasks/${toComplete.id}/complete`)
      .set(as('tradesman'))
      .expect(200)
      .expect((response) => expect(response.body.status).toBe('completed'));
    await request(app.getHttpServer())
      .post(`/tasks/${toReject.id}/reject`)
      .set(as('tradesman'))
      .send({ reason: 'Too far' })
      .expect(200)
      .expect((response) => expect(response.body.status).toBe('rejected'));
    await request(app.getHttpServer()).post(`/tasks/${toCancel.id}/cancel`).set(as('client')).send({}).expect(400);
    await request(app.getHttpServer())
      .post(`/tasks/${toCancel.id}/cancel`)
      .set(as('client'))
      .send({ reason: 'Fixed it myself' })
      .expect(200);
    await request(app.getHttpServer())
      .post(`/tasks/${toComplete.id}/cancel`)
      .set(as('client'))
      .send({ reason: 'Too late' })
      .expect(409);

    const { body: agenda } = await request(app.getHttpServer()).get('/tasks').set(as('tradesman')).expect(200);
    const agendaIds = (agenda as { id: string }[]).map((task) => task.id);
    expect(agendaIds).toContain(toComplete.id);
    expect(agendaIds).not.toContain(toReject.id);
    expect(agendaIds).not.toContain(toCancel.id);

    const { body: mine } = await request(app.getHttpServer()).get('/tasks').set(as('client')).expect(200);
    expect((mine as { id: string }[]).map((task) => task.id)).toEqual(
      expect.arrayContaining([toComplete.id, toReject.id, toCancel.id]),
    );

    // The rejected and cancelled tasks freed their slots.
    await book('11:30').expect(201);
    await book('12:00').expect(201);

    const { body: history } = await request(app.getHttpServer())
      .get(`/tasks/${toReject.id}/events`)
      .set(as('tradesman'))
      .expect(200);
    expect(history).toMatchObject([
      { type: 'created', actor: { name: 'Ana' }, tradesmanId },
      { type: 'rejected', actor: { id: tradesmanId }, reason: 'Too far' },
    ]);
  });

  it('keeps other people out', async () => {
    await request(app.getHttpServer()).get('/tradesmen?trade=plumber').set(as('tradesman')).expect(403);
    await request(app.getHttpServer()).put('/me/trades').set(as('client')).send({ trades: [] }).expect(403);
  });
});
