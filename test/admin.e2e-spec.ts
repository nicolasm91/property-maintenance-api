import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { AuthUser, Identity } from './../src/auth/auth-user.js';
import { IdentityProvider } from './../src/auth/identity-provider.js';
import { TokenVerifier } from './../src/auth/token-verifier.js';
import { createOpenApiDocument } from './../src/openapi.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

// Runs against the database in DATABASE_URL and deletes what it creates.
describe('Platform owner (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const sessions = new Map<string, { identity: Identity; user: AuthUser | null }>();
  const userIds: string[] = [];
  const identityProvider = { setProfileMetadata: vi.fn(), clearProfileMetadata: vi.fn() };
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });
  const day = new Date(Date.now() - 3 * 3_600_000 + 24 * 3_600_000).toISOString().slice(0, 10);

  async function signUp(token: string, body: object) {
    const identity = { sub: `google-oauth2|${randomUUID()}`, email: `${randomUUID()}@example.com` };
    sessions.set(token, { identity, user: null });
    const { body: user } = await request(app.getHttpServer()).post('/me').set(as(token)).send(body).expect(201);
    userIds.push(user.id);
    sessions.set(token, { identity, user: { role: user.role, userId: user.id } as AuthUser });
    return user as { id: string; email: string; homes?: { id: string }[] };
  }

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(TokenVerifier)
      .useValue({ verify: (token: string) => Promise.resolve(sessions.get(token)) })
      .overrideProvider(IdentityProvider)
      .useValue(identityProvider)
      .compile();
    app = moduleFixture.createNestApplication();
    // Same pipe as main.ts, which tests don't run.
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
    sessions.set('owner', { identity: { sub: 'auth0|owner', email: null }, user: { role: 'platformOwner' } });
  });

  afterAll(async () => {
    await prisma.taskEvent.deleteMany({ where: { actorId: { in: userIds } } });
    await prisma.task.deleteMany({ where: { createdById: { in: userIds } } });
    await prisma.property.deleteMany({ where: { directClientId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('force-deletes a direct client with their home and tasks, and a tradesman with their agenda', async () => {
    const tradesman = await signUp('tradesman', {
      profileType: 'tradesman',
      name: 'Luis',
      lastName: 'Pérez',
      trades: ['plumber'],
      municipalityIds: ['022007'],
    });
    const client = await signUp('client', {
      profileType: 'directClient',
      name: 'Ana',
      lastName: 'García',
      home: {
        street: 'Av. Corrientes',
        number: '1234',
        postalCode: 'C1043',
        intersection: 'Talcahuano',
        municipalityId: '022007',
      },
    });
    const { body: task } = await request(app.getHttpServer())
      .post('/tasks')
      .set(as('client'))
      .send({
        tradesmanId: tradesman.id,
        propertyId: client.homes![0].id,
        trade: 'plumber',
        title: 'Leaking tap',
        description: 'The kitchen tap drips',
        scheduledAt: new Date(`${day}T09:00:00-03:00`).toISOString(),
      })
      .expect(201);

    const { body: listed } = await request(app.getHttpServer())
      .get(`/admin/users?search=${client.email}`)
      .set(as('owner'))
      .expect(200);
    expect(listed).toEqual([expect.objectContaining({ id: client.id, role: 'directClient', homes: 1, tasks: 1 })]);

    await request(app.getHttpServer()).delete(`/admin/users/${client.id}`).set(as('owner')).expect(204);

    expect(identityProvider.clearProfileMetadata).toHaveBeenCalledWith(sessions.get('client')!.identity.sub);
    expect(await prisma.user.findUnique({ where: { id: client.id } })).toBeNull();
    expect(await prisma.task.findUnique({ where: { id: task.id } })).toBeNull();
    expect(await prisma.property.count({ where: { id: client.homes![0].id } })).toBe(0);

    await request(app.getHttpServer()).delete(`/admin/users/${tradesman.id}`).set(as('owner')).expect(204);
    await request(app.getHttpServer()).delete(`/admin/users/${tradesman.id}`).set(as('owner')).expect(404);
  });

  it('deletes a property manager together with their now empty administration', async () => {
    const manager = await signUp('manager', { profileType: 'propertyManager', name: 'Eva', lastName: 'Ruiz' });
    sessions.get('manager')!.user = {
      role: 'propertyManager',
      userId: manager.id,
      administrationId: null,
      administrationRole: null,
    };
    const { body: withAdministration } = await request(app.getHttpServer())
      .post('/me/administration')
      .set(as('manager'))
      .send({ name: 'Ruiz Adm.' })
      .expect(201);
    expect(withAdministration).toMatchObject({ administration: { name: 'Ruiz Adm.' }, administrationRole: 'admin' });
    await request(app.getHttpServer())
      .post('/me/administration')
      .set(as('manager'))
      .send({ name: 'Other' })
      .expect(409);

    await request(app.getHttpServer()).delete(`/admin/users/${manager.id}`).set(as('owner')).expect(204);

    expect(await prisma.propertyAdministration.count({ where: { id: withAdministration.administration.id } })).toBe(0);
  });

  it('lets a contractor create their Company after signing up, once', async () => {
    const contractor = await signUp('contractor', { profileType: 'contractor', name: 'Martín', lastName: 'Sosa' });
    expect(contractor).toMatchObject({ company: null });

    const { body } = await request(app.getHttpServer())
      .post('/me/company')
      .set(as('contractor'))
      .send({ name: 'Sosa SRL' })
      .expect(201);
    expect(body).toMatchObject({ company: { name: 'Sosa SRL' } });
    await request(app.getHttpServer()).post('/me/company').set(as('contractor')).send({ name: 'Other' }).expect(409);
    await request(app.getHttpServer()).post('/me/company').set(as('client')).send({ name: 'Nope' }).expect(403);

    await request(app.getHttpServer()).delete(`/admin/users/${contractor.id}`).set(as('owner')).expect(204);
    expect(await prisma.company.count({ where: { id: body.company.id } })).toBe(0);
  });

  it('is only for the platform owner', async () => {
    await signUp('someone', { profileType: 'tradesman', name: 'Juan', lastName: 'Sosa' });

    await request(app.getHttpServer()).get('/admin/users').set(as('someone')).expect(403);
    await request(app.getHttpServer()).delete(`/admin/users/${randomUUID()}`).set(as('someone')).expect(403);
  });

  it('builds the OpenAPI document', () => {
    const document = createOpenApiDocument(app);

    expect(document.paths).toHaveProperty(['/admin/users/{id}', 'delete']);
    expect(document.paths).toHaveProperty(['/tasks', 'post']);
  });
});
