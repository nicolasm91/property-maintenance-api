import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IdentityProvider } from '../auth/identity-provider.js';
import { FindAdminUsersQueryDto } from './dto/find-admin-users-query.dto.js';
import { AdminUser } from './entities/admin-user.entity.js';
import { AdminUsersRepository } from './repositories/admin-users.repository.js';

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(
    private readonly users: AdminUsersRepository,
    private readonly identityProvider: IdentityProvider,
  ) {}

  findAll(query: FindAdminUsersQueryDto): Promise<AdminUser[]> {
    return this.users.findAll({ role: query.role, search: query.search || undefined });
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.users.deleteCompletely(id);
    if (!deleted) {
      throw new NotFoundException(`User ${id} not found`);
    }
    // The User is already gone, so this failing is not an error for the caller:
    // stale claims only send the person back to onboarding, which rewrites them.
    try {
      await this.identityProvider.clearProfileMetadata(deleted.auth0Sub);
    } catch (error) {
      this.logger.warn(`Could not clear the claims of ${deleted.auth0Sub}: ${String(error)}`);
    }
  }
}
