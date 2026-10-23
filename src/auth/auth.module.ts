import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { createRemoteJWKSet } from 'jose';
import { Auth0IdentityProvider } from './auth0-identity-provider.js';
import { AuthGuard } from './auth.guard.js';
import { IdentityProvider } from './identity-provider.js';
import { JoseTokenVerifier } from './jose-token-verifier.js';
import { TokenVerifier } from './token-verifier.js';

@Module({
  providers: [
    {
      provide: TokenVerifier,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const domain = config.getOrThrow<string>('AUTH0_DOMAIN');
        return new JoseTokenVerifier(
          createRemoteJWKSet(new URL(`https://${domain}/.well-known/jwks.json`)),
          `https://${domain}/`,
          config.getOrThrow<string>('AUTH0_AUDIENCE'),
        );
      },
    },
    {
      provide: IdentityProvider,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Auth0IdentityProvider(
          config.getOrThrow<string>('AUTH0_DOMAIN'),
          config.getOrThrow<string>('AUTH0_MGMT_CLIENT_ID'),
          config.getOrThrow<string>('AUTH0_MGMT_CLIENT_SECRET'),
        ),
    },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [IdentityProvider],
})
export class AuthModule {}
