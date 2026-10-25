import { createLocalJWKSet, exportJWK, generateKeyPair, type JWTPayload, SignJWT } from 'jose';
import { CLAIMS_NAMESPACE, JoseTokenVerifier } from './jose-token-verifier.js';
import { InvalidTokenError } from './token-verifier.js';

const issuer = 'https://tenant.example.com/';
const audience = 'https://property-maintenance-api';

describe('JoseTokenVerifier', () => {
  let privateKey: CryptoKey;
  let verifier: JoseTokenVerifier;

  beforeAll(async () => {
    const keys = await generateKeyPair('RS256');
    privateKey = keys.privateKey;
    const jwk = { ...(await exportJWK(keys.publicKey)), kid: 'k1', alg: 'RS256' };
    verifier = new JoseTokenVerifier(createLocalJWKSet({ keys: [jwk] }), issuer, audience);
  });

  const sign = (
    claims: Record<string, unknown>,
    options: { issuer?: string; audience?: string; subject?: string } = {},
  ) => {
    const payload: JWTPayload = {};
    for (const [name, value] of Object.entries(claims)) {
      payload[CLAIMS_NAMESPACE + name] = value;
    }
    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .setSubject(options.subject ?? 'google-oauth2|123')
      .setIssuer(options.issuer ?? issuer)
      .setAudience(options.audience ?? audience)
      .setExpirationTime('5m')
      .sign(privateKey);
  };

  it('maps a property manager', async () => {
    const token = await sign({
      role: 'propertyManager',
      userId: 'u1',
      administrationId: 'a1',
      administrationRole: 'admin',
    });

    await expect(verifier.verify(token)).resolves.toEqual({
      identity: { sub: 'google-oauth2|123', email: null },
      user: { role: 'propertyManager', userId: 'u1', administrationId: 'a1', administrationRole: 'admin' },
    });
  });

  it('maps a property manager who has not created their administration yet', async () => {
    await expect(verifier.verify(await sign({ role: 'propertyManager', userId: 'u1' }))).resolves.toMatchObject({
      user: { role: 'propertyManager', userId: 'u1', administrationId: null, administrationRole: null },
    });
  });

  it('maps the platform owner of a password account, without userId', async () => {
    const token = await sign({ role: 'platformOwner' }, { subject: 'auth0|admin' });

    await expect(verifier.verify(token)).resolves.toMatchObject({ user: { role: 'platformOwner' } });
  });

  it('rejects the platform owner role on an SSO account', async () => {
    await expect(verifier.verify(await sign({ role: 'platformOwner' }))).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it('maps other profiles with their userId', async () => {
    await expect(verifier.verify(await sign({ role: 'tradesman', userId: 'u2' }))).resolves.toMatchObject({
      user: { role: 'tradesman', userId: 'u2' },
    });
  });

  it('returns only the identity for a token without profile claims', async () => {
    await expect(verifier.verify(await sign({ email: 'ana@example.com' }))).resolves.toEqual({
      identity: { sub: 'google-oauth2|123', email: 'ana@example.com' },
      user: null,
    });
  });

  it.each([
    ['an unknown role', { role: 'superAdmin', userId: 'u1' }],
    ['a missing userId', { role: 'directClient' }],
    [
      'an administrationRole without administration',
      { role: 'propertyManager', userId: 'u1', administrationRole: 'admin' },
    ],
    [
      'an invalid administrationRole',
      { role: 'propertyManager', userId: 'u1', administrationId: 'a1', administrationRole: 'owner' },
    ],
  ])('rejects %s', async (_case, claims) => {
    await expect(verifier.verify(await sign(claims))).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it('rejects another audience', async () => {
    const token = await sign({ role: 'platformOwner' }, { audience: 'https://other-api' });
    await expect(verifier.verify(token)).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it('rejects another issuer', async () => {
    const token = await sign({ role: 'platformOwner' }, { issuer: 'https://evil.example.com/' });
    await expect(verifier.verify(token)).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it('rejects a token signed with another key', async () => {
    const other = await generateKeyPair('RS256');
    const token = await new SignJWT({ [CLAIMS_NAMESPACE + 'role']: 'platformOwner' })
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setExpirationTime('5m')
      .sign(other.privateKey);
    await expect(verifier.verify(token)).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it('rejects a malformed token', async () => {
    await expect(verifier.verify('not-a-jwt')).rejects.toBeInstanceOf(InvalidTokenError);
  });
});
