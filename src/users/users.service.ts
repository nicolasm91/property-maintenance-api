import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Identity } from '../auth/auth-user.js';
import { IdentityProvider, ProfileMetadata } from '../auth/identity-provider.js';
import { OnboardDto } from './dto/onboard.dto.js';
import { User } from './entities/user.entity.js';
import { NewProfile, UsersRepository } from './repositories/users.repository.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly users: UsersRepository,
    private readonly identityProvider: IdentityProvider,
  ) {}

  async findMe(identity: Identity): Promise<User> {
    const user = await this.users.findByAuth0Sub(identity.sub);
    if (!user) {
      throw new NotFoundException('Onboarding not completed');
    }
    return user;
  }

  async onboard(identity: Identity, dto: OnboardDto): Promise<User> {
    // An existing User means a previous attempt saved it but failed to update
    // Auth0: retrying syncs the claims again instead of failing.
    let user = await this.users.findByAuth0Sub(identity.sub);
    if (!user) {
      if (!identity.email) {
        throw new ForbiddenException('A verified email is required');
      }
      user = await this.users.create({
        auth0Sub: identity.sub,
        email: identity.email,
        name: dto.name,
        middleName: dto.middleName || null,
        lastName: dto.lastName,
        profile: toNewProfile(dto),
      });
    }
    await this.identityProvider.setProfileMetadata(identity.sub, toProfileMetadata(user));
    return user;
  }
}

function toNewProfile(dto: OnboardDto): NewProfile {
  switch (dto.profileType) {
    case 'propertyManager':
      return { role: dto.profileType, administrationName: dto.administrationName! };
    case 'contractor':
      return { role: dto.profileType, companyName: dto.companyName! };
    case 'tradesman':
      return { role: dto.profileType, trades: dto.trades ?? [] };
  }
}

function toProfileMetadata(user: User): ProfileMetadata {
  if (user.role === 'propertyManager') {
    return {
      userId: user.id,
      role: user.role,
      administrationId: user.administration.id,
      administrationRole: user.administrationRole,
    };
  }
  return { userId: user.id, role: user.role };
}
