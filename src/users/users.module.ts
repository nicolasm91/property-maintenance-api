import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MunicipalitiesModule } from '../municipalities/municipalities.module.js';
import { MeController } from './me.controller.js';
import { MyOrganizationController } from './my-organization.controller.js';
import { TradesmanProfileController } from './tradesman-profile.controller.js';
import { PrismaUsersRepository } from './repositories/prisma/prisma-users.repository.js';
import { UsersRepository } from './repositories/users.repository.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [AuthModule, MunicipalitiesModule],
  controllers: [MeController, MyOrganizationController, TradesmanProfileController],
  providers: [UsersService, { provide: UsersRepository, useClass: PrismaUsersRepository }],
})
export class UsersModule {}
