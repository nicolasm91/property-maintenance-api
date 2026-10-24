import { Body, Controller, Get, Post } from '@nestjs/common';
import type { Identity } from '../auth/auth-user.js';
import { AllowNotOnboarded } from '../auth/decorators/allow-not-onboarded.decorator.js';
import { CurrentIdentity } from '../auth/decorators/current-identity.decorator.js';
import { OnboardDto } from './dto/onboard.dto.js';
import { type User, USER_CLASSES } from './entities/user.entity.js';
import { UsersService } from './users.service.js';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';

const userSchema = { oneOf: USER_CLASSES.map((type) => ({ $ref: getSchemaPath(type) })) };

@ApiTags('me')
@ApiExtraModels(...USER_CLASSES)
@Controller('me')
@AllowNotOnboarded()
export class MeController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOkResponse({ schema: userSchema })
  @ApiOperation({ summary: "The caller's User. 404 before onboarding." })
  findMe(@CurrentIdentity() identity: Identity): Promise<User> {
    return this.usersService.findMe(identity);
  }

  @Post()
  @ApiCreatedResponse({ schema: userSchema })
  @ApiOperation({
    summary:
      "Onboarding: create the caller's User with the chosen profile type. If it already exists, re-sync its Auth0 claims and return it.",
  })
  onboard(@CurrentIdentity() identity: Identity, @Body() dto: OnboardDto): Promise<User> {
    return this.usersService.onboard(identity, dto);
  }
}
