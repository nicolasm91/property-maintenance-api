import { Body, Controller, Get, Post } from '@nestjs/common';
import type { Identity } from '../auth/auth-user.js';
import { AllowNotOnboarded } from '../auth/decorators/allow-not-onboarded.decorator.js';
import { CurrentIdentity } from '../auth/decorators/current-identity.decorator.js';
import { OnboardDto } from './dto/onboard.dto.js';
import type { User } from './entities/user.entity.js';
import { UsersService } from './users.service.js';

@Controller('me')
@AllowNotOnboarded()
export class MeController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findMe(@CurrentIdentity() identity: Identity): Promise<User> {
    return this.usersService.findMe(identity);
  }

  @Post()
  onboard(@CurrentIdentity() identity: Identity, @Body() dto: OnboardDto): Promise<User> {
    return this.usersService.onboard(identity, dto);
  }
}
