import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AdminUsersController } from './admin-users.controller.js';
import { AdminUsersService } from './admin-users.service.js';
import { AdminUsersRepository } from './repositories/admin-users.repository.js';
import { PrismaAdminUsersRepository } from './repositories/prisma/prisma-admin-users.repository.js';

@Module({
  imports: [AuthModule],
  controllers: [AdminUsersController],
  providers: [AdminUsersService, { provide: AdminUsersRepository, useClass: PrismaAdminUsersRepository }],
})
export class AdminModule {}
