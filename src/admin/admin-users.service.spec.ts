import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IdentityProvider } from '../auth/identity-provider.js';
import { AdminUsersService } from './admin-users.service.js';
import { AdminUsersRepository } from './repositories/admin-users.repository.js';

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  const repository = { findAll: vi.fn(), deleteCompletely: vi.fn() };
  const identityProvider = { setProfileMetadata: vi.fn(), clearProfileMetadata: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        { provide: AdminUsersRepository, useValue: repository },
        { provide: IdentityProvider, useValue: identityProvider },
      ],
    }).compile();
    service = module.get(AdminUsersService);
  });

  it('filters by role and search, ignoring a blank search', async () => {
    await service.findAll({ role: 'tradesman', search: '' });

    expect(repository.findAll).toHaveBeenCalledWith({ role: 'tradesman', search: undefined });
  });

  it('deletes the User and clears their claims', async () => {
    repository.deleteCompletely.mockResolvedValue({ auth0Sub: 'google-oauth2|1' });

    await service.delete('u1');

    expect(repository.deleteCompletely).toHaveBeenCalledWith('u1');
    expect(identityProvider.clearProfileMetadata).toHaveBeenCalledWith('google-oauth2|1');
  });

  it('still succeeds when the claims cannot be cleared', async () => {
    repository.deleteCompletely.mockResolvedValue({ auth0Sub: 'google-oauth2|1' });
    identityProvider.clearProfileMetadata.mockRejectedValue(new Error('Auth0 is down'));

    await expect(service.delete('u1')).resolves.toBeUndefined();
  });

  it('throws 404 when the User does not exist', async () => {
    repository.deleteCompletely.mockResolvedValue(null);

    await expect(service.delete('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(identityProvider.clearProfileMetadata).not.toHaveBeenCalled();
  });
});
