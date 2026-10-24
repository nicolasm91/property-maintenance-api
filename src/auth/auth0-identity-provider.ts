import { BadGatewayException, Logger } from '@nestjs/common';
import { IdentityProvider, ProfileMetadata } from './identity-provider.js';

interface ManagementToken {
  value: string;
  expiresAt: number;
}

export class Auth0IdentityProvider extends IdentityProvider {
  private readonly logger = new Logger(Auth0IdentityProvider.name);
  private token: ManagementToken | null = null;

  constructor(
    private readonly domain: string,
    private readonly clientId: string,
    private readonly clientSecret: string,
  ) {
    super();
  }

  setProfileMetadata(sub: string, metadata: ProfileMetadata): Promise<void> {
    return this.patchAppMetadata(sub, metadata);
  }

  // Auth0 merges app_metadata: a null value removes that key.
  clearProfileMetadata(sub: string): Promise<void> {
    return this.patchAppMetadata(sub, { userId: null, role: null, administrationId: null, administrationRole: null });
  }

  private async patchAppMetadata(sub: string, appMetadata: object) {
    const response = await fetch(`https://${this.domain}/api/v2/users/${encodeURIComponent(sub)}`, {
      method: 'PATCH',
      headers: { authorization: `Bearer ${await this.managementToken()}`, 'content-type': 'application/json' },
      body: JSON.stringify({ app_metadata: appMetadata }),
    });
    if (!response.ok) {
      this.logger.error(`Updating app_metadata of ${sub} failed: ${response.status} ${await response.text()}`);
      throw new BadGatewayException('Could not update the identity provider');
    }
  }

  private async managementToken() {
    // Renew a minute early so the token doesn't expire mid-request.
    if (this.token && this.token.expiresAt - 60_000 > Date.now()) {
      return this.token.value;
    }
    const response = await fetch(`https://${this.domain}/oauth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        audience: `https://${this.domain}/api/v2/`,
      }),
    });
    if (!response.ok) {
      this.logger.error(`Getting a Management API token failed: ${response.status} ${await response.text()}`);
      throw new BadGatewayException('Could not reach the identity provider');
    }
    const body = (await response.json()) as { access_token: string; expires_in: number };
    this.token = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
    return this.token.value;
  }
}
