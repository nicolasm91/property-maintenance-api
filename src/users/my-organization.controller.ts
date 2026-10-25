import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser, Identity } from '../auth/auth-user.js';
import { CurrentIdentity } from '../auth/decorators/current-identity.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { ContractorUser, PropertyManagerUser, type User } from './entities/user.entity.js';
import { UsersService } from './users.service.js';

@ApiTags('me')
@Controller('me')
export class MyOrganizationController {
  constructor(private readonly usersService: UsersService) {}

  @Post('administration')
  @Roles('propertyManager')
  @ApiOperation({
    summary:
      "Create the caller's administration, with them as its admin. 409 if they already have one. Refresh the token afterwards: it carries the administration.",
  })
  @ApiCreatedResponse({ type: PropertyManagerUser })
  createAdministration(
    @CurrentIdentity() identity: Identity,
    @CurrentUser() user: AuthUser & { role: 'propertyManager' },
    @Body() dto: CreateOrganizationDto,
  ): Promise<User> {
    return this.usersService.createAdministration(identity, user.userId, dto);
  }

  @Post('company')
  @Roles('contractor')
  @ApiOperation({ summary: "Create the caller's Company. 409 if they already have one." })
  @ApiCreatedResponse({ type: ContractorUser })
  createCompany(
    @CurrentUser() user: AuthUser & { role: 'contractor' },
    @Body() dto: CreateOrganizationDto,
  ): Promise<User> {
    return this.usersService.createCompany(user.userId, dto);
  }
}
