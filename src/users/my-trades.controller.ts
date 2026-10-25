import { Body, Controller, Put } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UpdateTradesDto } from './dto/update-trades.dto.js';
import { TradesmanUser, type User } from './entities/user.entity.js';
import { UsersService } from './users.service.js';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

// Separate from MeController, which allows callers who have not onboarded yet.
@ApiTags('me')
@Controller('me/trades')
@Roles('tradesman')
export class MyTradesController {
  constructor(private readonly usersService: UsersService) {}

  @Put()
  @ApiOkResponse({ type: TradesmanUser })
  @ApiOperation({ summary: "Replace the caller's trades." })
  update(@CurrentUser() user: AuthUser & { role: 'tradesman' }, @Body() dto: UpdateTradesDto): Promise<User> {
    return this.usersService.updateTrades(user.userId, dto);
  }
}
