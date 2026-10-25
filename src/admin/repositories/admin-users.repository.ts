import { ProfileType } from '../../users/entities/user.entity.js';
import { AdminUser } from '../entities/admin-user.entity.js';

export abstract class AdminUsersRepository {
  abstract findAll(filter: { role?: ProfileType; search?: string }): Promise<AdminUser[]>;
  // Atomic. Deletes the User with everything that depends on it: their tasks
  // (created, assigned, or on their homes) and task events, their homes, and
  // their administration or Company if they were its last member. Returns the
  // deleted User's auth0Sub, or null if there was no such User.
  abstract deleteCompletely(id: string): Promise<{ auth0Sub: string } | null>;
}
