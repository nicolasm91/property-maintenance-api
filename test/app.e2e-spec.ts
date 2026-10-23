import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { IdentityProvider } from './../src/auth/identity-provider.js';
import { TokenVerifier } from './../src/auth/token-verifier.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  const tokenVerifier = { verify: vi.fn() };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TokenVerifier)
      .useValue(tokenVerifier)
      .overrideProvider(IdentityProvider)
      .useValue({ setProfileMetadata: vi.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
  });

  it('rejects protected routes without a token', () => {
    return request(app.getHttpServer()).get('/administrations').expect(401);
  });

  it('rejects users who have not completed onboarding', () => {
    tokenVerifier.verify.mockResolvedValue({ identity: { sub: 'google-oauth2|1', email: null }, user: null });
    return request(app.getHttpServer()).get('/administrations').set('Authorization', 'Bearer token').expect(403);
  });

  it('rejects roles that are not allowed', () => {
    tokenVerifier.verify.mockResolvedValue({
      identity: { sub: 'google-oauth2|1', email: null },
      user: { role: 'tradesman', userId: 'u1' },
    });
    return request(app.getHttpServer()).get('/properties').set('Authorization', 'Bearer token').expect(403);
  });

  afterEach(async () => {
    await app.close();
  });
});
