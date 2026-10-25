import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Identity, isPasswordAccount } from '../auth/auth-user.js';
import { IdentityProvider, ProfileMetadata } from '../auth/identity-provider.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { OnboardDto } from './dto/onboard.dto.js';
import { UpdateTradesDto } from './dto/update-trades.dto.js';
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
      // Onboarding would overwrite a platform owner's claims with a profile.
      if (isPasswordAccount(identity.sub)) {
        throw new ForbiddenException('Platform owner accounts cannot onboard');
      }
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

  async createAdministration(identity: Identity, userId: string, dto: CreateOrganizationDto): Promise<User> {
    const user = await this.users.createAdministration(userId, dto.name);
    if (!user) {
      throw new NotFoundException(`Property manager ${userId} not found`);
    }
    // The administration reaches the token as claims: the front end refreshes it.
    await this.identityProvider.setProfileMetadata(identity.sub, toProfileMetadata(user));
    return user;
  }

  async createCompany(userId: string, dto: CreateOrganizationDto): Promise<User> {
    const user = await this.users.createCompany(userId, dto.name);
    if (!user) {
      throw new NotFoundException(`Contractor ${userId} not found`);
    }
    return user;
  }

  async updateTrades(userId: string, dto: UpdateTradesDto): Promise<User> {
    const user = await this.users.updateTrades(userId, dto.trades);
    if (!user) {
      throw new NotFoundException(`Tradesman ${userId} not found`);
    }
    return user;
  }
}

function toNewProfile(dto: OnboardDto): NewProfile {
  switch (dto.profileType) {
    case 'propertyManager':
      return { role: dto.profileType };
    case 'directClient':
      return { role: dto.profileType, home: dto.home! };
    case 'contractor':
      return { role: dto.profileType };
    case 'tradesman':
      return { role: dto.profileType, trades: dto.trades ?? [] };
  }
}

function toProfileMetadata(user: User): ProfileMetadata {
  if (user.role === 'propertyManager' && user.administration) {
    return {
      userId: user.id,
      role: user.role,
      administrationId: user.administration.id,
      administrationRole: user.administrationRole!,
    };
  }
  return { userId: user.id, role: user.role };
}
