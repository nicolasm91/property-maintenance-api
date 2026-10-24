import { Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { AdminUsersService } from './admin-users.service.js';
import { FindAdminUsersQueryDto } from './dto/find-admin-users-query.dto.js';
import { AdminUser } from './entities/admin-user.entity.js';

@ApiTags('admin')
@Controller('admin/users')
@Roles('platformOwner')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'List every User, newest first, optionally by role or matching a search.' })
  findAll(@Query() query: FindAdminUsersQueryDto): Promise<AdminUser[]> {
    return this.adminUsersService.findAll(query);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'The User and everything that depends on it were deleted.' })
  @ApiOperation({
    summary: 'Force-delete a User with everything that depends on it, and clear their Auth0 profile claims.',
  })
  delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.adminUsersService.delete(id);
  }
}
