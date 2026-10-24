import { Body, Controller, Put } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UpdateTradesDto } from './dto/update-trades.dto.js';
import type { User } from './entities/user.entity.js';
import { UsersService } from './users.service.js';

// Separate from MeController, which allows callers who have not onboarded yet.
@Controller('me/trades')
@Roles('tradesman')
export class MyTradesController {
  constructor(private readonly usersService: UsersService) {}

  @Put()
  update(@CurrentUser() user: AuthUser & { role: 'tradesman' }, @Body() dto: UpdateTradesDto): Promise<User> {
    return this.usersService.updateTrades(user.userId, dto);
  }
}
